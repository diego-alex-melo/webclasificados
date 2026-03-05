import { NextRequest, NextResponse } from 'next/server';

import { getAdvertiserFromToken, AuthError } from '@/lib/services/auth-service';
import { getAdvertiserAd } from '@/lib/services/ad-service';
import type { ApiResponse } from '@/types';

/**
 * GET /api/ads/mine
 * Returns the authenticated advertiser's active or pending ad.
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autenticación requerido' },
        { status: 401 },
      );
    }

    const token = authHeader.slice(7);
    const advertiser = await getAdvertiserFromToken(token);
    const ad = await getAdvertiserAd(advertiser.id);

    if (!ad) {
      return NextResponse.json(
        { error: 'No tienes anuncios activos' },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: ad });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error('GET /api/ads/mine error:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
