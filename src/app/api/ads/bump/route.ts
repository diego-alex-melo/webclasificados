import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getAdvertiserFromToken, AuthError } from '@/lib/services/auth-service';
import { bumpAd, AdError } from '@/lib/services/ad-service';
import { serverError } from '@/lib/services/error-logger';

import type { ApiResponse } from '@/types';

const bumpSchema = z.object({
  adId: z.string().uuid(),
});

// ── POST /api/ads/bump — Bump (republish) ad ───────────────────────────────

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autenticacion requerido' },
        { status: 401 },
      );
    }

    const token = authHeader.slice(7);
    const advertiser = await getAdvertiserFromToken(token);

    const body = await request.json();
    const parsed = bumpSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'ID de anuncio requerido' }, { status: 400 });
    }

    const bumped = await bumpAd(parsed.data.adId, advertiser.id);

    return NextResponse.json({ data: bumped });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    if (err instanceof AdError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return serverError('/api/ads/bump', 'POST', err);
  }
}
