import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { getCountryName } from '@/lib/utils/countries';
import CountryFlag from '@/components/CountryFlag';
import { relativeTime } from '@/lib/utils/time';
import {
  generateAdJsonLd,
  generateBreadcrumbJsonLd,
  generateOgTags,
  safeJsonLd,
} from '@/lib/utils/seo-utils';
import Breadcrumbs from '@/components/Breadcrumbs';
import WhatsAppButton from '@/components/WhatsAppButton';
import ShareButton from '@/components/ShareButton';
import FavoriteButton from '@/components/FavoriteButton';
import RelatedAds from '@/components/RelatedAds';

interface PageProps {
  params: Promise<{ slug: string }>;
}

async function getAd(slug: string) {
  const ad = await prisma.ad.findUnique({
    where: { slug },
    include: {
      services: { include: { service: true } },
      traditions: { include: { tradition: true } },
      advertiser: {
        select: {
          id: true,
          reputation: true,
        },
      },
      _count: {
        select: { clickEvents: true },
      },
    },
  });

  if (!ad || ad.status !== 'ACTIVE') return null;
  return ad;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const ad = await getAd(slug);
  if (!ad) return { title: 'Anuncio no encontrado' };

  const countryName = getCountryName(ad.countryCode);
  const description = ad.description.slice(0, 160);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://brujosclassifieds.com';
  const url = `${baseUrl}/anuncio/${ad.slug}`;

  return {
    ...generateOgTags(
      `${ad.title} — ${countryName}`,
      description,
      ad.imageUrl ?? undefined,
      url,
    ),
    alternates: {
      canonical: url,
    },
  };
}

export default async function AdDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const ad = await getAd(slug);
  if (!ad) notFound();

  const countryName = getCountryName(ad.countryCode);
  const countrySlug = ad.countryCode.toLowerCase();
  const serviceSlugs = ad.services.map((s) => s.service.slug);
  const firstService = ad.services[0]?.service;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://brujosclassifieds.com';

  const breadcrumbs = [
    { label: 'Inicio', href: '/' },
    { label: countryName, href: `/${countrySlug}` },
    ...(firstService
      ? [{ label: firstService.name, href: `/${countrySlug}/${firstService.slug}` }]
      : []),
    { label: ad.title },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Breadcrumbs items={breadcrumbs} />

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Main Content */}
        <div>
          {/* Image */}
          {ad.imageUrl && (
            <div className="mb-6 overflow-hidden rounded-xl">
              <img
                src={ad.imageUrl}
                alt={ad.title}
                className="w-full object-cover"
              />
            </div>
          )}

          {/* Header */}
          <div className="mb-4 flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{ad.title}</h1>
            <FavoriteButton adId={ad.id} />
          </div>

          {/* Meta row */}
          <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-text-secondary">
            <span className="inline-flex items-center gap-1">
              <CountryFlag code={ad.countryCode} size={18} /> {countryName}
            </span>
            {ad.publishedAt && <time>{relativeTime(ad.publishedAt)}</time>}
          </div>

          {/* Service tags */}
          {ad.services.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {ad.services.map((s) => (
                <Link
                  key={s.service.slug}
                  href={`/${countrySlug}/${s.service.slug}`}
                  className="rounded-full bg-accent-gold/10 px-3 py-1 text-sm text-accent-gold transition-colors hover:bg-accent-gold/20"
                >
                  {s.service.name}
                </Link>
              ))}
            </div>
          )}

          {/* Tradition tags */}
          {ad.traditions.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {ad.traditions.map((t) => (
                <span
                  key={t.tradition.slug}
                  className="rounded-full bg-bg-secondary px-3 py-1 text-sm text-text-secondary"
                >
                  {t.tradition.name}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          <div className="mb-8 whitespace-pre-line text-text-secondary leading-relaxed">
            {ad.description}
          </div>

          {/* Share */}
          <ShareButton title={ad.title} url={`${baseUrl}/anuncio/${ad.slug}`} />
        </div>

        {/* Sidebar CTAs */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card-gradient rounded-xl p-6">
            <p className="mb-4 text-center text-sm text-text-secondary">
              ¿Te interesa este servicio?
            </p>
            <WhatsAppButton adId={ad.id} clickCount={ad._count.clickEvents} />
            {ad.websiteUrl && ad.advertiser.reputation >= 80 && (
              <a
                href={`/click/web/${ad.id}`}
                target="_blank"
                className="mt-3 block w-full rounded-full bg-[#2563eb] py-3 text-center text-sm font-medium text-white transition-all hover:bg-[#1d4ed8] active:scale-[0.98]"
                rel={`${ad.advertiser.reputation >= 150 ? 'ugc' : 'ugc nofollow'} noopener`}
              >
                Sitio web
              </a>
            )}
          </div>
        </aside>
      </div>

      {/* Service + LocalBusiness JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(generateAdJsonLd(ad)),
        }}
      />

      {/* BreadcrumbList JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(
            generateBreadcrumbJsonLd([
              { name: 'Inicio', url: baseUrl },
              { name: `${countryName}`, url: `${baseUrl}/${countrySlug}` },
              ...(firstService
                ? [{ name: firstService.name, url: `${baseUrl}/${countrySlug}/${firstService.slug}` }]
                : []),
              { name: ad.title, url: `${baseUrl}/anuncio/${ad.slug}` },
            ]),
          ),
        }}
      />

      {/* Related Ads */}
      <RelatedAds
        currentAdId={ad.id}
        serviceSlugs={serviceSlugs}
        countryCode={ad.countryCode}
      />
    </div>
  );
}
