import { NextRequest, NextResponse } from 'next/server';

import { getAdvertiserFromToken, AuthError } from '@/lib/services/auth-service';
import { getAdMetrics } from '@/lib/services/click-tracker';
import { prisma } from '@/lib/db/prisma';
import type { ApiResponse } from '@/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/ads/[id]/metrics
 * Returns click metrics for an ad. Requires auth and ownership.
 */
export async function GET(
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
    const { id: adId } = await context.params;

    // Verify ownership
    const ad = await prisma.ad.findFirst({
      where: { id: adId, advertiserId: advertiser.id },
      select: { id: true },
    });

    if (!ad) {
      return NextResponse.json(
        { error: 'Anuncio no encontrado' },
        { status: 404 },
      );
    }

    const metrics = await getAdMetrics(adId);

    return NextResponse.json({ data: metrics });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error('GET /api/ads/[id]/metrics error:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
