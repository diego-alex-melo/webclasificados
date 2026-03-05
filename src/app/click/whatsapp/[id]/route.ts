import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db/prisma';
import { trackClick } from '@/lib/services/click-tracker';
import { notifyNewContact } from '@/lib/services/push-service';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;

  const ad = await prisma.ad.findUnique({
    where: { id },
    include: {
      advertiser: {
        select: { whatsappNumber: true },
      },
    },
  });

  if (!ad || ad.status !== 'ACTIVE') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Fire-and-forget: track click without blocking redirect
  trackClick(id, 'WHATSAPP', request.headers).catch((err) =>
    console.error('Click tracking error:', err),
  );

  // Fire-and-forget: push notification to advertiser
  notifyNewContact(ad.advertiserId, ad.title).catch(() => {});

  const message = `Hola, vi tu anuncio '${ad.title}' en WebClasificados y quiero más información.`;
  const whatsappUrl = `https://wa.me/${ad.advertiser.whatsappNumber}?text=${encodeURIComponent(message)}`;

  return NextResponse.redirect(whatsappUrl, 307);
}
