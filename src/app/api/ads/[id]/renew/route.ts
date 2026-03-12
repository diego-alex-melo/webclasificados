import { NextRequest, NextResponse } from 'next/server';

import { getAdvertiserFromToken, AuthError } from '@/lib/services/auth-service';
import { renewAd, AdError } from '@/lib/services/ad-service';
import { updateReputation } from '@/lib/services/reputation-service';
import { rateLimit } from '@/lib/utils/rate-limit';
import { prisma } from '@/lib/db/prisma';
import type { ApiResponse } from '@/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/ads/[id]/renew
 * Renew an active ad within the last 7 days before expiry.
 * Resets the 60-day timer and grants reputation bonus.
 */
export async function POST(
  request: NextRequest,
  context: RouteContext,
): Promise<NextResponse<ApiResponse>> {
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

    const limited = await rateLimit(request, { prefix: 'ads:renew', maxRequests: 3, windowSeconds: 3600 }, advertiser.id);
    if (limited) return limited;

    const { id } = await context.params;

    // Verify ownership
    const ad = await prisma.ad.findFirst({
      where: { id, advertiserId: advertiser.id },
    });

    if (!ad) {
      return NextResponse.json(
        { error: 'Anuncio no encontrado' },
        { status: 404 },
      );
    }

    const renewed = await renewAd(id, advertiser.id);

    // Recalculate reputation after renewal
    await updateReputation(advertiser.id);

    return NextResponse.json({ data: renewed });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    if (err instanceof AdError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error('POST /api/ads/[id]/renew error:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
