import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import { requestPasswordReset } from '@/lib/services/auth-service';
import { sendPasswordResetEmail } from '@/lib/services/email-service';
import { rateLimit } from '@/lib/utils/rate-limit';
import type { ApiResponse } from '@/types';

const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export async function POST(request: NextRequest) {
  try {
    const limited = await rateLimit(request, { prefix: 'auth:forgot', maxRequests: 3, windowSeconds: 900 });
    if (limited) return limited;

    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const response: ApiResponse = { error: parsed.error.issues[0].message };
      return NextResponse.json(response, { status: 400 });
    }

    const { email } = parsed.data;

    // Always return success to avoid revealing whether the email exists.
    // The token is only sent if the account is found.
    const token = await requestPasswordReset(email);
    if (token) {
      await sendPasswordResetEmail(email, token);
    }

    const response: ApiResponse = {
      data: { message: 'Si existe una cuenta con ese email, recibirás un enlace para restablecer tu contraseña.' },
    };
    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error('Forgot password error:', err);
    const response: ApiResponse = { error: 'Error interno del servidor' };
    return NextResponse.json(response, { status: 500 });
  }
}
