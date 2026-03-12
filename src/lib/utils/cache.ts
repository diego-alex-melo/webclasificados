import getRedis from '@/lib/utils/redis';

const DEFAULT_TTL = 86400; // 24 hours

/**
 * Generic cached query helper.
 * Returns cached value if available, otherwise calls fetcher and caches the result.
 * Falls back to fetcher directly if Redis is unavailable.
 */
export async function cached<T>(key: string, fetcher: () => Promise<T>, ttl = DEFAULT_TTL): Promise<T> {
  const redis = getRedis();
  if (!redis) return fetcher();

  try {
    const raw = await redis.get(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // cache miss or parse error — fall through to fetcher
  }

  const data = await fetcher();

  try {
    await redis.setex(key, ttl, JSON.stringify(data));
  } catch {
    // ignore cache write errors
  }

  return data;
}
