import { NextRequest, NextResponse } from 'next/server';

import { z } from 'zod';

import { Prisma } from '@/generated/prisma';
import { prisma } from '@/lib/db/prisma';
import { getAdvertiserFromToken } from '@/lib/services/auth-service';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const subscriptionSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
    expirationTime: z.number().nullable().optional(),
  }),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  return null;
}

// ---------------------------------------------------------------------------
// POST — Subscribe to push notifications
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const token = extractToken(request);
    if (!token) {
      return NextResponse.json(
        { data: null, error: 'Token de autenticación requerido', meta: null },
        { status: 401 },
      );
    }

    const advertiser = await getAdvertiserFromToken(token);

    const body = await request.json();
    const parsed = subscriptionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { data: null, error: 'Suscripción inválida', meta: null },
        { status: 400 },
      );
    }

    await prisma.advertiser.update({
      where: { id: advertiser.id },
      data: { pushSubscription: parsed.data.subscription as unknown as Prisma.InputJsonValue },
    });

    return NextResponse.json(
      { data: { subscribed: true }, error: null, meta: null },
      { status: 200 },
    );
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode ?? 500;
    const message = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ data: null, error: message, meta: null }, { status });
  }
}

// ---------------------------------------------------------------------------
// DELETE — Unsubscribe from push notifications
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  try {
    const token = extractToken(request);
    if (!token) {
      return NextResponse.json(
        { data: null, error: 'Token de autenticación requerido', meta: null },
        { status: 401 },
      );
    }

    const advertiser = await getAdvertiserFromToken(token);

    await prisma.advertiser.update({
      where: { id: advertiser.id },
      data: { pushSubscription: Prisma.DbNull },
    });

    return NextResponse.json(
      { data: { subscribed: false }, error: null, meta: null },
      { status: 200 },
    );
  } catch (err: unknown) {
    const status = (err as { statusCode?: number }).statusCode ?? 500;
    const message = err instanceof Error ? err.message : 'Error interno';
    return NextResponse.json({ data: null, error: message, meta: null }, { status });
  }
}
