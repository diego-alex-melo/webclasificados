import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getAdvertiserFromToken, AuthError } from '@/lib/services/auth-service';
import { serverError } from '@/lib/services/error-logger';
import { prisma } from '@/lib/db/prisma';
import type { ApiResponse } from '@/types';

const updateProfileSchema = z.object({
  websiteUrl: z
    .string()
    .url('URL inválida')
    .optional()
    .or(z.literal('')),
});

// ── GET /api/profile — Get current profile ──────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const advertiser = await getAdvertiserFromToken(token);

    return NextResponse.json({
      data: {
        email: advertiser.email,
        whatsappNumber: advertiser.whatsappNumber ?? null,
        websiteUrl: advertiser.websiteUrl,
        referralCode: advertiser.referralCode,
      },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// ── PUT /api/profile — Update profile ───────────────────────────────────────

export async function PUT(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token requerido' }, { status: 401 });
    }

    const token = authHeader.slice(7);
    const advertiser = await getAdvertiserFromToken(token);

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Datos inválidos';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { websiteUrl } = parsed.data;

    const updated = await prisma.advertiser.update({
      where: { id: advertiser.id },
      data: {
        websiteUrl: websiteUrl || null,
      },
      select: {
        email: true,
        whatsappNumber: true,
        websiteUrl: true,
        referralCode: true,
      },
    });

    return NextResponse.json({ data: updated });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return serverError('/api/profile', 'PUT', err);
  }
}
