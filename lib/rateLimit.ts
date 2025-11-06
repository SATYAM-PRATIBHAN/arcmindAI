import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Create rate limiter: 1 request per 2 minutes (120 seconds)
export const generationRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(2, "120 s"), // 1 request per 120 seconds
  analytics: true, // Optional: Enable analytics
});

export const otpRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1, "60 s"), // 1 request per 60 seconds
  analytics: true,
});

export const loginRateLimitIP = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "60 s"), // 5 requests per IP per minute
  analytics: true,
});

export const loginRateLimitAccount = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "3600 s"), // 5 requests per account per hour
  analytics: true,
});
