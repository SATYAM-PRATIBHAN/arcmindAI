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

const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [1000, 3000, 7000];

async function deliverWithRetry(
  url: string,
  payload: WebhookPayload,
  signature: string
): Promise<{ ok: boolean; responseCode: number | null; responseBody: string }> {
  let lastError = "";
  let lastCode: number | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt - 1]));
    }

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-webhook-signature": signature,
          "x-webhook-attempt": String(attempt + 1),
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      });

      const responseBody = await response.text();
      lastCode = response.status;

      if (response.ok) {
        return { ok: true, responseCode: response.status, responseBody };
      }

      lastError = responseBody;
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Unknown error";
    }
  }

  return { ok: false, responseCode: lastCode, responseBody: lastError };
}

export async function triggerGenerationWebhooks(payload: WebhookPayload) {
  try {
    console.log("=================================");
    console.log("WEBHOOK TRIGGERED:", payload.event);
    console.log("=================================");

    const webhooks = await db.webhook.findMany({
      where: { userId: payload.userId, isActive: true },
    });

    if (!webhooks.length) {
      console.log("No active webhooks found");
      return;
    }

    await Promise.allSettled(
      webhooks.map(async (webhook) => {
        const signature = crypto
          .createHmac("sha256", webhook.secret)
          .update(JSON.stringify(payload))
          .digest("hex");

        const { ok, responseCode, responseBody } = await deliverWithRetry(
          webhook.url,
          payload,
          signature
        );

        await db.webhookDelivery.create({
          data: {
            webhookId: webhook.id,
            event: payload.event,
            status: ok ? "success" : "failed",
            responseCode,
            responseBody,
            attempts: MAX_RETRIES,
          },
        });

        console.log(
          ok
            ? `Webhook delivered to ${webhook.url}`
            : `Webhook failed for ${webhook.url}: ${responseBody}`
        );
      })
    );
  } catch (error) {
    console.error("Webhook system failure:", error);
  }
}
