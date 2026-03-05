import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db/prisma';
import { verifyEmail, AuthError } from '@/lib/services/auth-service';
import { sendWelcome } from '@/lib/services/email-service';

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token de verificación requerido' },
        { status: 400 },
      );
    }

    // Look up the advertiser before verification clears the token
    const advertiser = await prisma.advertiser.findFirst({
      where: { emailVerifyToken: token },
      select: { email: true },
    });

    await verifyEmail(token);

    // Send welcome email after successful verification
    if (advertiser) {
      try {
        await sendWelcome(advertiser.email, '');
      } catch (emailErr) {
        console.error('Failed to send welcome email:', emailErr);
      }
    }

    // Redirect to login page with verified flag
    return NextResponse.redirect(new URL('/login?verified=true', request.url));
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode },
      );
    }

    console.error('Email verification error:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
