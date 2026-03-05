import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db/prisma';
import { reactivateAd, AdError } from '@/lib/services/ad-service';
import { sendReactivationConfirmation } from '@/lib/services/email-service';

import type { ApiResponse } from '@/types';

const reactivateSchema = z.object({
  token: z.string().min(1, 'Token de reactivación requerido'),
});

/**
 * POST /api/ads/reactivate
 *
 * Reactivate an expired ad using a reactivation token from the expiration email.
 * Body: { token: string }
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const body = await request.json();
    const parsed = reactivateSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Datos inválidos';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { token } = parsed.data;

    // Find ad by reactivation token
    const ad = await prisma.ad.findFirst({
      where: { reactivationToken: token },
      include: {
        advertiser: { select: { email: true } },
      },
    });

    if (!ad) {
      return NextResponse.json(
        { error: 'Token de reactivación inválido o expirado' },
        { status: 400 },
      );
    }

    if (ad.status !== 'EXPIRED') {
      return NextResponse.json(
        { error: 'Este anuncio no está expirado' },
        { status: 400 },
      );
    }

    // Reactivate the ad
    const reactivated = await reactivateAd(ad.id);

    // Clear the reactivation token after use
    await prisma.ad.update({
      where: { id: ad.id },
      data: { reactivationToken: null },
    });

    // Send confirmation email
    try {
      await sendReactivationConfirmation(ad.advertiser.email, ad.title);
    } catch (emailErr) {
      // Log but don't fail the reactivation if email fails
      console.error('Failed to send reactivation confirmation email:', emailErr);
    }

    return NextResponse.json({ data: reactivated });
  } catch (err) {
    if (err instanceof AdError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode },
      );
    }

    console.error('POST /api/ads/reactivate error:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
