import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/prisma";
import crypto from "crypto";

// Validate webhook URL — must be HTTPS and not an internal IP
function isValidWebhookUrl(url: string): { valid: boolean; reason?: string } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, reason: "Invalid URL format." };
  }

  if (parsed.protocol !== "https:") {
    return { valid: false, reason: "Webhook URL must use HTTPS." };
  }

  const hostname = parsed.hostname;

  // Block internal/private IPs and localhost
  const internalPatterns = [
    /^localhost$/i,
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    /^::1$/,
    /^0\.0\.0\.0$/,
  ];

  if (internalPatterns.some((p) => p.test(hostname))) {
    return { valid: false, reason: "Internal or private IP addresses are not allowed." };
  }

  return { valid: true };
}

// GET /api/webhooks — list user's webhooks with recent deliveries
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    // @ts-expect-error id is added to the session in the session callback
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // @ts-expect-error id is added to the session in the session callback
    const userId = session.user.id as string;

    const webhooks = await db.webhook.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        deliveries: {
          orderBy: { createdAt: "desc" },
          take: 5, // last 5 deliveries per webhook
        },
      },
    });

    return NextResponse.json({ success: true, webhooks });
  } catch (error) {
    console.error("[WEBHOOKS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/webhooks — register a new webhook
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    // @ts-expect-error id is added to the session in the session callback
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // @ts-expect-error id is added to the session in the session callback
    const userId = session.user.id as string;

    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== "string" || url.trim() === "") {
      return NextResponse.json({ error: "Webhook URL is required." }, { status: 400 });
    }

    const validation = isValidWebhookUrl(url.trim());
    if (!validation.valid) {
      return NextResponse.json({ error: validation.reason }, { status: 400 });
    }

    // Limit to 5 webhooks per user
    const count = await db.webhook.count({ where: { userId } });
    if (count >= 5) {
      return NextResponse.json(
        { error: "Maximum of 5 webhooks allowed per user." },
        { status: 400 }
      );
    }

    // Generate a secure signing secret
    const secret = crypto.randomBytes(32).toString("hex");

    const webhook = await db.webhook.create({
      data: {
        url: url.trim(),
        secret,
        userId,
      },
    });

    return NextResponse.json({
      success: true,
      webhook: {
        id: webhook.id,
        url: webhook.url,
        secret, // returned once — user should store this
        isActive: webhook.isActive,
        createdAt: webhook.createdAt,
      },
    });
  } catch (error) {
    console.error("[WEBHOOKS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
