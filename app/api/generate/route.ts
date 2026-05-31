import { NextRequest, NextResponse } from "next/server";
import { streamGeminiWithFallback } from "@/app/(protected)/generate/utils/aiClient";
import { SystemPrompt } from "@/lib/prompts/promptTemplate";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { db } from "@/lib/prisma";
import { generationRateLimits } from "@/lib/rateLimit";
import { getUserApiKeys } from "@/lib/api-keys/getUserApiKeys";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  aiGenerationRequestsTotal,
  aiGenerationSuccessTotal,
  aiGenerationFailureTotal,
  aiGenerationDurationSeconds,
  aiGenerationOutputSizeBytes,
  userGenerationsTotal,
  userLastActivityTimestamp,
  httpRequestsTotal,
  httpRequestDurationSeconds,
  apiGatewayErrorsTotal,
  databaseQueryDurationSeconds,
} from "@/lib/metrics";
import { sendWebhook } from "@/lib/webhooks/sendWebhook";
import { Prisma } from "@prisma/client";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface ChunkContent {
  text?: string;
  [key: string]: unknown;
}

interface MessageChunk {
  content?: string | ChunkContent[];
  text?: string | (() => string);
  [key: string]: unknown;
}

function extractTextFromChunk(chunk: unknown): string {
  if (typeof chunk === "string") {
    return chunk;
  }

  const msgChunk = chunk as MessageChunk;

  // Handle LangChain chunks which often have content as string or array
  if (msgChunk?.content !== undefined) {
    if (typeof msgChunk.content === "string") {
      return msgChunk.content;
    }
    if (Array.isArray(msgChunk.content)) {
      return msgChunk.content
        .map((item: ChunkContent | string) => {
          if (typeof item === "string") return item;
          return item?.text || "";
        })
        .join("");
    }
  }

  if (msgChunk?.text) {
    return typeof msgChunk.text === "function"
      ? (msgChunk.text as () => string)()
      : (msgChunk.text as string);
  }

  return "";
}

/**
 * Robust JSON extraction with resilient error containment and self-healing capabilities.
 * Prevents prompt injection payloads from generating unhandled SyntaxErrors during JSON parsing.
 */
function parseAIResponse(fullResponse: string): Record<string, unknown> {
  let jsonText = fullResponse;

  const jsonStartMarker = "```json";
  const jsonStart = jsonText.indexOf(jsonStartMarker);

  if (jsonStart !== -1) {
    jsonText = jsonText.slice(jsonStart + jsonStartMarker.length);

    const jsonEnd = jsonText.indexOf("```");

    if (jsonEnd !== -1) {
      jsonText = jsonText.slice(0, jsonEnd);
    }
  } else {
    const firstBrace = jsonText.indexOf("{");

    if (firstBrace !== -1) {
      let braceCount = 0;
      let lastBrace = -1;

      for (let i = firstBrace; i < jsonText.length; i++) {
        if (jsonText[i] === "{") braceCount++;

        if (jsonText[i] === "}") {
          braceCount--;

          if (braceCount === 0) {
            lastBrace = i;
            break;
          }
        }
      }

      if (lastBrace !== -1) {
        jsonText = jsonText.slice(firstBrace, lastBrace + 1);
      }
    }
  }

  jsonText = jsonText.trim();

  if (!jsonText) {
    return {
      success: false,
      error:
        "No JSON payload structure could be localized in the raw stream buffer.",
      "System Error": "Format mismatch",
    };
  }

  let parsedData: Record<string, unknown>;

  try {
    parsedData = JSON.parse(jsonText);
  } catch (initialParseError) {
    console.warn(
      "⚠️ Initial JSON parser pass failed. Attempting structural recovery procedures:",
      initialParseError,
    );

    // Attempt Self-Healing 1: Try closing outstanding brackets for truncated responses
    try {
      let openBraces = 0;
      let openBrackets = 0;
      let inString = false;
      let escaped = false;

      for (let i = 0; i < jsonText.length; i++) {
        const char = jsonText[i];
        if (char === "\\" && inString) {
          escaped = !escaped;
          continue;
        }
        if (char === '"' && !escaped) {
          inString = !inString;
        }
        escaped = false;

        if (!inString) {
          if (char === "{") openBraces++;
          if (char === "}") openBraces--;
          if (char === "[") openBrackets++;
          if (char === "]") openBrackets--;
        }
      }

      let healedJson = jsonText;
      if (inString) {
        healedJson += '"'; // Close unclosed quote
      }
      if (openBrackets > 0) {
        healedJson += "]".repeat(openBrackets); // Close unclosed arrays
      }
      if (openBraces > 0) {
        healedJson += "}".repeat(openBraces); // Close unclosed objects
      }

      parsedData = JSON.parse(healedJson);
    } catch (healingError) {
      console.error(
        "🚨 Auto-healing parser phase failed to salvage malformed schema token space:",
        healingError,
      );

      // Attempt Self-Healing 2: Fallback to structured object wrapper matching the expected shape
      parsedData = {
        success: false,
        error: "AI Generation returned malformed structural layout.",
        rawOutputText:
          jsonText.slice(0, 1000) + (jsonText.length > 1000 ? "..." : ""),
      };
    }
  }

  // Safe extraction of Mermaid visual blueprints
  const mermaidStartMarker = "```mermaid";

  const mermaidStart = fullResponse.indexOf(mermaidStartMarker);

  if (mermaidStart !== -1) {
    let mermaidText = fullResponse.slice(
      mermaidStart + mermaidStartMarker.length,
    );

    const mermaidEnd = mermaidText.indexOf("```");

    if (mermaidEnd !== -1) {
      mermaidText = mermaidText.slice(0, mermaidEnd);
    }

    mermaidText = mermaidText
      .replace(/```mermaid/g, "")
      .replace(/```/g, "")
      .trim();

    if (mermaidText) {
      parsedData["Architecture Diagram"] = mermaidText;
    }
  }

  return parsedData;
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  const route = "/api/generate";
  const method = "POST";

  httpRequestsTotal.inc({ route, method });

  let userId: string | undefined;
  let savedGeneration: { id: string } | null = null; // to capture the generation ID for rating use

  try {
    const session = await getServerSession(authOptions);
    // @ts-expect-error id is added to session in session callback
    userId = session?.user?.id as string | undefined;
    const isGuest = !userId;
    const body = await req.json().catch(() => null);

    if (!body || !body.userInput) {
      apiGatewayErrorsTotal.inc({ status_code: "400" });

      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );

      return NextResponse.json(
        {
          error: "Invalid request body. Missing 'userInput' field.",
        },
        { status: 400 },
      );
    }

    const { userInput } = body;

    if (!userInput || userInput.trim().length === 0) {
      apiGatewayErrorsTotal.inc({ status_code: "400" });

      return NextResponse.json(
        { error: "Invalid input. Please provide a valid project idea." },
        { status: 400 },
      );
    }

    let user: { plan: string; isVerified: boolean } | null = null;
    let userPlan: "free" | "pro" | "enterprise" = "free";

    if (!isGuest) {
      const userFindStart = Date.now();

      user = await db.user.findFirst({
        where: { id: userId },
        select: {
          plan: true,
          isVerified: true,
        },
      });

      databaseQueryDurationSeconds.observe(
        { operation: "findFirst" },
        (Date.now() - userFindStart) / 1000,
      );

      if (!user) {
        apiGatewayErrorsTotal.inc({ status_code: "404" });

        httpRequestDurationSeconds.observe(
          { route },
          (Date.now() - startTime) / 1000,
        );

        return NextResponse.json(
          { status: 404, message: "User not Found" },
          { status: 404 },
        );
      }

      if (user.isVerified === false) {
        apiGatewayErrorsTotal.inc({ status_code: "401" });

        httpRequestDurationSeconds.observe(
          { route },
          (Date.now() - startTime) / 1000,
        );

        return NextResponse.json(
          { status: 401, message: "Email is not verified" },
          { status: 401 },
        );
      }

      userPlan =
        user.plan === "enterprise"
          ? "enterprise"
          : user.plan === "pro"
            ? "pro"
            : "free";
    }

    // RATE LIMITING — skip only if user has their own Gemini API key
    const userApiKeys = isGuest
      ? { geminiApiKey: null }
      : await getUserApiKeys(userId as string);

    const hasOwnApiKey = !!userApiKeys.geminiApiKey;

    let limit: number | null = null;
    let remaining: number | null = null;
    let reset: number | null = null;

    if (!hasOwnApiKey) {
      const rateLimiter = isGuest
        ? generationRateLimits.guest
        : userPlan === "enterprise"
          ? generationRateLimits.enterprise
          : userPlan === "pro"
            ? generationRateLimits.pro
            : generationRateLimits.free;

      const forwardedFor = req.headers.get("x-forwarded-for");
      const realIp = req.headers.get("x-real-ip");
      const extractedIp =
        (forwardedFor ? forwardedFor.split(",")[0].trim() : realIp) || "guest";

      const limitKey = isGuest ? `guest_${extractedIp}` : (userId as string);

      const result = await rateLimiter.limit(limitKey);

      const { success } = result;

      limit = result.limit;
      remaining = result.remaining;
      reset = result.reset;

      if (!success) {
        apiGatewayErrorsTotal.inc({ status_code: "429" });

        httpRequestDurationSeconds.observe(
          { route },
          (Date.now() - startTime) / 1000,
        );

        return NextResponse.json(
          {
            error: isGuest
              ? "Guest users can generate 1 architecture per day."
              : userPlan === "free"
                ? "Free users can generate 5 architectures per hour."
                : "Rate limit exceeded. Please try again later.",
            retryAfter: new Date(reset).toISOString(),
          },
          { status: 429 },
        );
      }
    }

    // Keep the rest of your existing AI generation logic BELOW this point

    aiGenerationRequestsTotal.inc();

    if (!isGuest) {
      userLastActivityTimestamp.set(
        { user_id: userId as string },
        Date.now() / 1000,
      );
    }

    const messages = [
      new SystemMessage(SystemPrompt),
      new HumanMessage(userInput),
    ];

    const aiStart = Date.now();

    const stream = await streamGeminiWithFallback(
      messages,
      userApiKeys.geminiApiKey || undefined,
    );

    const encoder = new TextEncoder();

    let fullResponse = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = extractTextFromChunk(chunk);

            if (!text) continue;

            fullResponse += text;

            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  chunk: text,
                })}\n\n`,
              ),
            );
          }

          const aiDuration = (Date.now() - aiStart) / 1000;

          aiGenerationDurationSeconds.observe(aiDuration);

          if (!fullResponse.trim()) {
            aiGenerationFailureTotal.inc();

            throw new Error("Empty AI response received.");
          }

          const parsedData = parseAIResponse(fullResponse);

          if (!isGuest) {
            const createStart = Date.now();

            savedGeneration = await db.generation.create({
              data: {
                userInput,
                generatedOutput: parsedData as Prisma.InputJsonValue,
                userId: userId as string,
              },
            });

            databaseQueryDurationSeconds.observe(
              { operation: "create" },
              (Date.now() - createStart) / 1000,
            );
          }

          aiGenerationSuccessTotal.inc();

          if (!isGuest) {
            userGenerationsTotal.inc({
              user_id: userId as string,
            });

            userLastActivityTimestamp.set(
              { user_id: userId as string },
              Date.now() / 1000,
            );
          }

          aiGenerationOutputSizeBytes.set(JSON.stringify(parsedData).length);

          httpRequestDurationSeconds.observe(
            { route },
            (Date.now() - startTime) / 1000,
          );

          // Send webhook notification for successful generation
          if (!isGuest && userId) {
            await sendWebhook({
              userId,
              event: "generation.success",
              // @ts-expect-error Prisma JSON value
              data: {
                userInput,
                generatedOutput: parsedData,
              },
            });
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                done: true,
                parsedData,
                generationId: savedGeneration?.id,
                limit,
                remaining,
                reset,
              })}\n\n`,
            ),
          );

          controller.close();
        } catch (error: unknown) {
          console.error("Streaming error:", error);

          aiGenerationFailureTotal.inc();

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

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error: unknown) {
    aiGenerationFailureTotal.inc();

    console.error("Error in generation request:", error);

    let status = 500;

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    const isApiKeyError =
      errorMessage.toLowerCase().includes("api key") ||
      errorMessage.toLowerCase().includes("rate limit") ||
      errorMessage.toLowerCase().includes("quota") ||
      errorMessage.toLowerCase().includes("unauthorized") ||
      errorMessage.toLowerCase().includes("authentication");

    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      status = 409;
    } else if (isApiKeyError) {
      status = 503;
    } else if (errorMessage.includes("AI")) {
      status = 502;
    }

    apiGatewayErrorsTotal.inc({
      status_code: status.toString(),
    });

    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000,
    );

    // Send webhook notification for failed generation
    if (userId) {
      await sendWebhook({
        userId,
        event: "generation.failed",
        data: {
          error:
            error instanceof Error ? error.message : "Unknown generation error",
        },
      });
    }
    return NextResponse.json(
      {
        error:
          errorMessage ||
          "An unexpected server error occurred while generating the response.",
      },
      { status },
    );
  }
}
