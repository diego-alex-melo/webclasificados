import { NextRequest, NextResponse } from 'next/server';

import { getAdvertiserFromToken, AuthError } from '@/lib/services/auth-service';
import { getAdvertiserAd, bumpAd, AdError } from '@/lib/services/ad-service';

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

    // Find advertiser's active ad
    const ad = await getAdvertiserAd(advertiser.id);
    if (!ad) {
      return NextResponse.json(
        { error: 'No tienes un anuncio activo para republicar' },
        { status: 404 },
      );
    }

    const bumped = await bumpAd(ad.id, advertiser.id);

    return NextResponse.json({ data: bumped });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    if (err instanceof AdError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error('POST /api/ads/bump error:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
