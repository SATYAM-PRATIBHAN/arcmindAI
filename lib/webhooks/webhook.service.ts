import crypto from "crypto";
import { db } from "@/lib/prisma";

type WebhookPayload = {
  userId: string;
  generationId?: string;
  event: string;
  status: string;
  metadata?: Record<string, unknown>;
  result?: unknown;
  error?: string;
};

export async function triggerGenerationWebhooks(
  payload: WebhookPayload,
) {
  try {
    console.log("=================================");
    console.log("WEBHOOK TRIGGERED");
    console.log(JSON.stringify(payload, null, 2));
    console.log("=================================");

    // fetch active webhooks
    const webhooks = await db.webhook.findMany({
      where: {
        userId: payload.userId,
        isActive: true,
      },
    });

    if (!webhooks.length) {
      console.log("No active webhooks found");
      return;
    }

    // send webhook requests
    await Promise.allSettled(
      webhooks.map(async (webhook) => {
        const signature = crypto
          .createHmac("sha256", webhook.secret)
          .update(JSON.stringify(payload))
          .digest("hex");

        try {
          const response = await fetch(webhook.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-webhook-signature": signature,
            },
            body: JSON.stringify(payload),
          });

          const responseBody = await response.text();

          // store delivery log
          await db.webhookDelivery.create({
            data: {
              webhookId: webhook.id,
              event: payload.event,
              status: response.ok ? "success" : "failed",
              responseCode: response.status,
              responseBody,
            },
          });

          console.log(
            `Webhook delivered to ${webhook.url}`,
          );
        } catch (error) {
          console.error(
            `Webhook failed for ${webhook.url}`,
            error,
          );

          await db.webhookDelivery.create({
            data: {
              webhookId: webhook.id,
              event: payload.event,
              status: "failed",
              responseBody:
                error instanceof Error
                  ? error.message
                  : "Unknown error",
            },
          });
        }
      }),
    );
  } catch (error) {
    console.error("Webhook system failure:", error);
  }
}