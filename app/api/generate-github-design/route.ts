import { triggerGenerationWebhooks } from "@/lib/webhooks/webhook.service";
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
  aiGenerationRequestsTotal,
  aiGenerationSuccessTotal,
  aiGenerationFailureTotal,
  aiGenerationDurationSeconds,
  httpRequestsTotal,
  databaseQueryDurationSeconds,
} from "@/lib/metrics";

interface GenerateGithubDesignRequest {
  owner: string;
  repo: string;
  analysisData: RepositoryAnalysis;
}

export async function POST(request: NextRequest) {
  const route = "/api/generate-github-design";
  const method = "POST";

  let aiRequested = false;
  let aiFailureRecorded = false;

  // Needed in catch block
  let userId: string | undefined;
  let repoIdentifier = "";

  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    // @ts-expect-error id is added to session in NextAuth callbacks
    userId = session?.user?.id;

    if (!userId) {
      httpRequestsTotal.inc({
        route,
        method,
        status_code: "401",
      });

      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        {
          status: 401,
        },
      );
    }

    const body: GenerateGithubDesignRequest = await request.json();

    const { owner, repo, analysisData } = body;

    if (!owner || !repo || !analysisData) {
      httpRequestsTotal.inc({
        route,
        method,
        status_code: "400",
      });

      return NextResponse.json(
        {
          success: false,
          error:
            "Missing required fields: owner, repo, or analysisData",
        },
        {
          status: 400,
        },
      );
    }

    // Repository identifier
    repoIdentifier = `${repo}`;

    // Check cache
    const dbFindStart = Date.now();

    const existingGeneration = await db.generation.findFirst({
      where: {
        userId,
        userInput: repoIdentifier,
        githubGeneration: {
          not: null,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    databaseQueryDurationSeconds.observe(
      { operation: "findFirst" },
      (Date.now() - dbFindStart) / 1000,
    );

    // Return cached result
    if (existingGeneration?.githubGeneration) {
      httpRequestsTotal.inc({
        route,
        method,
        status_code: "200",
      });

      return NextResponse.json({
        success: true,
        generationId: existingGeneration.id,
        mermaidDiagram:
          existingGeneration.githubGeneration,
        cached: true,
      });
    }

    // Format repository analysis
    const userMessage = formatRepositoryAnalysisForAI(
      owner,
      repo,
      analysisData,
    );

    const messages = [
      new SystemMessage(GithubRepoSystemPrompt),
      new HumanMessage(userMessage),
    ];

    // Fetch user API keys
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

    // Clean markdown formatting
    mermaidDiagram = mermaidDiagram
      .replace(/```mermaid\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // Save generation
    const dbCreateStart = Date.now();

    const generation = await db.generation.create({
      data: {
        userInput: repoIdentifier,
        githubGeneration: mermaidDiagram,
        userId,
      },
    });

    databaseQueryDurationSeconds.observe(
      { operation: "create" },
      (Date.now() - dbCreateStart) / 1000,
    );

    // Trigger success webhooks
    await triggerGenerationWebhooks({
      event: "generation.completed",
      userId,
      data: {
        generationId: generation.id,
        repository: repoIdentifier,
        status: "success",
      },
    });

    aiGenerationSuccessTotal.inc();

    httpRequestsTotal.inc({
      route,
      method,
      status_code: "200",
    });

    return NextResponse.json({
      success: true,
      generationId: generation.id,
      mermaidDiagram,
      cached: false,
    });
  } catch (error) {
    if (aiRequested && !aiFailureRecorded) {
      aiGenerationFailureTotal.inc();
    }

    // Trigger failure webhooks
    if (userId) {
      await triggerGenerationWebhooks({
        event: "generation.failed",
        userId,
        data: {
          repository: repoIdentifier,
          status: "failed",
          error:
            error instanceof Error
              ? error.message
              : "Unknown generation error",
        },
      });
    }

    console.error(
      "GitHub design generation error:",
      error,
    );

    httpRequestsTotal.inc({
      route,
      method,
      status_code: "500",
    });

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate system design",
      },
      {
        status: 500,
      },
    );
  }
}