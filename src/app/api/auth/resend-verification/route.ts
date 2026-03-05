import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import { prisma } from '@/lib/db/prisma';
import { sendVerificationEmail } from '@/lib/services/email-service';
import type { ApiResponse } from '@/types';

const schema = z.object({
  email: z.string().email('Email inválido'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      const response: ApiResponse = { error: parsed.error.issues[0].message };
      return NextResponse.json(response, { status: 400 });
    }

    const { email } = parsed.data;

    const advertiser = await prisma.advertiser.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { id: true, emailVerified: true, emailVerifyToken: true },
    });

    // Always return success to prevent email enumeration
    if (!advertiser || advertiser.emailVerified || !advertiser.emailVerifyToken) {
      const response: ApiResponse = {
        data: { message: 'Si el email existe y no está verificado, recibirás un correo.' },
      };
      return NextResponse.json(response);
    }

    await sendVerificationEmail(email, advertiser.emailVerifyToken);

    const response: ApiResponse = {
      data: { message: 'Si el email existe y no está verificado, recibirás un correo.' },
    };
    return NextResponse.json(response);
  } catch (err) {
    console.error('Resend verification error:', err);
    const response: ApiResponse = { error: 'Error al enviar el correo de verificación. Intenta de nuevo.' };
    return NextResponse.json(response, { status: 500 });
  }
}
