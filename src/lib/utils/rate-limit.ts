import { NextRequest, NextResponse } from 'next/server';

import getRedis from '@/lib/utils/redis';
import type { ApiResponse } from '@/types';

interface RateLimitConfig {
  prefix: string;
  maxRequests: number;
  windowSeconds: number;
}

/**
 * Extract client IP from request headers.
 */
export function extractIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    '127.0.0.1'
  );
}

/**
 * Rate-limit a request using Redis INCR + EXPIRE (fixed window counter).
 * Returns a 429 NextResponse if the limit is exceeded, or null if the request is allowed.
 * Fails open if Redis is unavailable.
 */
export async function rateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  advertiserId?: string,
): Promise<NextResponse<ApiResponse> | null> {
  const redis = getRedis();
  if (!redis) return null; // fail open

  const ip = extractIp(request);
  const keys = [`rl:${config.prefix}:ip:${ip}`];
  if (advertiserId) {
    keys.push(`rl:${config.prefix}:uid:${advertiserId}`);
  }

  try {
    for (const key of keys) {
      const count = await redis.incr(key);
      if (count === 1) {
        await redis.expire(key, config.windowSeconds);
      }
      if (count > config.maxRequests) {
        const ttl = await redis.ttl(key);
        return NextResponse.json(
          { error: 'Demasiadas solicitudes. Intenta de nuevo más tarde.' },
          {
            status: 429,
            headers: { 'Retry-After': String(Math.max(ttl, 1)) },
          },
        );
      }
    }
  } catch {
    // fail open on Redis errors
    return null;
  }

  return null;
}
