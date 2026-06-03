import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  httpRequestsTotal,
  httpRequestDurationSeconds,
  apiGatewayErrorsTotal,
  databaseQueryDurationSeconds,
  userLastActivityTimestamp,
  cacheHitsTotal,
  aiGenerationRequestsTotal,
  aiGenerationSuccessTotal,
  aiGenerationFailureTotal,
  aiGenerationDurationSeconds,
  aiGenerationOutputSizeBytes,
  userGenerationsTotal,
} from "@/lib/metrics";
import { invokeGeminiWithFallback } from "@/app/(protected)/generate/utils/aiClient";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { UpdateSystemPrompt } from "@/lib/prompts/updateSystemPrompt";
import { getUserApiKeys } from "@/lib/api-keys/getUserApiKeys";

// ---------------------------------------------------------------------------
// GET: Fetch a specific generation by ID
// ---------------------------------------------------------------------------
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const startTime = Date.now();
  const route = "/api/generate/[id]";
  const method = "GET";
  httpRequestsTotal.inc({ route, method });

  try {
    const session = await getServerSession(authOptions);

    // @ts-expect-error id is added to the session in the session callback
    if (!session?.user?.id) {
      apiGatewayErrorsTotal.inc({ status_code: "401" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const dbStart1 = Date.now();
    const user = await db.user.findFirst({
      where: {
        // @ts-expect-error id is added to the session in the session callback
        id: session?.user?.id,
      },
    });
    databaseQueryDurationSeconds.observe(
      { operation: "findFirst" },
      (Date.now() - dbStart1) / 1000,
    );

    if (!user) {
      apiGatewayErrorsTotal.inc({ status_code: "404" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json({ status: 404, message: "User not Found" });
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

    const { id: generationId } = await params;

    // Update user activity timestamp metrics
    userLastActivityTimestamp.set(
      // @ts-expect-error id is added to the session in the session callback
      { user_id: session.user.id },
      Date.now() / 1000,
    );

    // Increment total cache hits metric tracking
    cacheHitsTotal.inc();

    const dbStart = Date.now();
    const generation = await db.generation.findFirst({
      where: {
        id: generationId,
        // @ts-expect-error id is added to the session in the session callback
        userId: session.user.id,
      },
    });
    databaseQueryDurationSeconds.observe(
      { operation: "findFirst" },
      (Date.now() - dbStart) / 1000,
    );

    if (!generation) {
      apiGatewayErrorsTotal.inc({ status_code: "404" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        { success: false, message: "Generation not found" },
        { status: 404 },
      );
    }

    // Track overall HTTP duration performance metric
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000,
    );

    return NextResponse.json({
      success: true,
      output: generation,
    });
  } catch (error) {
    console.error("Error fetching generation:", error);
    apiGatewayErrorsTotal.inc({ status_code: "500" });
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000,
    );
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE: Remove a specific generation record
// ---------------------------------------------------------------------------
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const startTime = Date.now();
  const route = "/api/generate/[id]";
  const method = "DELETE";
  httpRequestsTotal.inc({ route, method });

  try {
    const session = await getServerSession(authOptions);

    // @ts-expect-error id is added to the session in the session callback
    if (!session?.user?.id) {
      apiGatewayErrorsTotal.inc({ status_code: "401" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const { id: generationId } = await params;

    // Track active user timestamp updates
    userLastActivityTimestamp.set(
      // @ts-expect-error id is added to the session in the session callback
      { user_id: session.user.id },
      Date.now() / 1000,
    );

    const user = await db.user.findFirst({
      where: {
        // @ts-expect-error id is added to the session in the session callback
        id: session.user.id,
      },
    });

    if (!user) {
      apiGatewayErrorsTotal.inc({ status_code: "404" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    if (!user.isVerified) {
      apiGatewayErrorsTotal.inc({ status_code: "401" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        { success: false, message: "Email is not verified" },
        { status: 401 },
      );
    }

    const dbStart = Date.now();
    const existing = await db.generation.findFirst({
      where: {
        id: generationId,
        // @ts-expect-error id is added to the session in the session callback
        userId: session.user.id,
      },
    });
    databaseQueryDurationSeconds.observe(
      { operation: "findFirst" },
      (Date.now() - dbStart) / 1000,
    );

    if (!existing) {
      apiGatewayErrorsTotal.inc({ status_code: "404" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        { success: false, message: "Generation not found" },
        { status: 404 },
      );
    }

    const dbDelStart = Date.now();
    await db.generation.delete({
      where: { id: generationId },
    });
    databaseQueryDurationSeconds.observe(
      { operation: "delete" },
      (Date.now() - dbDelStart) / 1000,
    );

    // Record total execution duration metrics
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000,
    );

    return NextResponse.json({
      success: true,
      message: "Generation deleted successfully",
    });
  } catch (error) {
    console.error("Error fetching generation:", error);
    apiGatewayErrorsTotal.inc({ status_code: "500" });
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000,
    );
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PUT: Update an architecture generation model with AI refinement
// ---------------------------------------------------------------------------
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const startTime = Date.now();
  const route = "/api/generate/[id]";
  const method = "PUT";
  httpRequestsTotal.inc({ route, method });

  try {
    const session = await getServerSession(authOptions);

    // @ts-expect-error id is added to the session in the session callback
    if (!session?.user?.id) {
      apiGatewayErrorsTotal.inc({ status_code: "401" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const dbStart1 = Date.now();
    const user = await db.user.findFirst({
      where: {
        // @ts-expect-error id is added to the session in the session callback
        id: session?.user?.id,
      },
    });
    databaseQueryDurationSeconds.observe(
      { operation: "findFirst" },
      (Date.now() - dbStart1) / 1000,
    );

    if (!user) {
      apiGatewayErrorsTotal.inc({ status_code: "404" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    if (user?.isVerified === false) {
      apiGatewayErrorsTotal.inc({ status_code: "401" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        { success: false, message: "Email is not verified" },
        { status: 401 },
      );
    }

    const isPro =
      user?.plan !== "free" || !!user?.geminiApiKey || !!user?.openaiApiKey;
    if (!isPro) {
      apiGatewayErrorsTotal.inc({ status_code: "403" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        {
          success: false,
          message: "Purchase the pro version to use this feature",
        },
        { status: 403 },
      );
    }

    const { id: generationId } = await params;

    // Track live activity logs for user metrics
    userLastActivityTimestamp.set(
      // @ts-expect-error id is added to the session in the session callback
      { user_id: session.user.id },
      Date.now() / 1000,
    );

    // Track active AI invocation trends
    aiGenerationRequestsTotal.inc();

    const { userInput } = await request.json();

    const dbStart2 = Date.now();
    const originalResponse = await db.generation.findFirst({
      where: {
        id: generationId,
        // @ts-expect-error id is added to the session in the session callback
        userId: session.user.id,
      },
    });
    databaseQueryDurationSeconds.observe(
      { operation: "findFirst" },
      (Date.now() - dbStart2) / 1000,
    );

    if (!originalResponse) {
      apiGatewayErrorsTotal.inc({ status_code: "404" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        { success: false, message: "Generation not found" },
        { status: 404 },
      );
    }

    const messages = [
      new SystemMessage(UpdateSystemPrompt),
      new HumanMessage(`Original generated content: ${JSON.stringify(originalResponse.generatedOutput)}

User feedback/input for update: ${userInput}`),
    ];

    // Retrieve active developer credentials or fallback API tokens
    // @ts-expect-error id is added to the session in the session callback
    const userApiKeys = await getUserApiKeys(session.user.id);

    const aiStart = Date.now();
    const { response: newGeneratedOutput } = await invokeGeminiWithFallback(
      messages,
      userApiKeys.geminiApiKey,
    );
    const aiDuration = (Date.now() - aiStart) / 1000;
    aiGenerationDurationSeconds.observe(aiDuration);

    if (!newGeneratedOutput || !newGeneratedOutput.content) {
      aiGenerationFailureTotal.inc();
      throw new Error("Empty AI response received.");
    }

    const finalAIresponse = newGeneratedOutput.content;

    // Step 1: Normalize AI output format into a safe execution string
    const raw =
      typeof finalAIresponse === "string"
        ? finalAIresponse
        : JSON.stringify(finalAIresponse);

    // Step 2: Strip markdown JSON blocks dynamically
    let jsonText = raw;

    const jsonStart = jsonText.indexOf("```json");
    if (jsonStart !== -1) {
      jsonText = jsonText.slice(jsonStart + 7);
    }

    const jsonEnd = jsonText.lastIndexOf("```");
    if (jsonEnd !== -1) {
      jsonText = jsonText.slice(0, jsonEnd);
    }

    jsonText = jsonText.trim();
    if (!jsonText) throw new Error("No JSON content found in AI response");

    // Step 3: Parse extracted valid JSON block
    const parsedData = JSON.parse(jsonText);

    // Step 4: Sanitize visual structural diagram string values
    if (parsedData && typeof parsedData["Architecture Diagram"] === "string") {
      const diagram = parsedData["Architecture Diagram"];
      const cleanedDiagram = diagram
        .replace(/```mermaid/g, "")
        .replace(/```/g, "")
        .trim();
      parsedData["Architecture Diagram"] = cleanedDiagram;
    }

    // ─── DATABASE SCHEMA METRICS MAPPING ───────────────────────────────────
    // Extraction of parsed fields tracking system layout thresholds
    // Mapping: warningMessage (String?), skippedCount (Int), skippedBy* (Int)
    // ───────────────────────────────────────────────────────────────────────
    const responseWarning = (parsedData.warningMessage as string) || null;
    const isPayloadTruncated = !!parsedData.truncated;

    const limitSkipped =
      typeof parsedData.skippedByLimitCount === "number"
        ? parsedData.skippedByLimitCount
        : 0;
    const depthSkipped =
      typeof parsedData.skippedByDepthCount === "number"
        ? parsedData.skippedByDepthCount
        : 0;
    const sizeSkipped =
      typeof parsedData.skippedBySizeCount === "number"
        ? parsedData.skippedBySizeCount
        : 0;

    const totalSkipped =
      (parsedData.skippedCount as number) ||
      limitSkipped + depthSkipped + sizeSkipped ||
      (isPayloadTruncated ? 1 : 0);

    const dbStart3 = Date.now();
    const generation = await db.generation.update({
      where: {
        id: generationId,
        // @ts-expect-error id is added to the session in the session callback
        userId: session.user.id,
      },
      // Writing specific metrics directly into your database properties fields
      data: {
        generatedOutput: parsedData as Prisma.InputJsonValue,
        warningMessage: responseWarning, // 👈 Maps: warningMessage String?
        skippedCount: totalSkipped, // 👈 Maps: skippedCount Int
        skippedByLimitCount: limitSkipped, // 👈 Maps: skippedByLimitCount Int
        skippedByDepthCount: depthSkipped, // 👈 Maps: skippedByDepthCount Int
        skippedBySizeCount: sizeSkipped, // 👈 Maps: skippedBySizeCount Int
      },
    });
    databaseQueryDurationSeconds.observe(
      { operation: "update" },
      (Date.now() - dbStart3) / 1000,
    );

    // Log tracking metrics counters upon successful complete workflow updates
    aiGenerationSuccessTotal.inc();
    // @ts-expect-error id is added to the session in the session callback
    userGenerationsTotal.inc({ user_id: session.user.id });

    // Set output metric context size tracking
    aiGenerationOutputSizeBytes.set(JSON.stringify(parsedData).length);

    // Complete tracking total request runtime duration
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000,
    );

    return NextResponse.json({
      success: true,
      output: generation,
    });
  } catch (error) {
    console.error("Error updating generation:", error);
    apiGatewayErrorsTotal.inc({ status_code: "500" });
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000,
    );
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH: Configure and expose a public share token link structure
// ---------------------------------------------------------------------------
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const startTime = Date.now();
  const route = "/api/generate/[id]";
  const method = "PATCH";
  httpRequestsTotal.inc({ route, method });

  try {
    const session = await getServerSession(authOptions);

    // @ts-expect-error id is added to the session in the session callback
    if (!session?.user?.id) {
      apiGatewayErrorsTotal.inc({ status_code: "401" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const user = await db.user.findFirst({
      where: {
        // @ts-expect-error id is added to the session in the session callback
        id: session.user.id,
      },
    });

    if (!user) {
      apiGatewayErrorsTotal.inc({ status_code: "404" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    if (!user.isVerified) {
      apiGatewayErrorsTotal.inc({ status_code: "401" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        { success: false, message: "Email is not verified" },
        { status: 401 },
      );
    }

    const { id: generationId } = await params;

    // Check configuration and validation mapping requirements
    const generation = await db.generation.findFirst({
      where: {
        id: generationId,
        // @ts-expect-error id is added to the session in the session callback
        userId: session.user.id,
      },
    });

    if (!generation) {
      apiGatewayErrorsTotal.inc({ status_code: "404" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000,
      );
      return NextResponse.json(
        { success: false, message: "Generation not found" },
        { status: 404 },
      );
    }

    // Reuse existing shareId or initialize a unique new tracking nano-token sequence
    const shareId = generation.shareId || nanoid(10);

    const updatedGeneration = await db.generation.update({
      where: {
        id: generationId,
      },
      data: {
        isPublic: true,
        shareId: shareId,
      },
    });

    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000,
    );

    return NextResponse.json({
      success: true,
      shareId: updatedGeneration.shareId,
    });
  } catch (error) {
    console.error("Error sharing generation:", error);
    apiGatewayErrorsTotal.inc({ status_code: "500" });
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000,
    );
    return NextResponse.json(
      { success: false, message: "Failed to share generation" },
      { status: 500 },
    );
  }
}
