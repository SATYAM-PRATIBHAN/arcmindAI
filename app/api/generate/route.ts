import { NextRequest, NextResponse } from "next/server";
import { geminiLLM } from "@/app/(protected)/generate/utils/aiClient";
import { SystemPrompt } from "@/app/(protected)/generate/utils/promptTemplate";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { db } from "@/lib/prisma";
import { generationRateLimit } from "@/lib/rateLimit";
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

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const route = "/api/generate";
  const method = "POST";
  httpRequestsTotal.inc({ route, method });

  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.userInput) {
      apiGatewayErrorsTotal.inc({ status_code: "400" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        { error: "Invalid request body. Missing 'userInput' field." },
        { status: 400 },
      );
    }

    const { userInput, userId } = body;

    if (!userInput || userInput.trim().length === 0) {
      apiGatewayErrorsTotal.inc({ status_code: "400" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        { error: "Invalid input. Please provide a valid project idea." },
        { status: 400 },
      );
    }

    if (!userId) {
      apiGatewayErrorsTotal.inc({ status_code: "400" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        { error: "Missing userId. You must be logged in to generate." },
        { status: 400 },
      );
    }

    // Rate limiting: 1 request every 2 minutes per user
    const { success, limit, remaining, reset } =
      await generationRateLimit.limit(userId);
    if (!success) {
      apiGatewayErrorsTotal.inc({ status_code: "429" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        {
          error:
            "Rate limit exceeded. Please wait 2 minutes before making another request.",
        },
        { status: 429 },
      );
    }

    // Increment AI generation request counter
    aiGenerationRequestsTotal.inc();

    // Update user activity
    userLastActivityTimestamp.set({ user_id: userId }, Date.now() / 1000);

    // ✅ Construct the AI messages
    const messages = [
      new SystemMessage(SystemPrompt),
      new HumanMessage(userInput),
    ];

    // 🧠 Call Gemini model with timing
    const aiStart = Date.now();
    const response = await geminiLLM.invoke(messages);
    const aiDuration = (Date.now() - aiStart) / 1000;
    aiGenerationDurationSeconds.observe(aiDuration);

    if (!response || !response.content) {
      aiGenerationFailureTotal.inc();
      throw new Error("Empty AI response received.");
    }

    const finalAIresponse = response.content;
    let cleanedOutput: string;

    // ✅ Handle both object and string types safely
    if (typeof finalAIresponse === "string") {
      cleanedOutput = finalAIresponse;
    } else if (
      typeof finalAIresponse === "object" &&
      "output" in finalAIresponse
    ) {
      cleanedOutput = finalAIresponse.output as string;
    } else {
      aiGenerationFailureTotal.inc();
      throw new Error("Unexpected AI response format.");
    }

    // 🧹 Clean up the AI output and extract JSON
    try {
      let jsonText = cleanedOutput;

      const jsonStart = jsonText.indexOf("```json");
      if (jsonStart !== -1) jsonText = jsonText.slice(jsonStart + 7);

      const jsonEnd = jsonText.lastIndexOf("```");
      if (jsonEnd !== -1) jsonText = jsonText.slice(0, jsonEnd);

      jsonText = jsonText.trim();

      if (!jsonText) throw new Error("No JSON content found in AI response.");

      const parsedData = JSON.parse(jsonText);

      // 💾 Save generation result in DB with timing
      const dbStart = Date.now();
      await db.generation.create({
        data: {
          userInput,
          generatedOutput: parsedData,
          userId,
        },
      });
      databaseQueryDurationSeconds.observe(
        { operation: "create" },
        (Date.now() - dbStart) / 1000,
      );

      // Increment success counters
      aiGenerationSuccessTotal.inc();
      userGenerationsTotal.inc({ user_id: userId });

      // Set output size
      aiGenerationOutputSizeBytes.set(JSON.stringify(parsedData).length);

      // Track total HTTP duration
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );

      return NextResponse.json({
        success: true,
        output: finalAIresponse,
        limit: limit,
        remaining: remaining,
        reset: reset,
      });
    } catch (jsonError: any) {
      aiGenerationFailureTotal.inc();
      console.error("JSON parsing error:", jsonError);
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        {
          error: "Failed to parse AI response JSON. Try rephrasing your input.",
          details: jsonError.message,
        },
        { status: 422 },
      );
    }
  } catch (error: any) {
    aiGenerationFailureTotal.inc();
    console.error("Error generating response:", error);

    // Handle specific Prisma or AI-related errors
    let status = 500;
    if (error.code === "P2002") {
      status = 409;
    } else if (error.message?.includes("AI")) {
      status = 502;
    }

    apiGatewayErrorsTotal.inc({ status_code: status.toString() });
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000,
    );

    return NextResponse.json(
      {
        error:
          error?.message ||
          "An unexpected server error occurred while generating the response.",
      },
      { status },
    );
  }
}
