import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db/prisma';
import type { ApiResponse } from '@/types';

/**
 * Log a server error (500) to the database.
 * Fire-and-forget — never throws, never blocks the response.
 */
export function logError(route: string, method: string, err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack ?? null : null;

  console.error(`[${method}] ${route}:`, message);

  prisma.errorLog
    .create({
      data: { route, method, message, stack },
    })
    .catch(() => {
      // If DB logging itself fails, console.error above is the fallback
    });
}

/**
 * Log error + return 500 response. Use in catch blocks:
 *   return serverError('/api/ads', 'POST', err);
 */
export function serverError(
  route: string,
  method: string,
  err: unknown,
): NextResponse<ApiResponse> {
  logError(route, method, err);
  return NextResponse.json(
    { error: 'Error interno del servidor' },
    { status: 500 },
  );
}
