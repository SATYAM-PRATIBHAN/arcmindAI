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
  limiter: Ratelimit.slidingWindow(1, "120 s"), // 1 request per 120 seconds
  analytics: true, // Optional: Enable analytics
});

export const otpRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1, "60 s"),
  analytics: true
})
