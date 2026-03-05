import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ids: string[] = Array.isArray(body?.ids) ? body.ids.slice(0, 50) : [];

    if (ids.length === 0) {
      return NextResponse.json({ data: [] });
    }

    const ads = await prisma.ad.findMany({
      where: {
        id: { in: ids },
        status: 'ACTIVE',
      },
      include: {
        services: { include: { service: true } },
        traditions: { include: { tradition: true } },
        advertiser: {
          select: {
            id: true,
            whatsappNumber: true,
            countryCode: true,
            websiteUrl: true,
            reputation: true,
          },
        },
      },
    });

    return NextResponse.json({ data: ads });
  } catch {
    return NextResponse.json({ error: 'Error al cargar favoritos' }, { status: 500 });
  }
}
