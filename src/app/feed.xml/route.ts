import { prisma } from '@/lib/db/prisma';

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? 'https://webclasificados.com';

/**
 * RSS feed of the latest 50 active ads.
 * Accessible at /feed.xml
 */
export async function GET() {
  const ads = await prisma.ad.findMany({
    where: { status: 'ACTIVE' },
    include: {
      services: { include: { service: true } },
      advertiser: { select: { countryCode: true } },
    },
    orderBy: { publishedAt: 'desc' },
    take: 50,
  });

  const items = ads
    .map((ad) => {
      const description = escapeXml(ad.description.slice(0, 200));
      const title = escapeXml(ad.title);
      const link = `${BASE_URL}/anuncio/${ad.slug}`;
      const pubDate = ad.publishedAt
        ? new Date(ad.publishedAt).toUTCString()
        : new Date(ad.createdAt).toUTCString();
      const categories = ad.services
        .map((s) => `<category>${escapeXml(s.service.name)}</category>`)
        .join('\n        ');

      return `    <item>
      <title>${title}</title>
      <description>${description}</description>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      ${categories}
    </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>WebClasificados — Servicios Esotéricos</title>
    <link>${BASE_URL}</link>
    <description>Encuentra servicios esotéricos profesionales en Latinoamérica. Brujos, tarotistas, santeros, videntes y más.</description>
    <language>es</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
