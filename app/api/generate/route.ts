import { NextRequest, NextResponse } from "next/server";
import { geminiLLM } from "@/app/(protected)/generate/utils/aiClient";
import { SystemPrompt } from "@/app/(protected)/generate/utils/promptTemplate";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { db } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const authorization = req.headers.get("Authorization");
    if (!authorization) {
      return NextResponse.json(
        { error: "Unauthorized. Missing Authorization header." },
        { status: 401 },
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.userInput) {
      return NextResponse.json(
        { error: "Invalid request body. Missing 'userInput' field." },
        { status: 400 },
      );
    }

    const { userInput, userId } = body;

    if (!userInput || userInput.trim().length === 0) {
      return NextResponse.json(
        { error: "Invalid input. Please provide a valid project idea." },
        { status: 400 },
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId. You must be logged in to generate." },
        { status: 400 },
      );
    }

    // ✅ Construct the AI messages
    const messages = [
      new SystemMessage(SystemPrompt),
      new HumanMessage(userInput),
    ];

    // 🧠 Call Gemini model
    const response = await geminiLLM.invoke(messages);

    if (!response || !response.content) {
      throw new Error("Empty AI response received.");
    }

    const finalAIresponse = response.content;
    let cleanedOutput: string;

    // ✅ Handle both object and string types safely
    if (typeof finalAIresponse === "string") {
      cleanedOutput = finalAIresponse;
    } else if (typeof finalAIresponse === "object" && "output" in finalAIresponse) {
      cleanedOutput = finalAIresponse.output as string;
    } else {
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

      // 💾 Save generation result in DB
      const userGenerates = await db.generation.create({
        data: {
          userInput,
          generatedOutput: parsedData,
          userId,
        },
      });

      return NextResponse.json({ success: true, output: finalAIresponse });
    } catch (jsonError: any) {
      console.error("JSON parsing error:", jsonError);
      return NextResponse.json(
        {
          error: "Failed to parse AI response JSON. Try rephrasing your input.",
          details: jsonError.message,
        },
        { status: 422 },
      );
    }
  } catch (error: any) {
    console.error("Error generating response:", error);

    // Handle specific Prisma or AI-related errors
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Duplicate record detected." },
        { status: 409 },
      );
    }

    if (error.message?.includes("AI")) {
      return NextResponse.json(
        {
          error:
            "The AI service returned an invalid response. Please retry after a few seconds.",
          details: error.message,
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        error:
          error?.message ||
          "An unexpected server error occurred while generating the response.",
      },
      { status: 500 },
    );
  }
}
