import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db/prisma';
import { cached } from '@/lib/utils/cache';
import type { ApiResponse } from '@/types';

export async function GET(): Promise<NextResponse<ApiResponse>> {
  try {
    const services = await cached('cache:services', () =>
      prisma.service.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, slug: true },
      }),
    );

    return NextResponse.json({ data: services });
  } catch {
    return NextResponse.json({ error: 'Error al cargar servicios' }, { status: 500 });
  }
}
