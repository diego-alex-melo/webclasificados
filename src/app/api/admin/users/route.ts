import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/utils/admin-auth';
import { AuthError } from '@/lib/services/auth-service';

import type { ApiResponse, PaginatedResponse } from '@/types';

// ── GET /api/admin/users — List advertisers ─────────────────────────────────

export async function GET(
  request: NextRequest,
): Promise<NextResponse<PaginatedResponse<unknown>>> {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') ?? undefined;
    const sort = searchParams.get('sort') ?? 'date'; // 'date' | 'reputation'
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const pageSize = Math.min(
      50,
      Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10) || 20),
    );

    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { whatsappNumber: { contains: search } },
      ];
    }

    const orderBy =
      sort === 'reputation'
        ? { reputation: 'asc' as const }
        : { createdAt: 'desc' as const };

    const [users, total] = await Promise.all([
      prisma.advertiser.findMany({
        where,
        select: {
          id: true,
          email: true,
          whatsappNumber: true,
          countryCode: true,
          reputation: true,
          emailVerified: true,
          createdAt: true,
          _count: { select: { ads: true } },
        },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.advertiser.count({ where }),
    ]);

    return NextResponse.json({
      data: users,
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
    console.error('GET /api/admin/users error:', err);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        meta: { total: 0, page: 1, pageSize: 20, totalPages: 0 },
      },
      { status: 500 },
    );
  }
}

// ── PATCH /api/admin/users — Block or unblock advertiser ────────────────────

const patchSchema = z.object({
  advertiserId: z.string().uuid(),
  action: z.enum(['block', 'unblock', 'set-reputation']),
  reputation: z.number().min(0).max(100).optional(),
});

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

    const { advertiserId, action } = parsed.data;

    // Verify advertiser exists
    const advertiser = await prisma.advertiser.findUnique({
      where: { id: advertiserId },
    });
    if (!advertiser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 },
      );
    }

    let reputation: number;
    if (action === 'set-reputation') {
      if (parsed.data.reputation === undefined) {
        return NextResponse.json(
          { error: 'Se requiere el valor de reputacion' },
          { status: 400 },
        );
      }
      reputation = parsed.data.reputation;
    } else {
      reputation = action === 'block' ? 0 : 100;
    }

    const updated = await prisma.advertiser.update({
      where: { id: advertiserId },
      data: { reputation },
      select: {
        id: true,
        email: true,
        whatsappNumber: true,
        countryCode: true,
        reputation: true,
        createdAt: true,
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
    console.error('PATCH /api/admin/users error:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
