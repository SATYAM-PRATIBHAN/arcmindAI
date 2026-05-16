import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { db } from "@/lib/prisma";

interface RouteParams {
  params: { id: string };
}

// PATCH /api/webhooks/[id] — toggle isActive
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    // @ts-expect-error id is added to the session in the session callback
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { isActive } = body;

    if (typeof isActive !== "boolean") {
      return NextResponse.json({ error: "isActive must be a boolean." }, { status: 400 });
    }

    // @ts-expect-error id is added to the session in the session callback
    const userId = session.user.id as string;

    const webhook = await db.webhook.findUnique({ where: { id } });
    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found." }, { status: 404 });
    }
    if (webhook.userId !== userId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    const updated = await db.webhook.update({
      where: { id },
      data: { isActive },
      select: { id: true, isActive: true },
    });

    return NextResponse.json({ success: true, webhook: updated });
  } catch (error) {
    console.error("[WEBHOOK_PATCH]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/webhooks/[id] — remove a webhook
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    // @ts-expect-error id is added to the session in the session callback
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    // @ts-expect-error id is added to the session in the session callback
    const userId = session.user.id as string;

    const webhook = await db.webhook.findUnique({ where: { id } });
    if (!webhook) {
      return NextResponse.json({ error: "Webhook not found." }, { status: 404 });
    }
    if (webhook.userId !== userId) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    // Delete deliveries first (no cascade in MongoDB Prisma)
    await db.webhookDelivery.deleteMany({ where: { webhookId: id } });
    await db.webhook.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[WEBHOOK_DELETE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
