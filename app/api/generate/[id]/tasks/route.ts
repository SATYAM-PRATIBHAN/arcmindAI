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
import { TaskGenerationSystemPrompt } from "@/lib/prompts/taskGenerationPrompt";
import { getUserApiKeys } from "@/lib/api-keys/getUserApiKeys";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const startTime = Date.now();
  const route = "/api/generate/[id]/tasks";
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
      return NextResponse.json({ status: 404, message: "User not Found" });
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

    // Check if tasks already exist in the database
    if (generation.tasksData) {
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json({
        success: true,
        tasks: generation.tasksData,
        fromCache: true,
      });
    }

    // Tasks don't exist, generate them using AI
    aiGenerationRequestsTotal.inc();

    // Prepare the architecture data for AI
    let architectureData;
    if (generation.githubGeneration) {
      architectureData = {
        type: "github",
        userInput: generation.userInput,
        mermaidDiagram: generation.githubGeneration,
      };
    } else {
      architectureData = {
        type: "standard",
        userInput: generation.userInput,
        architecture: generation.generatedOutput,
      };
    }

    const messages = [
      new SystemMessage(TaskGenerationSystemPrompt),
      new HumanMessage(
        `Generate a comprehensive task breakdown for the following system architecture:\n\n${JSON.stringify(architectureData, null, 2)}`,
      ),
    ];

    // 🔑 Fetch user's API keys
    // @ts-expect-error id is added to the session in the session callback
    const userApiKeys = await getUserApiKeys(session.user.id);

    const aiStart = Date.now();
    const { response: aiResponse } = await invokeGeminiWithFallback(
      messages,
      userApiKeys.geminiApiKey,
    );
    const aiDuration = (Date.now() - aiStart) / 1000;
    aiGenerationDurationSeconds.observe(aiDuration);

    if (!aiResponse || !aiResponse.content) {
      aiGenerationFailureTotal.inc();
      throw new Error("Empty AI response received.");
    }

    const responseContent =
      typeof aiResponse.content === "string"
        ? aiResponse.content
        : JSON.stringify(aiResponse.content);

    // Parse the AI response
    let tasksData;
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = responseContent
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      tasksData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      aiGenerationFailureTotal.inc();
      throw new Error("Failed to parse task data from AI response");
    }

    // Validate the structure
    if (!tasksData.tasks || !Array.isArray(tasksData.tasks)) {
      aiGenerationFailureTotal.inc();
      throw new Error("Invalid task data structure from AI");
    }

    // Store the generated tasks in the database
    const dbUpdateStart = Date.now();
    await db.generation.update({
      where: { id: generationId },
      data: { tasksData: tasksData },
    });
    databaseQueryDurationSeconds.observe(
      { operation: "update" },
      (Date.now() - dbUpdateStart) / 1000,
    );

    // Increment success counters
    aiGenerationSuccessTotal.inc();

    // Track total HTTP duration
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000,
    );

    return NextResponse.json({
      success: true,
      tasks: tasksData,
      fromCache: false,
    });
  } catch (error) {
    console.error("Error generating tasks:", error);
    apiGatewayErrorsTotal.inc({ status_code: "500" });
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000,
    );
    const errorMessage =
      error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 },
    );
  }
}
