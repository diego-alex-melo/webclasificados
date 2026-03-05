import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { getAdvertiserFromToken, AuthError } from '@/lib/services/auth-service';
import {
  createAd,
  getAdsByCountry,
  getAdsByService,
  getAdsByTradition,
  getAdsByProfessional,
  searchAds,
  AdError,
} from '@/lib/services/ad-service';
import { PROFESSIONAL_TYPES } from '@/types';

import type { ApiResponse, PaginatedResponse } from '@/types';

// ── Zod schemas ─────────────────────────────────────────────────────────────

const createAdSchema = z.object({
  title: z
    .string()
    .min(10, 'El título debe tener al menos 10 caracteres')
    .max(100, 'El título no puede tener más de 100 caracteres'),
  description: z
    .string()
    .min(50, 'La descripción debe tener al menos 50 caracteres')
    .max(2000, 'La descripción no puede tener más de 2000 caracteres'),
  services: z
    .array(z.string())
    .min(1, 'Debes seleccionar al menos un servicio'),
  professionalType: z.enum(PROFESSIONAL_TYPES),
  traditions: z
    .array(z.string())
    .min(1, 'Debes seleccionar al menos una tradición'),
  imageUrl: z.string().url('URL de imagen inválida').optional(),
});

// ── POST /api/ads — Create ad ───────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // Auth check
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autenticación requerido' },
        { status: 401 },
      );
    }

    const token = authHeader.slice(7);
    const advertiser = await getAdvertiserFromToken(token);

    // Validate body
    const body = await request.json();
    const parsed = createAdSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Datos inválidos';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    // Extract client IP
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      undefined;

    // Create ad
    const ad = await createAd({
      ...parsed.data,
      advertiserId: advertiser.id,
      ip,
    });

    // If rejected, return the rejection reason with 422
    if (ad.status === 'REJECTED') {
      return NextResponse.json(
        {
          data: ad,
          error: ad.rejectionReason ?? 'Anuncio rechazado por el sistema anti-spam',
        },
        { status: 422 },
      );
    }

    return NextResponse.json({ data: ad }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    if (err instanceof AdError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error('POST /api/ads error:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

// ── GET /api/ads — List/search ads ──────────────────────────────────────────

export async function GET(request: NextRequest): Promise<NextResponse<PaginatedResponse<unknown>>> {
  try {
    const { searchParams } = new URL(request.url);

    const country = searchParams.get('country') ?? undefined;
    const service = searchParams.get('service') ?? undefined;
    const tradition = searchParams.get('tradition') ?? undefined;
    const professional = searchParams.get('professional') ?? undefined;
    const q = searchParams.get('q') ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10) || 20),
    );

    let result;

    if (q) {
      // Full-text search with optional filters
      result = await searchAds(q, {
        countryCode: country,
        serviceSlug: service,
        traditionSlug: tradition,
        professionalType: professional,
      }, page, pageSize);
    } else if (service && country) {
      result = await getAdsByService(country, service, page, pageSize);
    } else if (tradition && country) {
      result = await getAdsByTradition(country, tradition, page, pageSize);
    } else if (professional && country) {
      result = await getAdsByProfessional(country, professional, page, pageSize);
    } else if (country) {
      result = await getAdsByCountry(country, page, pageSize);
    } else {
      // Default: all active ads (no country filter)
      result = await getAdsByCountry('', page, pageSize);
    }

    return NextResponse.json({
      data: result.ads,
      meta: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      },
    });
  } catch (err) {
    console.error('GET /api/ads error:', err);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        meta: { total: 0, page: 1, pageSize: 20, totalPages: 0 },
      },
      { status: 500 },
    );
  }
}
