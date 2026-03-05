import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db/prisma';
import { trackClick } from '@/lib/services/click-tracker';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;

  const ad = await prisma.ad.findUnique({
    where: { id },
    include: {
      advertiser: {
        select: { websiteUrl: true },
      },
    },
  });

  if (!ad || ad.status !== 'ACTIVE' || !ad.advertiser.websiteUrl) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Fire-and-forget: track click without blocking redirect
  trackClick(id, 'WEBSITE', request.headers).catch((err) =>
    console.error('Click tracking error:', err),
  );

  const response = NextResponse.redirect(ad.advertiser.websiteUrl, 307);
  response.headers.set('X-Robots-Tag', 'nofollow');
  return response;
}
