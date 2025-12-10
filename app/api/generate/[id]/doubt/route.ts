import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/prisma";
import {
  httpRequestsTotal,
  httpRequestDurationSeconds,
  apiGatewayErrorsTotal,
  databaseQueryDurationSeconds,
  userLastActivityTimestamp,
  aiGenerationRequestsTotal,
  aiGenerationSuccessTotal,
  aiGenerationFailureTotal,
  aiGenerationDurationSeconds,
} from "@/lib/metrics";
import { invokeGeminiWithFallback } from "@/app/(protected)/generate/utils/aiClient";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { DoubtSystemPrompt } from "@/lib/prompts/askDoubtPrompt";
import { getUserApiKeys } from "@/lib/api-keys/getUserApiKeys";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const route = "/api/generate/[id]/doubt";
  const method = "POST";
  httpRequestsTotal.inc({ route, method });

  try {
    const session = await getServerSession(authOptions);

    // @ts-expect-error id is added to the session in the session callback
    if (!session?.user?.id) {
      apiGatewayErrorsTotal.inc({ status_code: "401" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000
      );
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const dbStart1 = Date.now();
    const user = await db.user.findFirst({
      where: {
        // @ts-expect-error id is added to the session in the session callback
        id: session?.user?.id,
      },
    });
    databaseQueryDurationSeconds.observe(
      { operation: "findFirst" },
      (Date.now() - dbStart1) / 1000
    );

    if (!user) {
      apiGatewayErrorsTotal.inc({ status_code: "404" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000
      );
      return NextResponse.json({ status: 404, message: "User not Found" });
    }

    if (user?.isVerified === false) {
      apiGatewayErrorsTotal.inc({ status_code: "401" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000
      );
      return NextResponse.json({
        status: 401,
        message: "Email is not verified",
      });
    }

    const { id: generationId } = await params;

    // Update user activity
    userLastActivityTimestamp.set(
      // @ts-expect-error id is added to the session in the session callback
      { user_id: session.user.id },
      Date.now() / 1000
    );

    const { question, conversationHistory } = await request.json();

    if (!question || typeof question !== "string" || !question.trim()) {
      apiGatewayErrorsTotal.inc({ status_code: "400" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000
      );
      return NextResponse.json(
        { success: false, message: "Question is required" },
        { status: 400 }
      );
    }

    // Fetch the generation
    const dbStart = Date.now();
    const generation = await db.generation.findFirst({
      where: {
        id: generationId,
        // @ts-expect-error id is added to the session in the session callback
        userId: session.user.id,
      },
    });
    databaseQueryDurationSeconds.observe(
      { operation: "findFirst" },
      (Date.now() - dbStart) / 1000
    );

    if (!generation) {
      apiGatewayErrorsTotal.inc({ status_code: "404" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000
      );
      return NextResponse.json(
        { success: false, message: "Generation not found" },
        { status: 404 }
      );
    }

    // Increment AI generation request counter
    aiGenerationRequestsTotal.inc();

    let messages;

    // Build conversation context from history
    const contextMessages = [];
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const item of conversationHistory) {
        contextMessages.push(new HumanMessage(item.question));
        contextMessages.push(
          new HumanMessage(`Assistant's previous answer: ${item.answer}`)
        );
      }
    }

    if (generation.githubGeneration) {
      messages = [
        new SystemMessage(DoubtSystemPrompt),
        new HumanMessage(
          `Architecture Data: ${JSON.stringify(generation.githubGeneration)}`
        ),
        ...contextMessages,
        new HumanMessage(`User Question: ${question}`),
      ];
    } else {
      messages = [
        new SystemMessage(DoubtSystemPrompt),
        new HumanMessage(
          `Architecture Data: ${JSON.stringify(generation.generatedOutput)}`
        ),
        ...contextMessages,
        new HumanMessage(`User Question: ${question}`),
      ];
    }

    // 🔑 Fetch user's API keys
    // @ts-expect-error id is added to the session in the session callback
    const userApiKeys = await getUserApiKeys(session.user.id);

    const aiStart = Date.now();
    const { response: aiResponse } = await invokeGeminiWithFallback(
      messages,
      userApiKeys.geminiApiKey
    );
    const aiDuration = (Date.now() - aiStart) / 1000;
    aiGenerationDurationSeconds.observe(aiDuration);

    if (!aiResponse || !aiResponse.content) {
      aiGenerationFailureTotal.inc();
      throw new Error("Empty AI response received.");
    }

    const answer =
      typeof aiResponse.content === "string"
        ? aiResponse.content
        : JSON.stringify(aiResponse.content);

    // Increment success counters
    aiGenerationSuccessTotal.inc();

    // Track total HTTP duration
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000
    );

    return NextResponse.json({
      success: true,
      answer: answer.trim(),
    });
  } catch (error) {
    console.error("Error answering doubt:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Check if it's an API key/rate limit error
    const isApiKeyError =
      errorMessage.toLowerCase().includes("api key") ||
      errorMessage.toLowerCase().includes("rate limit") ||
      errorMessage.toLowerCase().includes("quota") ||
      errorMessage.toLowerCase().includes("429") ||
      errorMessage.toLowerCase().includes("insufficient_quota") ||
      errorMessage.toLowerCase().includes("unauthorized") ||
      errorMessage.toLowerCase().includes("authentication");

    const status = isApiKeyError ? 503 : 500;

    apiGatewayErrorsTotal.inc({ status_code: status.toString() });
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000
    );

    return NextResponse.json(
      {
        success: false,
        message: isApiKeyError
          ? "Gemini API error. Please provide your own API key or try again later."
          : errorMessage,
      },
      { status }
    );
  }
}
