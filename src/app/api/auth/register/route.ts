import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import { register, AuthError } from '@/lib/services/auth-service';
import { sendVerificationEmail } from '@/lib/services/email-service';
import { processReferral, validateReferralCode } from '@/lib/services/referral-service';
import type { ApiResponse } from '@/types';

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  whatsappNumber: z
    .string()
    .regex(/^\+\d{10,15}$/, 'Número de WhatsApp inválido. Debe iniciar con + y tener entre 10 y 15 dígitos'),
  referralCode: z.string().length(8).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const response: ApiResponse = {
        error: parsed.error.issues[0].message,
      };
      return NextResponse.json(response, { status: 400 });
    }

    const { email, password, whatsappNumber, referralCode } = parsed.data;

    // Validate referral code if provided
    if (referralCode) {
      const referralValidation = await validateReferralCode(referralCode);
      if (!referralValidation.valid) {
        const response: ApiResponse = { error: 'Código de referido inválido' };
        return NextResponse.json(response, { status: 400 });
      }
    }

    const advertiser = await register({ email, password, whatsappNumber });

    // Process referral if code provided (fire and forget)
    if (referralCode) {
      processReferral(advertiser.id, referralCode).catch((err) => {
        console.error('Failed to process referral:', err);
      });
    }

    // Send verification email (fire and forget — don't block registration)
    sendVerificationEmail(email, advertiser.emailVerifyToken!).catch((err) => {
      console.error('Failed to send verification email:', err);
    });

    const response: ApiResponse = {
      data: { message: 'Revisa tu email para verificar tu cuenta' },
    };
    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      const response: ApiResponse = { error: err.message };
      return NextResponse.json(response, { status: err.statusCode });
    }

    console.error('Registration error:', err);
    const errMsg = err instanceof Error ? err.message : String(err);
    const response: ApiResponse = { error: `Error interno: ${errMsg}` };
    return NextResponse.json(response, { status: 500 });
  }
}
