import { invokeGeminiWithFallback } from "@/app/(protected)/generate/utils/aiClient";
import { formatRepositoryAnalysisForAI } from "@/app/(protected)/generate/utils/formatRepoAnalysis";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getUserApiKeys } from "@/lib/api-keys/getUserApiKeys";
import {
  aiGenerationDurationSeconds,
  aiGenerationFailureTotal,
  aiGenerationRequestsTotal,
  aiGenerationSuccessTotal,
  databaseQueryDurationSeconds,
  httpRequestsTotal,
} from "@/lib/metrics";
import { db } from "@/lib/prisma";
import { GithubRepoSystemPrompt } from "@/lib/prompts/githubRepoPrompt";
import { RepositoryAnalysis } from "@/types/repository-analysis";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

interface GenerateGithubDesignRequest {
  owner: string;
  repo: string;
  analysisData: RepositoryAnalysis;
  branch?: string;
}

export async function POST(request: NextRequest) {
  const route = "/api/generate-github-design";
  const method = "POST";
  let aiRequested = false;
  let aiFailureRecorded = false;

  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    // @ts-expect-error id is added to session in NextAuth callbacks
    const userId = session?.user?.id;

    if (!userId) {
      httpRequestsTotal.inc({ route, method, status_code: "401" });
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body: GenerateGithubDesignRequest = await request.json();
    const { owner, repo, branch, analysisData } = body;

    if (!owner || !repo || !analysisData) {
      httpRequestsTotal.inc({ route, method, status_code: "400" });
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: owner, repo, or analysisData",
        },
        { status: 400 },
      );
    }

    // Check if a design already exists for this repository
    const repoIdentifier = branch
      ? `${owner}/${repo}:${branch}`
      : `${owner}/${repo}`;
    const dbFindStart = Date.now();
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
      (Date.now() - dbFindStart) / 1000,
    );

    // If design already exists, return it from cache
    if (existingGeneration?.githubGeneration) {
      httpRequestsTotal.inc({ route, method, status_code: "200" });
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

    aiGenerationRequestsTotal.inc();
    aiRequested = true;
    const aiStart = Date.now();
    const { response } = await invokeGeminiWithFallback(
      messages,
      userApiKeys.geminiApiKey,
    );
    const aiDuration = (Date.now() - aiStart) / 1000;
    aiGenerationDurationSeconds.observe(aiDuration);

    if (!response || !response.content) {
      aiGenerationFailureTotal.inc();
      aiFailureRecorded = true;
      throw new Error("Empty AI response received.");
    }
    let mermaidDiagram = response.content as string;

    // Clean up the response - remove markdown code blocks if present
    mermaidDiagram = mermaidDiagram
      .replace(/```mermaid\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // Save to database
    const dbCreateStart = Date.now();
    const generation = await db.generation.create({
      data: {
        userInput: repoIdentifier,
        githubGeneration: mermaidDiagram,
        userId: userId,
      },
    });
    databaseQueryDurationSeconds.observe(
      { operation: "create" },
      (Date.now() - dbCreateStart) / 1000,
    );

    aiGenerationSuccessTotal.inc();

    httpRequestsTotal.inc({ route, method, status_code: "200" });
    return NextResponse.json({
      success: true,
      generationId: generation.id,
      mermaidDiagram,
      cached: false, // Indicate this is newly generated
    });
  } catch (error) {
    if (aiRequested && !aiFailureRecorded) {
      aiGenerationFailureTotal.inc();
    }
    console.error("GitHub design generation error:", error);
    httpRequestsTotal.inc({ route, method, status_code: "500" });
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate system design",
      },
      { status: 500 },
    );
  }
}
