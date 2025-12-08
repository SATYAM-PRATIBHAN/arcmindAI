import { NextRequest, NextResponse } from "next/server";
import { openAiLLM } from "@/lib/ai/helperClient";
import {
  GITHUB_AI_SUGGEST_PROMPT,
  GITHUB_AI_CUSTOM_PROMPT_TEMPLATE,
} from "@/lib/prompts/githubAISuggestPrompt";

export async function POST(req: NextRequest) {
  try {
    const { currentDiagram, userPrompt, useAISuggestion } = await req.json();

    if (!currentDiagram) {
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
    const response = await openAiLLM.invoke(prompt);
    const improvedDiagram = response.content as string;

    // Clean up the response (remove markdown code blocks if present)
    const cleanedDiagram = improvedDiagram
      .replace(/```mermaid\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    return NextResponse.json({
      success: true,
      improvedDiagram: cleanedDiagram,
    });
  } catch (error) {
    console.error("Error improving diagram:", error);
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
