import { NextRequest, NextResponse } from "next/server";
import { invokeGeminiWithFallback } from "@/app/(protected)/generate/utils/aiClient";
import { SystemPrompt } from "@/lib/prompts/promptTemplate";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { db } from "@/lib/prisma";
import { generationRateLimit } from "@/lib/rateLimit";
import { getUserApiKeys } from "@/lib/api-keys/getUserApiKeys";
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

    const dbStart = Date.now();
    const user = await db.user.findFirst({
      where: {
        id: userId,
      },
    });
    databaseQueryDurationSeconds.observe(
      { operation: "findFirst" },
      (Date.now() - dbStart) / 1000,
    );

    if (!user) {
      apiGatewayErrorsTotal.inc({ status_code: "404" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      NextResponse.json({ status: 404, message: "User not Found" });
    }

    if (user?.isVerified === false) {
      apiGatewayErrorsTotal.inc({ status_code: "401" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json({
        status: 401,
        message: "Email is not verified",
      });
    }

    const generationCount = await db.generation.count({
      where: { userId },
    });

    // 2. Get user limit based on plan
    const planLimits = {
      free: 10,
      pro: 200,
      enterprise: 9999, // or unlimited
    };

    const plan = user?.plan as keyof typeof planLimits | undefined;
    const userLimit = plan ? planLimits[plan] : undefined;

    // 3. Enforce plan limits
    if (userLimit !== undefined && generationCount >= userLimit) {
      return NextResponse.json(
        {
          error: `You have reached your limit of ${userLimit} generations for the ${user?.plan} plan.`,
          upgrade: user?.plan === "free" ? true : false,
        },
        { status: 403 },
      );
    }

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
      httpRequestsTotal.inc({ route, method, status_code: "400" });
      apiGatewayErrorsTotal.inc({ status_code: "400" });
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

    // 🔑 Fetch user's API keys
    const userApiKeys = await getUserApiKeys(userId);

    // 🧠 Call Gemini model with timing and automatic fallback
    const aiStart = Date.now();
    const { response } = await invokeGeminiWithFallback(
      messages,
      userApiKeys.geminiApiKey,
    );
    const aiDuration = (Date.now() - aiStart) / 1000;
    aiGenerationDurationSeconds.observe(aiDuration);

    console.log("si response: ", response);

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

      // Find the start of JSON code block
      const jsonStartMarker = "```json";
      const jsonStart = jsonText.indexOf(jsonStartMarker);

      if (jsonStart !== -1) {
        // Extract from after the ```json marker
        jsonText = jsonText.slice(jsonStart + jsonStartMarker.length);

        // Find the first closing ``` after the JSON start (not the last one in the entire string)
        const jsonEnd = jsonText.indexOf("```");
        if (jsonEnd !== -1) {
          jsonText = jsonText.slice(0, jsonEnd);
        }
      } else {
        // If no ```json marker, try to find JSON object directly
        // Look for first { and last } to extract JSON
        const firstBrace = jsonText.indexOf("{");
        if (firstBrace !== -1) {
          // Find matching closing brace
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

      if (!jsonText) throw new Error("No JSON content found in AI response.");
      console.log("json text: ", jsonText);

      const parsedData = JSON.parse(jsonText);

      // 🎨 Extract mermaid diagram if present
      const mermaidStartMarker = "```mermaid";
      const mermaidStart = cleanedOutput.indexOf(mermaidStartMarker);

      if (mermaidStart !== -1) {
        // Extract from after the ```mermaid marker
        let mermaidText = cleanedOutput.slice(
          mermaidStart + mermaidStartMarker.length,
        );

        // Find the first closing ``` after the mermaid start
        const mermaidEnd = mermaidText.indexOf("```");
        if (mermaidEnd !== -1) {
          mermaidText = mermaidText.slice(0, mermaidEnd);
        }

        // Clean up the mermaid diagram
        mermaidText = mermaidText
          .replace(/```mermaid/g, "")
          .replace(/```/g, "")
          .trim();

        // Add to parsedData
        if (mermaidText) {
          parsedData["Architecture Diagram"] = mermaidText;
        }
      }

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

      // Update user activity
      userLastActivityTimestamp.set({ user_id: userId }, Date.now() / 1000);

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
    } catch (jsonError: unknown) {
      aiGenerationFailureTotal.inc();
      const errorMessage =
        jsonError instanceof Error ? jsonError.message : "Unknown error";
      console.error("JSON parsing error:", jsonError);
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        {
          error: "Failed to parse AI response JSON. Try rephrasing your input.",
          details: errorMessage,
        },
        { status: 422 },
      );
    }
  } catch (error: unknown) {
    aiGenerationFailureTotal.inc();
    console.error("Error generating response:", error);

    // Handle specific Prisma or AI-related errors
    let status = 500;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Check if all API keys failed (trigger user to add their own keys)
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
      status = 503; // Service Unavailable - signals client to show API key dialog
    } else if (errorMessage.includes("AI")) {
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
          errorMessage ||
          "An unexpected server error occurred while generating the response.",
      },
      { status },
    );
  }
}
