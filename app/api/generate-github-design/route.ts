import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { GithubRepoSystemPrompt } from "@/lib/prompts/githubRepoPrompt";
import { formatRepositoryAnalysisForAI } from "@/app/(protected)/generate/utils/formatRepoAnalysis";
import { RepositoryAnalysis } from "@/types/repository-analysis";
import { db } from "@/lib/prisma";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { streamGeminiWithFallback } from "@/app/(protected)/generate/utils/aiClient";
import { getUserApiKeys } from "@/lib/api-keys/getUserApiKeys";
import {
  aiGenerationDurationSeconds,
  aiGenerationFailureTotal,
  aiGenerationRequestsTotal,
  aiGenerationSuccessTotal,
  databaseQueryDurationSeconds,
  httpRequestsTotal,
} from "@/lib/metrics";
import { sendWebhook } from "@/lib/webhooks/sendWebhook";

interface GenerateGithubDesignRequest {
  owner: string;
  repo: string;
  analysisData: RepositoryAnalysis;
  branch?: string;
}

interface ChunkContent {
  text?: string;
  [key: string]: unknown;
}

interface MessageChunk {
  content?: string | ChunkContent[];
  text?: string | (() => string);
  [key: string]: unknown;
}

let userId: string | undefined; // to get userId in catch block for webhook notification on failure, will be set in try block before any await calls
export async function POST(request: NextRequest) {
  const route = "/api/generate-github-design";
  const method = "POST";
  let aiRequested = false;
  let aiFailureRecorded = false;

  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    // @ts-expect-error custom session user id
    userId = session?.user?.id;

    if (!userId) {
      httpRequestsTotal.inc({ route, method, status_code: "401" });
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const user = await db.user.findFirst({
      where: { id: userId },
    });

    if (!user) {
      httpRequestsTotal.inc({ route, method, status_code: "404" });
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    if (!user.isVerified) {
      httpRequestsTotal.inc({ route, method, status_code: "401" });
      return NextResponse.json(
        { success: false, error: "Email is not verified" },
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

    // If design exists, stream it back in the same SSE format the frontend now expects
    if (existingGeneration?.githubGeneration) {
      const encoder = new TextEncoder();
      const cachedDiagram = existingGeneration.githubGeneration;
      const genId = existingGeneration.id;

      const cachedStream = new ReadableStream({
        start(controller) {
          // Send as one single chunk or few chunks for the "typing" effect
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ chunk: cachedDiagram })}\n\n`,
            ),
          );
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                done: true,
                generationId: genId,
                cached: true,
              })}\n\n`,
            ),
          );
          controller.close();
        },
      });

      httpRequestsTotal.inc({ route, method, status_code: "200" });
      return new Response(cachedStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
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

    // streaming version
    const responseStream = await streamGeminiWithFallback(
      messages,
      userApiKeys.geminiApiKey,
    );
    let mermaidDiagram = "";
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of responseStream) {
            let text = "";
            const msgChunk = chunk as unknown as MessageChunk;

            if (typeof msgChunk === "string") {
              text = msgChunk;
            } else if (msgChunk?.content !== undefined) {
              if (typeof msgChunk.content === "string") {
                text = msgChunk.content;
              } else if (Array.isArray(msgChunk.content)) {
                text = msgChunk.content
                  .map((item: ChunkContent | string) => {
                    if (typeof item === "string") return item;
                    return item?.text || "";
                  })
                  .join("");
              }
            } else if (msgChunk?.text) {
              text =
                typeof msgChunk.text === "function"
                  ? msgChunk.text()
                  : msgChunk.text;
            }

            // Store full response
            mermaidDiagram += text;

            // Stream chunk as JSON SSE immediately
            if (text) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ chunk: text })}\n\n`),
              );
            }
          }

          const aiDuration = (Date.now() - aiStart) / 1000;
          aiGenerationDurationSeconds.observe(aiDuration);

          // Cleanup markdown formatting
          mermaidDiagram = mermaidDiagram
            .replace(/```mermaid\n?/g, "")
            .replace(/```\n?/g, "")
            .trim();

          // Save completed response
          const dbCreateStart = Date.now();
          const generation = await db.generation.create({
            data: {
              userInput: repoIdentifier,
              githubGeneration: mermaidDiagram,
              userId: userId!,
            },
          });
          databaseQueryDurationSeconds.observe(
            { operation: "create" },
            (Date.now() - dbCreateStart) / 1000,
          );

          aiGenerationSuccessTotal.inc();
          // Send webhook notification for successful generation
          await sendWebhook({
            userId: userId!,
            event: "generation.success",
            data: {
              repository: repoIdentifier,
              mermaidDiagram,
            },
          });
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                done: true,
                generationId: generation.id,
              })}\n\n`,
            ),
          );

          controller.close();
        } catch (error) {
          aiGenerationFailureTotal.inc();
          aiFailureRecorded = true;
          console.error("Streaming error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                error:
                  error instanceof Error ? error.message : "Streaming failed",
              })}\n\n`,
            ),
          );
          controller.close();
        }
      },
    });

    httpRequestsTotal.inc({ route, method, status_code: "200" });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    if (aiRequested && !aiFailureRecorded) {
      aiGenerationFailureTotal.inc();
    }
    console.error("GitHub design generation error:", error);
    httpRequestsTotal.inc({ route, method, status_code: "500" });

    // Send webhook notification for failed generation
    if (userId) {
      await sendWebhook({
        userId,
        event: "generation.failed",
        data: {
          error:
            error instanceof Error
              ? error.message
              : "Unknown GitHub generation error",
        },
      });
    }

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
