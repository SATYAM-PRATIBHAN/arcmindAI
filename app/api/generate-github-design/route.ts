import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { GithubRepoSystemPrompt } from "@/lib/prompts/githubRepoPrompt";
import { formatRepositoryAnalysisForAI } from "@/app/(protected)/generate/utils/formatRepoAnalysis";
import { RepositoryAnalysis } from "@/types/repository-analysis";
import { db } from "@/lib/prisma";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { invokeGeminiWithFallback } from "@/app/(protected)/generate/utils/aiClient";
import { getUserApiKeys } from "@/lib/api-keys/getUserApiKeys";
import {
  httpRequestsTotal,
  httpRequestDurationSeconds,
  apiGatewayErrorsTotal,
  databaseQueryDurationSeconds,
  aiGenerationRequestsTotal,
  aiGenerationSuccessTotal,
  aiGenerationFailureTotal,
  aiGenerationDurationSeconds,
  cacheHitsTotal,
  userLastActivityTimestamp,
} from "@/lib/metrics";

interface GenerateGithubDesignRequest {
  owner: string;
  repo: string;
  analysisData: RepositoryAnalysis;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const route = "/api/generate-github-design";
  const method = "POST";
  httpRequestsTotal.inc({ route, method });

  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    // @ts-expect-error id is added to session in NextAuth callbacks
    const userId = session?.user?.id;

    if (!userId) {
      apiGatewayErrorsTotal.inc({ status_code: "401" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    // Update user activity
    userLastActivityTimestamp.set({ user_id: userId }, Date.now() / 1000);

    const body: GenerateGithubDesignRequest = await request.json();
    const { owner, repo, analysisData } = body;

    if (!owner || !repo || !analysisData) {
      apiGatewayErrorsTotal.inc({ status_code: "400" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: owner, repo, or analysisData",
        },
        { status: 400 },
      );
    }

    // Check if a design already exists for this repository
    const repoIdentifier = `${repo}`;
    const dbStart = Date.now();
    const existingGeneration = await db.generation.findFirst({
      where: {
        userId: userId,
        userInput: repoIdentifier,
        githubGeneration: {
          not: null,
        },
      },
      orderBy: {
        createdAt: "desc", // Get the most recent one
      },
    });
    databaseQueryDurationSeconds.observe(
      { operation: "findFirst" },
      (Date.now() - dbStart) / 1000,
    );

    // If design already exists, return it from cache
    if (existingGeneration?.githubGeneration) {
      cacheHitsTotal.inc();
      httpRequestsTotal.inc({ route, method, status_code: "200" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json({
        success: true,
        generationId: existingGeneration.id,
        mermaidDiagram: existingGeneration.githubGeneration,
        cached: true, // Indicate this is from cache
      });
    }

    // Format analysis data for AI
    const userMessage = formatRepositoryAnalysisForAI(
      owner,
      repo,
      analysisData,
    );

    // Call AI to generate Mermaid diagram
    const messages = [
      new SystemMessage(GithubRepoSystemPrompt),
      new HumanMessage(userMessage),
    ];

    // 🔑 Fetch user's API keys
    const userApiKeys = await getUserApiKeys(userId);

    // Increment AI generation request counter
    aiGenerationRequestsTotal.inc();

    const aiStart = Date.now();
    const { response } = await invokeGeminiWithFallback(
      messages,
      userApiKeys.geminiApiKey,
    );
    const aiDuration = (Date.now() - aiStart) / 1000;
    aiGenerationDurationSeconds.observe(aiDuration);

    let mermaidDiagram = response.content as string;

    // Clean up the response - remove markdown code blocks if present
    mermaidDiagram = mermaidDiagram
      .replace(/```mermaid\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // Save to database
    const dbStart2 = Date.now();
    const generation = await db.generation.create({
      data: {
        userInput: repoIdentifier,
        githubGeneration: mermaidDiagram,
        userId: userId,
      },
    });
    databaseQueryDurationSeconds.observe(
      { operation: "create" },
      (Date.now() - dbStart2) / 1000,
    );

    // Increment success counters
    aiGenerationSuccessTotal.inc();

    // Track total HTTP duration
    httpRequestsTotal.inc({ route, method, status_code: "200" });
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000,
    );

    return NextResponse.json({
      success: true,
      generationId: generation.id,
      mermaidDiagram,
      cached: false, // Indicate this is newly generated
    });
  } catch (error) {
    console.error("GitHub design generation error:", error);

    aiGenerationFailureTotal.inc();

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
        error: isApiKeyError
          ? "Gemini API error. Please provide your own API key or try again later."
          : errorMessage,
      },
      { status },
    );
  }
}
