import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import { prisma } from '@/lib/db/prisma';
import {
  sendSupportTicketNotification,
  sendSupportAutoReply,
} from '@/lib/services/email-service';
import type { ApiResponse } from '@/types';

const contactSchema = z.object({
  category: z.enum(['BUG', 'AD_ISSUE', 'SUGGESTION', 'OTHER']),
  email: z.string().email('Email inválido'),
  message: z
    .string()
    .min(10, 'El mensaje debe tener al menos 10 caracteres')
    .max(1000, 'El mensaje no puede exceder 1000 caracteres'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      const response: ApiResponse = {
        error: 'Validation error',
        meta: { details: parsed.error.issues },
      };
      return NextResponse.json(response, { status: 422 });
    }

    const { category, email, message } = parsed.data;

    // Rate limit: max 3 tickets per email in 24h
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await prisma.supportTicket.count({
      where: {
        email,
        createdAt: { gte: twentyFourHoursAgo },
      },
    });

    if (recentCount >= 3) {
      const response: ApiResponse = {
        error: 'Has enviado demasiados mensajes. Intenta de nuevo en 24 horas.',
      };
      return NextResponse.json(response, { status: 429 });
    }

    const ticket = await prisma.supportTicket.create({
      data: { category, email, message },
    });

    // Fire-and-forget: admin notification + user auto-reply
    sendSupportTicketNotification({
      id: ticket.id,
      category: ticket.category,
      email: ticket.email,
      message: ticket.message,
    }).catch((err) => console.error('Failed to send admin notification:', err));

    sendSupportAutoReply(ticket.email).catch((err) =>
      console.error('Failed to send auto-reply:', err),
    );

    const response: ApiResponse<{ id: string }> = {
      data: { id: ticket.id },
    };
    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    console.error('Contact form error:', err);
    const response: ApiResponse = { error: 'Error interno del servidor' };
    return NextResponse.json(response, { status: 500 });
  }
}
