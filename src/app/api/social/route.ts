import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import { prisma } from '@/lib/db/prisma';
import { publishToSocial } from '@/lib/services/social-publisher';
import type { ApiResponse } from '@/types';

const bodySchema = z.object({
  adId: z.string().uuid('ID de anuncio inválido'),
});

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * POST /api/social
 * Internal endpoint — publishes an ad to social media platforms.
 * Requires CRON_SECRET authorization.
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // Auth: require CRON_SECRET
    const authHeader = request.headers.get('authorization');
    if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 },
      );
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' },
        { status: 400 },
      );
    }

    const { adId } = parsed.data;

    // Fetch ad with relations needed for social publishing
    const ad = await prisma.ad.findUnique({
      where: { id: adId },
      include: {
        services: { include: { service: true } },
        traditions: { include: { tradition: true } },
        advertiser: {
          select: {
            id: true,
            countryCode: true,
            whatsappNumber: true,
            websiteUrl: true,
            reputation: true,
          },
        },
      },
    });

    if (!ad || ad.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Anuncio no encontrado o no activo' },
        { status: 404 },
      );
    }

    const posts = await publishToSocial(ad);

    return NextResponse.json({
      data: { posts },
    });
  } catch (err) {
    console.error('POST /api/social error:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
