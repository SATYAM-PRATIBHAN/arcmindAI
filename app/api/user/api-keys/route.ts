import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/prisma";
import {
  encryptApiKey,
  decryptApiKey,
  generateEncryptionKey,
  validateApiKeyFormat,
} from "@/lib/crypto/encryption";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

/**
 * GET /api/user/api-keys
 * Check if user has API keys configured (doesn't return actual keys)
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // @ts-expect-error id is added to the session in the session callback
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      // @ts-expect-error id is added to the session in the session callback
      where: { id: session.user.id },
      select: {
        geminiApiKey: true,
        openaiApiKey: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      hasGeminiKey: !!user.geminiApiKey,
      hasOpenAIKey: !!user.openaiApiKey,
    });
  } catch (error) {
    console.error("Error checking API keys:", error);
    return NextResponse.json(
      { error: "Failed to check API keys" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/user/api-keys
 * Save encrypted API keys for the user
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // @ts-expect-error id is added to the session in the session callback
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { geminiApiKey, openaiApiKey } = body;

    // Validate at least one key is provided
    if (!geminiApiKey && !openaiApiKey) {
      return NextResponse.json(
        { error: "At least one API key must be provided" },
        { status: 400 },
      );
    }

    // Validate API key formats
    if (geminiApiKey && !validateApiKeyFormat(geminiApiKey, "gemini")) {
      return NextResponse.json(
        {
          error:
            "Invalid Gemini API key format. Keys should start with 'AI' and be at least 30 characters.",
        },
        { status: 400 },
      );
    }

    if (openaiApiKey && !validateApiKeyFormat(openaiApiKey, "openai")) {
      return NextResponse.json(
        {
          error:
            "Invalid OpenAI API key format. Keys should start with 'sk-' and be at least 20 characters.",
        },
        { status: 400 },
      );
    }

    // Get or create encryption key for user
    const user = await db.user.findUnique({
      // @ts-expect-error id is added to the session in the session callback
      where: { id: session.user.id },
      select: { encryptionKey: true },
    });

    if (!user) {
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
    await db.user.update({
      // @ts-expect-error id is added to the session in the session callback
      where: { id: session.user.id },
      data: updateData,
    });

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
    return NextResponse.json(
      { error: "Failed to save API keys" },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/user/api-keys
 * Remove user's API keys
 */
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // @ts-expect-error id is added to the session in the session callback
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    await db.user.update({
      // @ts-expect-error id is added to the session in the session callback
      where: { id: session.user.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: "API keys removed successfully",
    });
  } catch (error) {
    console.error("Error deleting API keys:", error);
    return NextResponse.json(
      { error: "Failed to delete API keys" },
      { status: 500 },
    );
  }
}
