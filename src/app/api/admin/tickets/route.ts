import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/utils/admin-auth';
import { AuthError } from '@/lib/services/auth-service';

import type { ApiResponse } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');

    // Build filter
    const where: Record<string, string> = {};
    if (status && ['OPEN', 'RESPONDED', 'CLOSED'].includes(status)) {
      where.status = status;
    }
    if (category && ['BUG', 'AD_ISSUE', 'SUGGESTION', 'OTHER'].includes(category)) {
      where.category = category;
    }

    // Fetch tickets + counts in parallel
    const [tickets, total, open, responded, closed] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.supportTicket.count(),
      prisma.supportTicket.count({ where: { status: 'OPEN' } }),
      prisma.supportTicket.count({ where: { status: 'RESPONDED' } }),
      prisma.supportTicket.count({ where: { status: 'CLOSED' } }),
    ]);

    return NextResponse.json({
      data: tickets,
      meta: { total, open, responded, closed },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode },
      );
    }
    console.error('GET /api/admin/tickets error:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
