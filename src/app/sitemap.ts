import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db/prisma';
import { COUNTRY_MAP } from '@/lib/utils/countries';
import { SERVICE_CATEGORIES } from '@/lib/utils/services';
import { CITIES, PROFESSIONAL_SLUGS } from '@/lib/utils/cities';

export const dynamic = 'force-dynamic';

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? 'https://webclasificados.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ── Static pages ────────────────────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/buscar`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ];

  // ── Legal pages ─────────────────────────────────────────────────────────
  const legalSlugs = ['terminos', 'privacidad', 'responsabilidad', 'faq'];
  const legalPages: MetadataRoute.Sitemap = legalSlugs.map((slug) => ({
    url: `${BASE_URL}/legal/${slug}`,
    lastModified: now,
    changeFrequency: 'yearly' as const,
    priority: 0.2,
  }));

  // ── Country pages ───────────────────────────────────────────────────────
  const countryPages: MetadataRoute.Sitemap = Object.keys(COUNTRY_MAP).map(
    (code) => ({
      url: `${BASE_URL}/${code.toLowerCase()}`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.9,
    }),
  );

  // ── Service + country pages ─────────────────────────────────────────────
  const serviceCountryPages: MetadataRoute.Sitemap = Object.keys(
    COUNTRY_MAP,
  ).flatMap((code) =>
    SERVICE_CATEGORIES.map((svc) => ({
      url: `${BASE_URL}/${code.toLowerCase()}/${svc.slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  );

  // ── Active ad pages ─────────────────────────────────────────────────────
  const activeAds = await prisma.ad.findMany({
    where: { status: 'ACTIVE' },
    select: { slug: true, updatedAt: true },
    orderBy: { publishedAt: 'desc' },
  });

  const adPages: MetadataRoute.Sitemap = activeAds.map((ad) => ({
    url: `${BASE_URL}/anuncio/${ad.slug}`,
    lastModified: ad.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // ── Blog post pages ─────────────────────────────────────────────────────
  const blogPosts = await prisma.blogPost.findMany({
    where: { publishedAt: { not: null } },
    select: { slug: true, updatedAt: true },
    orderBy: { publishedAt: 'desc' },
  });

  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }));

  // ── Programmatic SEO city pages ─────────────────────────────────────────
  const professionalSlugs = Object.values(PROFESSIONAL_SLUGS);
  const cityPages: MetadataRoute.Sitemap = Object.values(CITIES)
    .flat()
    .flatMap((city) =>
      professionalSlugs.map((profSlug) => ({
        url: `${BASE_URL}/servicios/${profSlug}-en-${city.slug}`,
        lastModified: now,
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      })),
    );

  return [
    ...staticPages,
    ...legalPages,
    ...countryPages,
    ...serviceCountryPages,
    ...adPages,
    ...blogPages,
    ...cityPages,
  ];
}
