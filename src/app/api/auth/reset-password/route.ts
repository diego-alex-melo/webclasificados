import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import { resetPassword, AuthError } from '@/lib/services/auth-service';
import { rateLimit } from '@/lib/utils/rate-limit';
import type { ApiResponse } from '@/types';

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export async function POST(request: NextRequest) {
  try {
    const limited = await rateLimit(request, { prefix: 'auth:reset', maxRequests: 5, windowSeconds: 900 });
    if (limited) return limited;

    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);

    if (!parsed.success) {
      const response: ApiResponse = { error: parsed.error.issues[0].message };
      return NextResponse.json(response, { status: 400 });
    }

    const { token, password } = parsed.data;
    await resetPassword(token, password);

    const response: ApiResponse = {
      data: { message: 'Contraseña actualizada exitosamente.' },
    };
    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    if (err instanceof AuthError) {
      const response: ApiResponse = { error: err.message };
      return NextResponse.json(response, { status: err.statusCode });
    }

    console.error('Reset password error:', err);
    const response: ApiResponse = { error: 'Error interno del servidor' };
    return NextResponse.json(response, { status: 500 });
  }
}
