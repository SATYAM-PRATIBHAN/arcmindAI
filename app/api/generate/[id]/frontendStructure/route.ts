import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { openAiLLM } from "@/lib/ai/helperClient";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { FRONTEND_GENERATION_PROMPT } from "@/app/(protected)/generate/utils/createFrontendStackandStructure";
import {
  httpRequestsTotal,
  httpRequestDurationSeconds,
  apiGatewayErrorsTotal,
  databaseQueryDurationSeconds,
  aiGenerationRequestsTotal,
  aiGenerationSuccessTotal,
  aiGenerationFailureTotal,
  aiGenerationDurationSeconds,
  aiGenerationOutputSizeBytes,
  userGenerationsTotal,
  userLastActivityTimestamp,
  cacheHitsTotal,
} from "@/lib/metrics";

function cleanJsonOutput(content: string): string {
  let cleaned = content.replace(/^```json\s*/i, "").replace(/^```\s*/, "");
  cleaned = cleaned.replace(/\s*```$/, "");
  return cleaned.trim();
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const route = "/api/generate/[id]/frontendStructure";
  const method = "POST";
  const end = httpRequestDurationSeconds.startTimer({ route });

  try {
    const session = await getServerSession(authOptions);

    // @ts-expect-error id is added to the session in the session callback
    if (!session?.user?.id) {
      httpRequestsTotal.inc({ route, method, status_code: "401" });
      apiGatewayErrorsTotal.inc({ status_code: "401" });
      end();
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const dbEndUser = databaseQueryDurationSeconds.startTimer({
      operation: "user_find",
    });
    const user = await db.user.findFirst({
      where: {
        // @ts-expect-error id is added to the session in the session callback
        id: session?.user?.id,
      },
    });
    dbEndUser();

    if (!user) {
      httpRequestsTotal.inc({ route, method, status_code: "404" });
      apiGatewayErrorsTotal.inc({ status_code: "404" });
      end();
      return NextResponse.json({ status: 404, message: "User not Found" });
    }

    if (user?.isVerified === false) {
      httpRequestsTotal.inc({ route, method, status_code: "401" });
      apiGatewayErrorsTotal.inc({ status_code: "401" });
      end();
      return NextResponse.json({
        status: 401,
        message: "Email is not verified",
      });
    }

    if (user?.plan == "free") {
      httpRequestsTotal.inc({ route, method, status_code: "401" });
      apiGatewayErrorsTotal.inc({ status_code: "401" });
      end();
      return NextResponse.json({
        status: 401,
        message: "Purchase the pro version to use this feature",
      });
    }

    const { id: generationId } = await params;

    const dbEndGen = databaseQueryDurationSeconds.startTimer({
      operation: "generation_find",
    });
    const generation = await db.generation.findFirst({
      where: {
        id: generationId,
        // @ts-expect-error id is added to the session in the session callback
        userId: session.user.id,
      },
    });
    dbEndGen();

    if (!generation) {
      httpRequestsTotal.inc({ route, method, status_code: "400" });
      apiGatewayErrorsTotal.inc({ status_code: "400" });
      end();
      return NextResponse.json({
        status: 400,
        message: "Generation not found",
      });
    }

    if (generation.frontendData) {
      cacheHitsTotal.inc();
      httpRequestsTotal.inc({ route, method, status_code: "200" });
      end();
      return NextResponse.json({
        success: true,
        data: generation.frontendData,
      });
    }

    const messages = [
      new SystemMessage(FRONTEND_GENERATION_PROMPT),
      new HumanMessage(`Architecture Data: ${JSON.stringify(generation.generatedOutput)}

Generate a complete frontend architecture for this backend system.`),
    ];

    aiGenerationRequestsTotal.inc();
    const aiEnd = aiGenerationDurationSeconds.startTimer();

    const response = await openAiLLM.invoke(messages);

    // @ts-expect-error id is added to the session in the session callback
    userGenerationsTotal.inc({ user_id: session.user.id });

    let content: string;
    if (typeof response.content === "string") {
      content = response.content;
    } else if (Array.isArray(response.content)) {
      content = response.content
        .map((item) =>
          typeof item === "string"
            ? item
            : typeof item === "object" && "text" in item
              ? String(item.text)
              : "",
        )
        .join("");
    } else {
      throw new Error("Unexpected response content format");
    }

    aiGenerationSuccessTotal.inc();
    // @ts-expect-error id is added to the session in the session callback
    userGenerationsTotal.inc({ user_id: session.user.id });
    aiEnd();
    aiGenerationOutputSizeBytes.set(Buffer.byteLength(content, "utf8"));

    const frontendArchitecture = JSON.parse(cleanJsonOutput(content));

    const dbEndGenUp = databaseQueryDurationSeconds.startTimer({
      operation: "generation_find",
    });
    await db.generation.update({
      where: {
        id: generationId,
      },
      data: {
        frontendData: frontendArchitecture,
      },
    });
    dbEndGenUp();

    userLastActivityTimestamp.set(
      // @ts-expect-error id is added to the session in the session callback
      { user_id: session.user.id },
      Date.now() / 1000,
    );

    return NextResponse.json({
      success: true,
      data: frontendArchitecture,
    });
  } catch (err) {
    console.error("Frontend structure generation error:", err);
    aiGenerationFailureTotal.inc();
    httpRequestsTotal.inc({ route, method, status_code: "500" });
    apiGatewayErrorsTotal.inc({ status_code: "500" });
    end();
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 },
    );
  }
}
