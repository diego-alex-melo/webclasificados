import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db/prisma';
import { COUNTRY_MAP } from '@/lib/utils/countries';
import { SERVICE_CATEGORIES } from '@/lib/utils/services';
// City pages removed — ads don't have city-level data yet

export const dynamic = 'force-dynamic';

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? 'https://brujosclassifieds.com';

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
  ];

  // Only include /blog in sitemap when there are published posts
  const blogPostCount = await prisma.blogPost.count({
    where: { publishedAt: { not: null } },
  });
  if (blogPostCount > 0) {
    staticPages.push({
      url: `${BASE_URL}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    });
  }

  // ── Legal pages ─────────────────────────────────────────────────────────
  const legalSlugs = ['terminos', 'privacidad', 'responsabilidad'];
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

  // ── Help page ──────────────────────────────────────────────────────────
  const helpPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/ayuda`,
      lastModified: now,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/guia`,
      lastModified: now,
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
  ];

  return [
    ...staticPages,
    ...legalPages,
    ...helpPages,
    ...countryPages,
    ...serviceCountryPages,
    ...adPages,
    ...blogPages,
  ];
}
