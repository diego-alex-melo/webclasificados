'use client';

import Link from 'next/link';
import FavoriteButton from '@/components/FavoriteButton';
import WhatsAppButton from '@/components/WhatsAppButton';
import { getCountryFlag } from '@/lib/utils/countries';
import { relativeTime } from '@/lib/utils/time';

interface AdCardAd {
  id: string;
  title: string;
  slug: string;
  description: string;
  imageUrl: string | null;
  professionalType: string;
  countryCode: string;
  websiteUrl: string | null;
  publishedAt: string | Date | null;
  services: Array<{ service: { name: string; slug: string } }>;
  traditions: Array<{ tradition: { name: string; slug: string } }>;
  advertiser: {
    id: string;
    reputation: number;
  };
}

interface AdCardProps {
  ad: AdCardAd;
}

export default function AdCard({ ad }: AdCardProps) {
  const flag = getCountryFlag(ad.countryCode);
  const countrySlug = ad.countryCode.toLowerCase();

  return (
    <article className="card-gradient group relative flex flex-col overflow-hidden rounded-xl transition-all">
      {/* Image or Placeholder */}
      <Link href={`/anuncio/${ad.slug}`} prefetch={false} className="relative aspect-[4/3] overflow-hidden">
        {ad.imageUrl ? (
          <img
            src={ad.imageUrl}
            alt={ad.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent-purple/20 to-bg-card">
            <span className="text-4xl opacity-60">
              {ad.services[0]?.service.slug === 'amor-y-relaciones'
                ? '\u{1F52E}'
                : ad.services[0]?.service.slug === 'proteccion-y-limpieza'
                  ? '\u{1F9FF}'
                  : ad.services[0]?.service.slug === 'prosperidad-y-dinero'
                    ? '\u{2728}'
                    : ad.services[0]?.service.slug === 'salud-y-bienestar'
                      ? '\u{1F33F}'
                      : ad.services[0]?.service.slug === 'lectura-y-adivinacion'
                        ? '\u{1F0CF}'
                        : '\u{1F319}'}
            </span>
          </div>
        )}
        {/* Favorite button overlay */}
        <div className="absolute right-2 top-2">
          <FavoriteButton adId={ad.id} />
        </div>
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Professional type badge + country */}
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-accent-purple/15 px-2.5 py-0.5 text-xs font-medium text-accent-purple-light">
            {ad.professionalType}
          </span>
          <span className="text-sm" title={ad.countryCode}>
            {flag}
          </span>
        </div>

        {/* Title */}
        <Link href={`/anuncio/${ad.slug}`} prefetch={false}>
          <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-text-primary transition-colors group-hover:text-accent-gold">
            {ad.title}
          </h3>
        </Link>

        {/* Service tags */}
        {ad.services.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {ad.services.map((s) => (
              <Link
                key={s.service.slug}
                href={`/${countrySlug}/${s.service.slug}`}
                prefetch={false}
                className="rounded-full bg-accent-gold/10 px-2 py-0.5 text-[11px] text-accent-gold transition-colors hover:bg-accent-gold/20"
              >
                {s.service.name}
              </Link>
            ))}
          </div>
        )}

        {/* Tradition tags */}
        {ad.traditions.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {ad.traditions.map((t) => (
              <span
                key={t.tradition.slug}
                className="rounded-full bg-bg-secondary px-2 py-0.5 text-[11px] text-text-secondary"
              >
                {t.tradition.name}
              </span>
            ))}
          </div>
        )}

        {/* Bottom row: time + WhatsApp */}
        <div className="mt-auto flex items-center justify-between pt-2">
          {ad.publishedAt && (
            <time className="text-xs text-text-secondary">
              {relativeTime(ad.publishedAt)}
            </time>
          )}
          <WhatsAppButton adId={ad.id} small />
        </div>
      </div>
    </article>
  );
}
