import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import { login, AuthError } from '@/lib/services/auth-service';
import { serverError } from '@/lib/services/error-logger';
import { rateLimit } from '@/lib/utils/rate-limit';
import type { ApiResponse } from '@/types';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export async function POST(request: NextRequest) {
  try {
    const limited = await rateLimit(request, { prefix: 'auth:login', maxRequests: 5, windowSeconds: 900 });
    if (limited) return limited;

    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      const response: ApiResponse = {
        error: parsed.error.issues[0].message,
      };
      return NextResponse.json(response, { status: 400 });
    }

    const { email, password } = parsed.data;
    const result = await login(email, password);

    const response: ApiResponse = {
      data: {
        token: result.token,
        advertiser: {
          id: result.advertiser.id,
          email: result.advertiser.email,
          reputation: result.advertiser.reputation,
        },
      },
    };
    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    if (err instanceof AuthError) {
      const response: ApiResponse = { error: err.message };
      return NextResponse.json(response, { status: err.statusCode });
    }

    return serverError('/api/auth/login', 'POST', err);
  }
}
