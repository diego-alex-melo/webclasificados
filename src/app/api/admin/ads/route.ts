import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/utils/admin-auth';
import { AuthError } from '@/lib/services/auth-service';

import type { ApiResponse, PaginatedResponse } from '@/types';

// ── GET /api/admin/ads — List ads with filters ──────────────────────────────

export async function GET(
  request: NextRequest,
): Promise<NextResponse<PaginatedResponse<unknown>>> {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? undefined;
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10) || 20),
    );

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }

    const [ads, total] = await Promise.all([
      prisma.ad.findMany({
        where,
        include: {
          advertiser: {
            select: {
              id: true,
              email: true,
              whatsappNumber: true,
              reputation: true,
              countryCode: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.ad.count({ where }),
    ]);

    return NextResponse.json({
      data: ads,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        {
          error: err.message,
          meta: { total: 0, page: 1, pageSize: 20, totalPages: 0 },
        },
        { status: err.statusCode },
      );
    }
    console.error('GET /api/admin/ads error:', err);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        meta: { total: 0, page: 1, pageSize: 20, totalPages: 0 },
      },
      { status: 500 },
    );
  }
}

// ── PATCH /api/admin/ads — Approve or reject ad ─────────────────────────────

const patchSchema = z.object({
  adId: z.string().uuid(),
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
});

// ── DELETE /api/admin/ads — Delete an ad ──────────────────────────────────

const deleteSchema = z.object({
  adId: z.string().uuid(),
});

export async function DELETE(
  request: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const parsed = deleteSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Datos inválidos';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { adId } = parsed.data;

    const ad = await prisma.ad.findUnique({ where: { id: adId } });
    if (!ad) {
      return NextResponse.json({ error: 'Anuncio no encontrado' }, { status: 404 });
    }

    await prisma.ad.delete({ where: { id: adId } });

    return NextResponse.json({ data: { deleted: true } });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode },
      );
    }
    console.error('DELETE /api/admin/ads error:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
): Promise<NextResponse<ApiResponse>> {
  try {
    await requireAdmin(request);

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? 'Datos inválidos';
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { adId, action, reason } = parsed.data;

    // Verify ad exists
    const ad = await prisma.ad.findUnique({ where: { id: adId } });
    if (!ad) {
      return NextResponse.json({ error: 'Anuncio no encontrado' }, { status: 404 });
    }

    if (action === 'approve') {
      const now = new Date();
      const expiresAt = new Date(now);
      expiresAt.setDate(expiresAt.getDate() + 60);

      const updated = await prisma.ad.update({
        where: { id: adId },
        data: {
          status: 'ACTIVE',
          publishedAt: now,
          expiresAt,
          rejectionReason: null,
        },
      });
      return NextResponse.json({ data: updated });
    }

    // action === 'reject'
    const updated = await prisma.ad.update({
      where: { id: adId },
      data: {
        status: 'REJECTED',
        rejectionReason: reason ?? 'Rechazado por administrador',
      },
    });
    return NextResponse.json({ data: updated });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode },
      );
    }
    console.error('PATCH /api/admin/ads error:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
