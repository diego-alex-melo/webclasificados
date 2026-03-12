import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db/prisma';
import { cached } from '@/lib/utils/cache';
import type { ApiResponse } from '@/types';

export async function GET(): Promise<NextResponse<ApiResponse>> {
  try {
    const traditions = await cached('cache:traditions', () =>
      prisma.tradition.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, slug: true },
      }),
    );

    return NextResponse.json({ data: traditions });
  } catch {
    return NextResponse.json({ error: 'Error al cargar tradiciones' }, { status: 500 });
  }
}
