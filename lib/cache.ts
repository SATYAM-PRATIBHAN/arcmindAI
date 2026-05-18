import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export function getCacheKey(
  keyword: string,
  userId: string,
  ...args: string[]
): string {
  return `${keyword}:${userId}:${args.join("/")}`;
}

export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  try {
    const hit = await redis.get<T>(key);
    if (hit !== null) {
      return hit;
    }
  } catch (err) {
    console.warn(`Failed to get cache for key=${key}:`, err);
  }

  const value = await fetcher();

  try {
    await redis.set(key, value, { ex: ttlSeconds });
  } catch (err) {
    console.warn(`Failed to set cache for key=${key}:`, err);
  }

  return value;
}

export async function invalidateCache(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch (err) {
    console.warn(`Failed to delete cache for key=${key}:`, err);
  }
}
