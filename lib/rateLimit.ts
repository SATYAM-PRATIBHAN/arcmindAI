import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ---------------------------------------------------------------------------
// Graceful fallback: when Upstash credentials are missing/dummy (local dev),
// all rate-limit checks pass silently instead of throwing a DNS error.
// ---------------------------------------------------------------------------

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL ?? "";
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? "";

const isRedisConfigured =
  UPSTASH_URL.length > 0 &&
  !UPSTASH_URL.includes("dummy") &&
  UPSTASH_TOKEN.length > 0 &&
  !UPSTASH_TOKEN.includes("dummy");

// Passthrough limiter used when Redis is not configured
const noopLimiter = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  limit: async (_id: string) => ({
    success: true,
    limit: 999,
    remaining: 998,
    reset: Date.now() + 60_000,
    pending: Promise.resolve(),
  }),
} as unknown as Ratelimit;

function makeRatelimit(
  limiter: ReturnType<typeof Ratelimit.slidingWindow>,
): Ratelimit {
  if (!isRedisConfigured) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[rateLimit] Upstash Redis not configured — rate limiting disabled for local dev.",
      );
    }
    return noopLimiter;
  }

  const redis = new Redis({ url: UPSTASH_URL, token: UPSTASH_TOKEN });
  return new Ratelimit({ redis, limiter, analytics: true });
}

// Create rate limiter: 2 requests per 2 minutes (120 seconds)
export const generationRateLimit = makeRatelimit(
  Ratelimit.slidingWindow(2, "120 s"),
);

export const otpRateLimit = makeRatelimit(Ratelimit.slidingWindow(1, "60 s"));

export const loginRateLimitIP = makeRatelimit(
  Ratelimit.slidingWindow(5, "60 s"),
);

export const loginRateLimitAccount = makeRatelimit(
  Ratelimit.slidingWindow(5, "3600 s"),
);
