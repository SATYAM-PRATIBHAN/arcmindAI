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
  cacheHitsTotal,
  aiGenerationRequestsTotal,
  aiGenerationSuccessTotal,
  aiGenerationFailureTotal,
  aiGenerationDurationSeconds,
  aiGenerationOutputSizeBytes,
  userGenerationsTotal,
} from "@/lib/metrics";
import { invokeGeminiWithFallback } from "@/app/(protected)/generate/utils/aiClient";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { UpdateSystemPrompt } from "@/lib/prompts/updateSystemPrompt";
import { getUserApiKeys } from "@/lib/api-keys/getUserApiKeys";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const startTime = Date.now();
  const route = "/api/generate/[id]";
  const method = "GET";
  httpRequestsTotal.inc({ route, method });

  try {
    const session = await getServerSession(authOptions);

    // @ts-expect-error id is added to the session in the session callback
    if (!session?.user?.id) {
      apiGatewayErrorsTotal.inc({ status_code: "401" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
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
      (Date.now() - dbStart1) / 1000,
    );

    if (!user) {
      apiGatewayErrorsTotal.inc({ status_code: "404" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      NextResponse.json({ status: 404, message: "User not Found" });
    }

    if (user?.isVerified === false) {
      apiGatewayErrorsTotal.inc({ status_code: "401" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
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
      Date.now() / 1000,
    );

    // Increment cache hits (assuming fetching generation is a cache hit if cached)
    cacheHitsTotal.inc();

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
      (Date.now() - dbStart) / 1000,
    );

    if (!generation) {
      apiGatewayErrorsTotal.inc({ status_code: "404" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        { success: false, message: "Generation not found" },
        { status: 404 },
      );
    }

    // Track total HTTP duration
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000,
    );

    return NextResponse.json({
      success: true,
      output: generation,
    });
  } catch (error) {
    console.error("Error fetching generation:", error);
    apiGatewayErrorsTotal.inc({ status_code: "500" });
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000,
    );
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const startTime = Date.now();
  const route = "/api/generate/[id]";
  const method = "DELETE";
  httpRequestsTotal.inc({ route, method });

  try {
    const session = await getServerSession(authOptions);

    // @ts-expect-error id is added to the session in the session callback
    if (!session?.user?.id) {
      apiGatewayErrorsTotal.inc({ status_code: "401" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id: generationId } = await params;

    // Update user activity
    userLastActivityTimestamp.set(
      // @ts-expect-error id is added to the session in the session callback
      { user_id: session.user.id },
      Date.now() / 1000,
    );

    const dbStart = Date.now();
    const generation = await db.generation.delete({
      where: {
        id: generationId,
        // @ts-expect-error id is added to the session in the session callback
        userId: session.user.id,
      },
    });
    databaseQueryDurationSeconds.observe(
      { operation: "delete" },
      (Date.now() - dbStart) / 1000,
    );

    if (!generation) {
      apiGatewayErrorsTotal.inc({ status_code: "404" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        { success: false, message: "Generation not found" },
        { status: 404 },
      );
    }

    // Track total HTTP duration
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000,
    );

    return NextResponse.json({
      success: true,
      output: generation,
    });
  } catch (error) {
    console.error("Error fetching generation:", error);
    apiGatewayErrorsTotal.inc({ status_code: "500" });
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000,
    );
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const startTime = Date.now();
  const route = "/api/generate/[id]";
  const method = "PUT";
  httpRequestsTotal.inc({ route, method });

  try {
    const session = await getServerSession(authOptions);

    // @ts-expect-error id is added to the session in the session callback
    if (!session?.user?.id) {
      apiGatewayErrorsTotal.inc({ status_code: "401" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
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
      (Date.now() - dbStart1) / 1000,
    );

    if (!user) {
      apiGatewayErrorsTotal.inc({ status_code: "404" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    if (user?.isVerified === false) {
      apiGatewayErrorsTotal.inc({ status_code: "401" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        { success: false, message: "Email is not verified" },
        { status: 401 },
      );
    }

    const { id: generationId } = await params;

    // Update user activity
    userLastActivityTimestamp.set(
      // @ts-expect-error id is added to the session in the session callback
      { user_id: session.user.id },
      Date.now() / 1000,
    );

    // Increment AI generation request counter
    aiGenerationRequestsTotal.inc();

    const { userInput } = await request.json();

    const dbStart2 = Date.now();
    const originalResponse = await db.generation.findFirst({
      where: {
        id: generationId,
        // @ts-expect-error id is added to the session in the session callback
        userId: session.user.id,
      },
    });
    databaseQueryDurationSeconds.observe(
      { operation: "findFirst" },
      (Date.now() - dbStart2) / 1000,
    );

    if (!originalResponse) {
      apiGatewayErrorsTotal.inc({ status_code: "404" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        { success: false, message: "Generation not found" },
        { status: 404 },
      );
    }

    const messages = [
      new SystemMessage(UpdateSystemPrompt),
      new HumanMessage(`Original generated content: ${JSON.stringify(originalResponse.generatedOutput)}

User feedback/input for update: ${userInput}`),
    ];

    // 🔑 Fetch user's API keys
    // @ts-expect-error id is added to the session in the session callback
    const userApiKeys = await getUserApiKeys(session.user.id);

    const aiStart = Date.now();
    const { response: newGeneratedOutput } = await invokeGeminiWithFallback(
      messages,
      userApiKeys.geminiApiKey,
    );
    const aiDuration = (Date.now() - aiStart) / 1000;
    aiGenerationDurationSeconds.observe(aiDuration);

    if (!newGeneratedOutput || !newGeneratedOutput.content) {
      aiGenerationFailureTotal.inc();
      throw new Error("Empty AI response received.");
    }

    const finalAIresponse = newGeneratedOutput.content;

    // Step 1: Convert response to string
    const raw =
      typeof finalAIresponse === "string"
        ? finalAIresponse
        : JSON.stringify(finalAIresponse);

    // Step 2: Extract JSON block
    let jsonText = raw;

    const jsonStart = jsonText.indexOf("```json");
    if (jsonStart !== -1) {
      jsonText = jsonText.slice(jsonStart + 7);
    }

    const jsonEnd = jsonText.lastIndexOf("```");
    if (jsonEnd !== -1) {
      jsonText = jsonText.slice(0, jsonEnd);
    }

    jsonText = jsonText.trim();
    if (!jsonText) throw new Error("No JSON content found in AI response");

    // Step 3: Parse initial JSON
    const parsedData = JSON.parse(jsonText);

    // Step 4: Clean "Architecture Diagram" field
    if (parsedData && typeof parsedData["Architecture Diagram"] === "string") {
      let diagram = parsedData["Architecture Diagram"];
      diagram = diagram
        .replace(/```mermaid/g, "")
        .replace(/```/g, "")
        .trim();
      parsedData["Architecture Diagram"] = diagram;
    }

    const dbStart3 = Date.now();
    const generation = await db.generation.update({
      where: {
        id: generationId,
        // @ts-expect-error id is added to the session in the session callback
        userId: session.user.id,
      },
      data: {
        generatedOutput: parsedData,
      },
    });
    databaseQueryDurationSeconds.observe(
      { operation: "update" },
      (Date.now() - dbStart3) / 1000,
    );

    // Increment success counters
    aiGenerationSuccessTotal.inc();
    // @ts-expect-error id is added to the session in the session callback
    userGenerationsTotal.inc({ user_id: session.user.id });

    // Set output size
    aiGenerationOutputSizeBytes.set(JSON.stringify(parsedData).length);

    // Track total HTTP duration
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000,
    );

    return NextResponse.json({
      success: true,
      output: generation,
    });
  } catch (error) {
    console.error("Error updating generation:", error);

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
      (Date.now() - startTime) / 1000,
    );

    return NextResponse.json(
      {
        success: false,
        message: isApiKeyError
          ? "Gemini API error. Please provide your own API key or try again later."
          : "Internal server error",
      },
      { status },
    );
  }
}
