import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import getRedis from '@/lib/utils/redis';
import { trackClick } from '@/lib/services/click-tracker';

import type { ApiResponse } from '@/types';

const clickSchema = z.object({
  adId: z.string().uuid('ID de anuncio inválido'),
  type: z.literal('VIEW'),
});

const VIEW_RATE_LIMIT_SECONDS = 3600; // 1 hour

// ── POST /api/click — Track view events ─────────────────────────────────────

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json();
    const parsed = clickSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Datos inválidos';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { adId } = parsed.data;

    // Extract IP for rate limiting
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      'unknown';

    // Rate limit: max 1 view per IP per ad per hour
    const redis = getRedis();
    if (redis) {
      const rateLimitKey = `view_limit:${adId}:${ip}`;
      const existing = await redis.get(rateLimitKey);

      if (existing) {
        // Already tracked recently — silently succeed (no error to client)
        return NextResponse.json({ data: { tracked: false } });
      }

      // Set rate limit key with TTL
      await redis.set(rateLimitKey, '1', 'EX', VIEW_RATE_LIMIT_SECONDS);
    }

    // Track the view
    await trackClick(adId, 'VIEW', request.headers);

    return NextResponse.json({ data: { tracked: true } });
  } catch (err) {
    console.error('POST /api/click error:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
