import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/utils/admin-auth';
import { AuthError } from '@/lib/services/auth-service';

import type { ApiResponse } from '@/types';

const updateSchema = z.object({
  status: z.enum(['OPEN', 'RESPONDED', 'CLOSED']).optional(),
  adminNotes: z.string().max(2000).optional(),
}).refine((data) => data.status !== undefined || data.adminNotes !== undefined, {
  message: 'Debe enviar al menos status o adminNotes',
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse>> {
  try {
    await requireAdmin(request);

    const { id } = await params;

    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    // Check ticket exists
    const existing = await prisma.supportTicket.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Ticket no encontrado' },
        { status: 404 },
      );
    }

    const updatedTicket = await prisma.supportTicket.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ data: updatedTicket });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode },
      );
    }
    console.error('PATCH /api/admin/tickets/[id] error:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
