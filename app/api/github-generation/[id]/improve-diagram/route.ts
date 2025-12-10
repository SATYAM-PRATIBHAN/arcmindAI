import { NextRequest, NextResponse } from "next/server";
import { invokeOpenAIWithFallback } from "@/lib/ai/helperClient";
import { HumanMessage } from "@langchain/core/messages";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getUserApiKeys } from "@/lib/api-keys/getUserApiKeys";
import {
  GITHUB_AI_SUGGEST_PROMPT,
  GITHUB_AI_CUSTOM_PROMPT_TEMPLATE,
} from "@/lib/prompts/githubAISuggestPrompt";
import {
  httpRequestsTotal,
  httpRequestDurationSeconds,
  apiGatewayErrorsTotal,
  aiGenerationRequestsTotal,
  aiGenerationSuccessTotal,
  aiGenerationFailureTotal,
  aiGenerationDurationSeconds,
  userLastActivityTimestamp,
} from "@/lib/metrics";

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const route = "/api/github-generation/[id]/improve-diagram";
  const method = "POST";
  httpRequestsTotal.inc({ route, method });

  try {
    const { currentDiagram, userPrompt, useAISuggestion } = await req.json();

    if (!currentDiagram) {
      apiGatewayErrorsTotal.inc({ status_code: "400" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        { success: false, error: "Current diagram is required" },
        { status: 400 },
      );
    }

    // Determine which prompt to use
    let prompt: string;
    if (useAISuggestion) {
      // Use predefined AI suggestion prompt
      prompt = GITHUB_AI_SUGGEST_PROMPT.replace(
        "{currentDiagram}",
        currentDiagram,
      );
    } else {
      // Use custom user prompt
      if (!userPrompt || userPrompt.trim() === "") {
        apiGatewayErrorsTotal.inc({ status_code: "400" });
        httpRequestDurationSeconds.observe(
          { route },
          (Date.now() - startTime) / 1000,
        );
        return NextResponse.json(
          { success: false, error: "User prompt is required" },
          { status: 400 },
        );
      }
      prompt = GITHUB_AI_CUSTOM_PROMPT_TEMPLATE.replace(
        "{userPrompt}",
        userPrompt,
      ).replace("{currentDiagram}", currentDiagram);
    }

    // Get user session for API key fallback
    const session = await getServerSession(authOptions);

    // Fetch user's API keys if authenticated
    let userApiKeys = { openaiApiKey: undefined };
    // @ts-expect-error id is added to the session in the session callback
    if (session?.user?.id) {
      // @ts-expect-error id is added to the session in the session callback
      userApiKeys = await getUserApiKeys(session.user.id);
      // Update user activity
      userLastActivityTimestamp.set(
        // @ts-expect-error id is added to the session in the session callback
        { user_id: session.user.id },
        Date.now() / 1000,
      );
    }

    // Increment AI generation request counter
    aiGenerationRequestsTotal.inc();

    const aiStart = Date.now();
    // Call OpenAI with fallback
    const { response } = await invokeOpenAIWithFallback(
      [new HumanMessage(prompt)],
      userApiKeys.openaiApiKey,
    );
    const aiDuration = (Date.now() - aiStart) / 1000;
    aiGenerationDurationSeconds.observe(aiDuration);

    const improvedDiagram = response.content as string;

    // Clean up the response (remove markdown code blocks if present)
    const cleanedDiagram = improvedDiagram
      .replace(/```mermaid\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

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
      improvedDiagram: cleanedDiagram,
    });
  } catch (error) {
    console.error("Error improving diagram:", error);

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
          ? "OpenAI API error. Please provide your own API key or try again later."
          : "Failed to improve diagram",
      },
      { status },
    );
  }
}
