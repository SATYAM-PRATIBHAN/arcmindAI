import { NextRequest, NextResponse } from "next/server";
import { openAiLLM } from "@/lib/ai/helperClient";
import {
  GITHUB_AI_SUGGEST_PROMPT,
  GITHUB_AI_CUSTOM_PROMPT_TEMPLATE,
} from "@/lib/prompts/githubAISuggestPrompt";
import {
  aiGenerationRequestsTotal,
  aiGenerationSuccessTotal,
  aiGenerationFailureTotal,
  aiGenerationDurationSeconds,
  httpRequestsTotal,
} from "@/lib/metrics";

export async function POST(req: NextRequest) {
  const route = "/api/github-generation/[id]/improve-diagram";
  const method = "POST";
  let aiRequested = false;
  let aiFailureRecorded = false;

  try {
    const { currentDiagram, userPrompt, useAISuggestion } = await req.json();

    if (!currentDiagram) {
      httpRequestsTotal.inc({ route, method, status_code: "400" });
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
        httpRequestsTotal.inc({ route, method, status_code: "400" });
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

    // Call OpenAI
    aiGenerationRequestsTotal.inc();
    aiRequested = true;
    const aiStart = Date.now();
    const response = await openAiLLM.invoke(prompt);
    const aiDuration = (Date.now() - aiStart) / 1000;
    aiGenerationDurationSeconds.observe(aiDuration);

    if (!response || !response.content) {
      aiGenerationFailureTotal.inc();
      aiFailureRecorded = true;
      throw new Error("Empty AI response received.");
    }

    const improvedDiagram = response.content as string;

    // Clean up the response (remove markdown code blocks if present)
    const cleanedDiagram = improvedDiagram
      .replace(/```mermaid\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    aiGenerationSuccessTotal.inc();
    httpRequestsTotal.inc({ route, method, status_code: "200" });
    return NextResponse.json({
      success: true,
      improvedDiagram: cleanedDiagram,
    });
  } catch (error) {
    if (aiRequested && !aiFailureRecorded) {
      aiGenerationFailureTotal.inc();
    }
    console.error("Error improving diagram:", error);
    httpRequestsTotal.inc({ route, method, status_code: "500" });
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to improve diagram",
      },
      { status: 500 },
    );
  }
}
