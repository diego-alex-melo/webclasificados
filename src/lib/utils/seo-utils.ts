/**
 * SEO utility functions for JSON-LD structured data and OpenGraph metadata.
 *
 * All functions return plain objects suitable for JSON.stringify() or
 * Next.js generateMetadata().
 */

import type { Metadata } from 'next';

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? 'https://webclasificados.com';
const SITE_NAME = 'WebClasificados';

// ── Types for function inputs ───────────────────────────────────────────────

interface AdForJsonLd {
  title: string;
  description: string;
  slug: string;
  imageUrl: string | null;
  professionalType: string;
  advertiser: {
    countryCode: string;
  };
  services: Array<{ service: { name: string; slug: string } }>;
}

interface CategoryAdForJsonLd {
  title: string;
  slug: string;
  description: string;
  imageUrl: string | null;
}

interface BlogPostForJsonLd {
  title: string;
  slug: string;
  content: string;
  category: string;
  metaDescription?: string | null;
  publishedAt: Date | string | null;
  updatedAt: Date | string;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

// ── JSON-LD generators ──────────────────────────────────────────────────────

/**
 * Generate JSON-LD for a single ad detail page.
 * Combines Service + LocalBusiness schemas for maximum search coverage.
 */
export function generateAdJsonLd(ad: AdForJsonLd) {
  const serviceTypes = ad.services.map((s) => s.service.name);
  const url = `${BASE_URL}/anuncio/${ad.slug}`;

  return {
    '@context': 'https://schema.org',
    '@type': ['Service', 'LocalBusiness'],
    name: ad.title,
    description: ad.description,
    url,
    ...(ad.imageUrl ? { image: ad.imageUrl } : {}),
    provider: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: BASE_URL,
    },
    areaServed: {
      '@type': 'Country',
      name: countryName(ad.advertiser.countryCode),
    },
    ...(serviceTypes.length > 0 ? { serviceType: serviceTypes } : {}),
    additionalType: ad.professionalType,
  };
}

/**
 * Generate ItemList JSON-LD for category/listing pages.
 */
export function generateCategoryJsonLd(
  ads: CategoryAdForJsonLd[],
  categoryName: string,
  countryNameStr: string,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${categoryName} en ${countryNameStr}`,
    numberOfItems: ads.length,
    itemListElement: ads.map((ad, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: ad.title,
      url: `${BASE_URL}/anuncio/${ad.slug}`,
      ...(ad.imageUrl ? { image: ad.imageUrl } : {}),
      description: ad.description.slice(0, 200),
    })),
  };
}

/**
 * Generate BreadcrumbList JSON-LD.
 */
export function generateBreadcrumbJsonLd(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate Organization JSON-LD for the site.
 */
export function generateOrganizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: BASE_URL,
    description:
      'Plataforma de servicios esotéricos profesionales para Latinoamérica. Brujos, tarotistas, santeros, videntes y más.',
    logo: `${BASE_URL}/logo.png`,
    sameAs: [
      // Social profiles — add real URLs when available
    ],
  };
}

/**
 * Generate WebSite JSON-LD with SearchAction for Google sitelinks searchbox.
 */
export function generateWebSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: BASE_URL,
    description:
      'Encuentra servicios esotéricos profesionales en Latinoamérica.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${BASE_URL}/buscar?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generate Article JSON-LD for blog posts.
 */
export function generateArticleJsonLd(post: BlogPostForJsonLd) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription ?? post.content.slice(0, 160),
    url: `${BASE_URL}/blog/${post.slug}`,
    datePublished: post.publishedAt
      ? new Date(post.publishedAt).toISOString()
      : undefined,
    dateModified: new Date(post.updatedAt).toISOString(),
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: BASE_URL,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: BASE_URL,
      logo: {
        '@type': 'ImageObject',
        url: `${BASE_URL}/logo.png`,
      },
    },
    articleSection: post.category,
    inLanguage: 'es',
  };
}

/**
 * Generate OpenGraph + Twitter Card metadata compatible with Next.js generateMetadata().
 */
export function generateOgTags(
  title: string,
  description: string,
  image?: string,
  url?: string,
): Metadata {
  const resolvedUrl = url ?? BASE_URL;
  const resolvedImage = image ?? `${BASE_URL}/og-default.png`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: resolvedUrl,
      siteName: SITE_NAME,
      type: 'website',
      locale: 'es_CO',
      images: [
        {
          url: resolvedImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [resolvedImage],
    },
  };
}

// ── Helpers ─────────────────────────────────────────────────────────────────

const COUNTRY_NAMES: Record<string, string> = {
  CO: 'Colombia',
  MX: 'México',
  US: 'Estados Unidos',
  ES: 'España',
  PE: 'Perú',
  CL: 'Chile',
  AR: 'Argentina',
  EC: 'Ecuador',
  VE: 'Venezuela',
  PA: 'Panamá',
  CR: 'Costa Rica',
  GT: 'Guatemala',
  SV: 'El Salvador',
  HN: 'Honduras',
  NI: 'Nicaragua',
  BO: 'Bolivia',
  PY: 'Paraguay',
  UY: 'Uruguay',
  DO: 'República Dominicana',
};

function countryName(code: string): string {
  return COUNTRY_NAMES[code.toUpperCase()] ?? code;
}
