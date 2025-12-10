import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import {
  encryptApiKey,
  generateEncryptionKey,
  validateApiKeyFormat,
} from "@/lib/crypto/encryption";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import {
  httpRequestsTotal,
  httpRequestDurationSeconds,
  apiGatewayErrorsTotal,
  databaseQueryDurationSeconds,
  userLastActivityTimestamp,
} from "@/lib/metrics";

/**
 * GET /api/user/api-keys
 * Check if user has API keys configured (doesn't return actual keys)
 */
export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const route = "/api/user/api-keys";
  const method = "GET";
  httpRequestsTotal.inc({ route, method });

  try {
    const session = await getServerSession(authOptions);

    // @ts-expect-error id is added to the session in the session callback
    if (!session?.user?.id) {
      apiGatewayErrorsTotal.inc({ status_code: "401" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update user activity
    userLastActivityTimestamp.set(
      // @ts-expect-error id is added to the session in the session callback
      { user_id: session.user.id },
      Date.now() / 1000
    );

    const dbStart = Date.now();

    const user = await db.user.findUnique({
      // @ts-expect-error id is added to the session in the session callback
      where: { id: session.user.id },
      select: {
        geminiApiKey: true,
        openaiApiKey: true,
      },
    });
    databaseQueryDurationSeconds.observe(
      { operation: "findUnique" },
      (Date.now() - dbStart) / 1000
    );

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      hasGeminiKey: !!user.geminiApiKey,
      hasOpenAIKey: !!user.openaiApiKey,
    });
  } catch (error) {
    console.error("Error checking API keys:", error);
    apiGatewayErrorsTotal.inc({ status_code: "500" });
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000
    );
    return NextResponse.json(
      { error: "Failed to check API keys" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/api-keys
 * Save encrypted API keys for the user
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const route = "/api/user/api-keys";
  const method = "POST";
  httpRequestsTotal.inc({ route, method });

  try {
    const session = await getServerSession(authOptions);

    // @ts-expect-error id is added to the session in the session callback
    if (!session?.user?.id) {
      apiGatewayErrorsTotal.inc({ status_code: "401" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update user activity
    userLastActivityTimestamp.set(
      // @ts-expect-error id is added to the session in the session callback
      { user_id: session.user.id },
      Date.now() / 1000
    );

    const body = await req.json();
    const { geminiApiKey, openaiApiKey } = body;

    // Validate at least one key is provided
    if (!geminiApiKey && !openaiApiKey) {
      apiGatewayErrorsTotal.inc({ status_code: "400" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000
      );
      return NextResponse.json(
        { error: "At least one API key must be provided" },
        { status: 400 }
      );
    }

    // Validate API key formats
    if (geminiApiKey && !validateApiKeyFormat(geminiApiKey, "gemini")) {
      apiGatewayErrorsTotal.inc({ status_code: "400" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000
      );
      return NextResponse.json(
        {
          error:
            "Invalid Gemini API key format. Keys should start with 'AI' and be at least 30 characters.",
        },
        { status: 400 }
      );
    }

    if (openaiApiKey && !validateApiKeyFormat(openaiApiKey, "openai")) {
      apiGatewayErrorsTotal.inc({ status_code: "400" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000
      );
      return NextResponse.json(
        {
          error:
            "Invalid OpenAI API key format. Keys should start with 'sk-' and be at least 20 characters.",
        },
        { status: 400 }
      );
    }

    // Get or create encryption key for user
    const dbStart = Date.now();
    const user = await db.user.findUnique({
      // @ts-expect-error id is added to the session in the session callback
      where: { id: session.user.id },
      select: { encryptionKey: true },
    });
    databaseQueryDurationSeconds.observe(
      { operation: "findUnique" },
      (Date.now() - dbStart) / 1000
    );

    if (!user) {
      apiGatewayErrorsTotal.inc({ status_code: "404" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000
      );
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let encryptionKey = user.encryptionKey;
    if (!encryptionKey) {
      encryptionKey = generateEncryptionKey();
    }

    // Encrypt the API keys
    const updateData: {
      geminiApiKey?: string;
      openaiApiKey?: string;
      encryptionKey: string;
    } = {
      encryptionKey,
    };

    if (geminiApiKey) {
      updateData.geminiApiKey = encryptApiKey(geminiApiKey, encryptionKey);
    }

    if (openaiApiKey) {
      updateData.openaiApiKey = encryptApiKey(openaiApiKey, encryptionKey);
    }

    // Save encrypted keys to database
    const dbStart2 = Date.now();
    await db.user.update({
      // @ts-expect-error id is added to the session in the session callback
      where: { id: session.user.id },
      data: updateData,
    });
    databaseQueryDurationSeconds.observe(
      { operation: "update" },
      (Date.now() - dbStart2) / 1000
    );

    httpRequestsTotal.inc({ route, method, status_code: "200" });
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000
    );

    return NextResponse.json({
      success: true,
      message: "API keys saved successfully",
      savedKeys: {
        gemini: !!geminiApiKey,
        openai: !!openaiApiKey,
      },
    });
  } catch (error) {
    console.error("Error saving API keys:", error);
    apiGatewayErrorsTotal.inc({ status_code: "500" });
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000
    );
    return NextResponse.json(
      { error: "Failed to save API keys" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/api-keys
 * Remove user's API keys
 */
export async function DELETE(req: NextRequest) {
  const startTime = Date.now();
  const route = "/api/user/api-keys";
  const method = "DELETE";
  httpRequestsTotal.inc({ route, method });

  try {
    const session = await getServerSession(authOptions);

    // @ts-expect-error id is added to the session in the session callback
    if (!session?.user?.id) {
      apiGatewayErrorsTotal.inc({ status_code: "401" });
      httpRequestDurationSeconds.observe(
        { route },
        (Date.now() - startTime) / 1000
      );
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update user activity
    userLastActivityTimestamp.set(
      // @ts-expect-error id is added to the session in the session callback
      { user_id: session.user.id },
      Date.now() / 1000
    );

    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider"); // 'gemini', 'openai', or 'all'

    const updateData: {
      geminiApiKey?: null;
      openaiApiKey?: null;
      encryptionKey?: null;
    } = {};

    if (provider === "gemini") {
      updateData.geminiApiKey = null;
    } else if (provider === "openai") {
      updateData.openaiApiKey = null;
    } else {
      // Delete all keys
      updateData.geminiApiKey = null;
      updateData.openaiApiKey = null;
      updateData.encryptionKey = null;
    }

    const dbStart = Date.now();
    await db.user.update({
      // @ts-expect-error id is added to the session in the session callback
      where: { id: session.user.id },
      data: updateData,
    });
    databaseQueryDurationSeconds.observe(
      { operation: "update" },
      (Date.now() - dbStart) / 1000
    );

    httpRequestsTotal.inc({ route, method, status_code: "200" });
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000
    );

    return NextResponse.json({
      success: true,
      message: "API keys removed successfully",
    });
  } catch (error) {
    console.error("Error deleting API keys:", error);
    apiGatewayErrorsTotal.inc({ status_code: "500" });
    httpRequestDurationSeconds.observe(
      { route },
      (Date.now() - startTime) / 1000
    );
    return NextResponse.json(
      { error: "Failed to delete API keys" },
      { status: 500 }
    );
  }
}
