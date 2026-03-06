import { NextRequest, NextResponse } from 'next/server';

import { getAdvertiserFromToken, AuthError } from '@/lib/services/auth-service';
import { bumpAd, AdError } from '@/lib/services/ad-service';
import { serverError } from '@/lib/services/error-logger';

import type { ApiResponse } from '@/types';

// ── POST /api/ads/bump — Bump (republish) ad ───────────────────────────────

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  try {
    // Auth check
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autenticación requerido' },
        { status: 401 },
      );
    }

    const token = authHeader.slice(7);
    const advertiser = await getAdvertiserFromToken(token);

    // bumpAd finds the active ad and validates cooldown
    const bumped = await bumpAd(advertiser.id);

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
