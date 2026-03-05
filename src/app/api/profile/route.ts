import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getAdvertiserFromToken, AuthError } from '@/lib/services/auth-service';
import { serverError } from '@/lib/services/error-logger';
import { prisma } from '@/lib/db/prisma';
import { COUNTRY_CODES } from '@/types';
import type { ApiResponse } from '@/types';

const updateProfileSchema = z.object({
  whatsappNumber: z
    .string()
    .min(10, 'Número de WhatsApp inválido')
    .max(20, 'Número de WhatsApp inválido')
    .regex(/^\+\d{8,}$/, 'El número debe incluir código de país (ej: +573001234567)'),
  websiteUrl: z
    .string()
    .url('URL inválida')
    .optional()
    .or(z.literal('')),
});

function detectCountryCode(phone: string): string {
  const sorted = Object.keys(COUNTRY_CODES).sort((a, b) => b.length - a.length);
  for (const prefix of sorted) {
    if (phone.startsWith(prefix)) return COUNTRY_CODES[prefix]!;
  }
  return 'CO';
}

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
        whatsappNumber: advertiser.whatsappNumber,
        countryCode: advertiser.countryCode,
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

    const { whatsappNumber, websiteUrl } = parsed.data;

    // Check if new number is already used by another account
    if (whatsappNumber !== advertiser.whatsappNumber) {
      const existing = await prisma.advertiser.findFirst({
        where: { whatsappNumber, id: { not: advertiser.id } },
      });
      if (existing) {
        return NextResponse.json(
          { error: 'Este número de WhatsApp ya está registrado en otra cuenta' },
          { status: 409 },
        );
      }
    }

    const countryCode = detectCountryCode(whatsappNumber);

    const updated = await prisma.advertiser.update({
      where: { id: advertiser.id },
      data: {
        whatsappNumber,
        countryCode,
        websiteUrl: websiteUrl || null,
      },
      select: {
        email: true,
        whatsappNumber: true,
        countryCode: true,
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
