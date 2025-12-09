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

interface GenerateGithubDesignRequest {
  owner: string;
  repo: string;
  analysisData: RepositoryAnalysis;
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    // @ts-expect-error id is added to session in NextAuth callbacks
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body: GenerateGithubDesignRequest = await request.json();
    const { owner, repo, analysisData } = body;

    if (!owner || !repo || !analysisData) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: owner, repo, or analysisData",
        },
        { status: 400 }
      );
    }

    // Check if a design already exists for this repository
    const repoIdentifier = `${repo}`;
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

    // If design already exists, return it from cache
    if (existingGeneration?.githubGeneration) {
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
      analysisData
    );

    // Call AI to generate Mermaid diagram
    const messages = [
      new SystemMessage(GithubRepoSystemPrompt),
      new HumanMessage(userMessage),
    ];

    // 🔑 Fetch user's API keys
    const userApiKeys = await getUserApiKeys(userId);

    const { response } = await invokeGeminiWithFallback(
      messages,
      userApiKeys.geminiApiKey
    );
    let mermaidDiagram = response.content as string;

    // Clean up the response - remove markdown code blocks if present
    mermaidDiagram = mermaidDiagram
      .replace(/```mermaid\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // Save to database
    const generation = await db.generation.create({
      data: {
        userInput: repoIdentifier,
        githubGeneration: mermaidDiagram,
        userId: userId,
      },
    });

    return NextResponse.json({
      success: true,
      generationId: generation.id,
      mermaidDiagram,
      cached: false, // Indicate this is newly generated
    });
  } catch (error) {
    console.error("GitHub design generation error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate system design",
      },
      { status: 500 }
    );
  }
}
