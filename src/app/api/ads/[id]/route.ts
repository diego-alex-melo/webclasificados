import { NextRequest, NextResponse } from 'next/server';

import { getAdvertiserFromToken, AuthError } from '@/lib/services/auth-service';
import { rateLimit } from '@/lib/utils/rate-limit';
import { prisma } from '@/lib/db/prisma';
import type { ApiResponse } from '@/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/ads/[id]
 * Soft-delete an ad by setting status to DELETED.
 * Only the owner can delete their own ads.
 */
export async function DELETE(
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

    const limited = await rateLimit(request, { prefix: 'ads:delete', maxRequests: 5, windowSeconds: 3600 }, advertiser.id);
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

    if (ad.status === 'DELETED') {
      return NextResponse.json(
        { error: 'Este anuncio ya fue eliminado' },
        { status: 400 },
      );
    }

    await prisma.ad.update({
      where: { id },
      data: { status: 'DELETED' },
    });

    return NextResponse.json({ data: { message: 'Anuncio eliminado correctamente' } });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    console.error('DELETE /api/ads/[id] error:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
