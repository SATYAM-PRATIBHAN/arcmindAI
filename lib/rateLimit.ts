import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Redis client only if credentials are available
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

// Fallback in-memory rate limit tracking for development (when Redis unavailable)
const inMemoryLimits = new Map<string, { count: number; resetAt: number }>();

function checkInMemoryLimit(
  prefix: string,
  key: string,
  maxRequests: number,
  windowMs: number,
) {
  const now = Date.now();

  // Cleanup expired entries
  for (const [k, value] of inMemoryLimits.entries()) {
    if (now > value.resetAt) {
      inMemoryLimits.delete(k);
    }
  }

  const fullKey = `${prefix}:${key}`;
  const limit = inMemoryLimits.get(fullKey);

  if (!limit || now > limit.resetAt) {
    inMemoryLimits.set(fullKey, { count: 1, resetAt: now + windowMs });
    return {
      success: true,
      limit: maxRequests,
      remaining: maxRequests - 1,
      reset: now + windowMs,
    };
  }

  if (limit.count >= maxRequests) {
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      reset: limit.resetAt,
    };
  }

  limit.count++;
  return {
    success: true,
    limit: maxRequests,
    remaining: maxRequests - limit.count,
    reset: limit.resetAt,
  };
}

// Plan-aware generation rate limiters
export const generationRateLimits = redis
  ? {
      free: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(5, "1 h"),
        analytics: true,
      }),

      guest: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(1, "1 d"),
        analytics: true,
      }),

      pro: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(50, "1 h"),
        analytics: true,
      }),

      enterprise: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(200, "1 h"),
        analytics: true,
      }),
    }
  : {
      free: {
        limit: async (key: string) =>
          checkInMemoryLimit("generation:free", key, 5, 3600000),
      } as unknown as Ratelimit,
      guest: {
        limit: async (key: string) =>
          checkInMemoryLimit("generation:guest", key, 1, 86400000), // 1 per day
      } as unknown as Ratelimit,
      pro: {
        limit: async (key: string) =>
          checkInMemoryLimit("generation:pro", key, 50, 3600000),
      } as unknown as Ratelimit,
      enterprise: {
        limit: async (key: string) =>
          checkInMemoryLimit("generation:enterprise", key, 200, 3600000),
      } as unknown as Ratelimit,
    };

export const otpRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(1, "60 s"), // 1 request per 60 seconds
      analytics: true,
    })
  : ({
      limit: async (key: string) => checkInMemoryLimit("otp", key, 1, 60000),
    } as unknown as Ratelimit);

export const signupRateLimitIP = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "1 h"), // 3 signups per IP per hour
      analytics: true,
    })
  : ({
      limit: async (key: string) =>
        checkInMemoryLimit("signup", key, 3, 3600000),
    } as unknown as Ratelimit);

export const loginRateLimitIP = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "60 s"), // 5 requests per IP per minute
      analytics: true,
    })
  : ({
      limit: async (key: string) =>
        checkInMemoryLimit("login:ip", key, 5, 60000),
    } as unknown as Ratelimit);

export const loginRateLimitAccount = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "3600 s"), // 5 requests per account per hour
      analytics: true,
    })
  : ({
      limit: async (key: string) =>
        checkInMemoryLimit("login:account", key, 5, 3600000),
    } as unknown as Ratelimit);

export const contactRateLimitIP = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(3, "1 h"), // 3 contact form submissions per IP per hour
      analytics: true,
    })
  : ({
      limit: async (key: string) =>
        checkInMemoryLimit("contact", key, 3, 3600000),
    } as unknown as Ratelimit);
