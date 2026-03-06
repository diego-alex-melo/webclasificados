import { NextRequest, NextResponse } from 'next/server';

import { getAdvertiserFromToken, AuthError } from '@/lib/services/auth-service';
import { getAdvertiserAds } from '@/lib/services/ad-service';
import { serverError } from '@/lib/services/error-logger';
import type { ApiResponse } from '@/types';

/**
 * GET /api/ads/mine
 * Returns all of the authenticated advertiser's ads (active, pending, rejected).
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
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
    const ads = await getAdvertiserAds(advertiser.id);

    return NextResponse.json({ data: ads });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return serverError('/api/ads/mine', 'GET', err);
  }
}
