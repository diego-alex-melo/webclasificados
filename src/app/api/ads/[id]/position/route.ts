import { NextRequest, NextResponse } from 'next/server';

import { getAdvertiserFromToken, AuthError } from '@/lib/services/auth-service';
import { getAdPosition } from '@/lib/services/click-tracker';
import { prisma } from '@/lib/db/prisma';
import type { ApiResponse } from '@/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/ads/[id]/position?service=tarot&country=CO
 * Returns the 1-based position of an ad in its service listing.
 * Requires auth and ownership.
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

    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service');
    const country = searchParams.get('country');

    if (!service || !country) {
      return NextResponse.json(
        { error: 'Parámetros service y country son requeridos' },
        { status: 400 },
      );
    }

    const position = await getAdPosition(adId, service, country);

    return NextResponse.json({
      data: { position },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error('GET /api/ads/[id]/position error:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
