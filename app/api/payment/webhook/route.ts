import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "standardwebhooks";
import { db } from "@/lib/prisma";
import dodopayments from "@/lib/paymentHandler";

type PaymentSucceededPayload = {
  type: string;
  data: {
    metadata?: Record<string, string>;
    subscription_id?: string | null;
    payment_id: string;
    status?: string | null;
    next_billing_date?: string | null;
  };
};

export async function POST(req: NextRequest) {
  const secret = process.env.DODO_WEBHOOK_SECRET;

  if (!secret) {
    return NextResponse.json(
      { success: false, message: "Webhook secret not configured" },
      { status: 500 },
    );
  }

  const rawBody = await req.text();

  const webhookHeaders = {
    "webhook-id": req.headers.get("webhook-id") ?? "",
    "webhook-signature": req.headers.get("webhook-signature") ?? "",
    "webhook-timestamp": req.headers.get("webhook-timestamp") ?? "",
  };

  // 1. Verify Signature
  try {
    const wh = new Webhook(secret);
    wh.verify(rawBody, webhookHeaders);
  } catch (error) {
    console.error("❌ Webhook verification failed:", error);
    return NextResponse.json({ success: false }, { status: 400 });
  }

  // 2. Parse Payload
  let payload: PaymentSucceededPayload;
  try {
    payload = JSON.parse(rawBody);
  } catch (error) {
    console.error("❌ Invalid JSON:", error);
    return NextResponse.json({ success: false }, { status: 400 });
  }

  const eventType = payload.type;
  const data = payload.data;

  // Only handle specific events
  if (!["payment.succeeded", "subscription.renewed"].includes(eventType)) {
    return NextResponse.json({ success: true }); // Ignore irrelevant events
  }

  const metadata = data.metadata;
  if (!metadata?.userId) {
    return NextResponse.json({ success: true }); // Ignore if unrelated
  }

  const userId = metadata.userId;
  const planName = (metadata.planName ?? "pro").toLowerCase();
  const billingPeriod = metadata.billingPeriod ?? "monthly";

  let currentPeriodEnd: Date | null = null;
  const subscriptionId = data.subscription_id ?? null;

  // 3. Fetch subscription info
  if (subscriptionId) {
    try {
      const subscription =
        await dodopayments.subscriptions.retrieve(subscriptionId);

      if (subscription?.next_billing_date) {
        currentPeriodEnd = new Date(subscription.next_billing_date);
      }
    } catch (error) {
      console.error("⚠️ Error fetching subscription details:", error);
    }
  }

  // 4. Update user in DB
  try {
    await db.user.update({
      where: { id: userId },
      data: {
        plan: planName,
        subscriptionId: subscriptionId ?? data.payment_id,
        subscriptionStatus: "active",
        currentPeriodEnd,
      },
    });

    console.log(`✅ Subscription updated for User ${userId}`);
  } catch (error) {
    console.error("❌ Failed to update DB:", error);
  }

  return NextResponse.json({ success: true });
}
