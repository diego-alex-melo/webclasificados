import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { COUNTRY_MAP, getCountryName, getCountryFlag, countryCodeFromSlug } from '@/lib/utils/countries';
import { SERVICE_CATEGORIES } from '@/lib/utils/services';
import Breadcrumbs from '@/components/Breadcrumbs';
import AdCard from '@/components/AdCard';

interface PageProps {
  params: Promise<{ country: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country } = await params;
  const code = countryCodeFromSlug(country);
  const info = COUNTRY_MAP[code];
  if (!info) return { title: 'País no encontrado' };

  return {
    title: `Servicios Esotéricos en ${info.name}`,
    description: `Encuentra brujos, tarotistas, santeros, videntes y más profesionales esotéricos en ${info.name}. Publica tu anuncio gratis.`,
  };
}

export default async function CountryPage({ params }: PageProps) {
  const { country } = await params;
  const code = countryCodeFromSlug(country);
  const info = COUNTRY_MAP[code];
  if (!info) notFound();

  const countryName = info.name;
  const flag = info.flag;

  // Get ad counts per service for this country
  const serviceCounts = await Promise.all(
    SERVICE_CATEGORIES.map(async (cat) => {
      const count = await prisma.ad.count({
        where: {
          status: 'ACTIVE',
          advertiser: { countryCode: code },
          services: { some: { service: { slug: cat.slug } } },
        },
      });
      return { ...cat, count };
    }),
  );

  // Recent ads
  const recentAds = await prisma.ad.findMany({
    where: {
      status: 'ACTIVE',
      advertiser: { countryCode: code },
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
    orderBy: [{ lastBumpedAt: 'desc' }, { publishedAt: 'desc' }],
    take: 6,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Inicio', href: '/' },
          { label: `${flag} ${countryName}` },
        ]}
      />

      <h1 className="mb-2 text-3xl font-bold">
        Servicios Esotéricos en {countryName} {flag}
      </h1>
      <p className="mb-8 text-text-secondary">
        Encuentra profesionales esotéricos verificados en {countryName}.
      </p>

      {/* Service categories */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-bold">Categorías</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {serviceCounts.map((cat) => (
            <Link
              key={cat.slug}
              href={`/${country}/${cat.slug}`}
              className="card-gradient flex items-center gap-4 rounded-xl p-4 transition-all"
            >
              <span className="text-2xl">{cat.emoji}</span>
              <div className="flex-1">
                <h3 className="font-semibold text-text-primary">{cat.name}</h3>
                <p className="text-sm text-text-secondary">
                  {cat.count} anuncio{cat.count !== 1 ? 's' : ''}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent ads */}
      {recentAds.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-bold">Anuncios recientes</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recentAds.map((ad) => (
              <AdCard
                key={ad.id}
                ad={{
                  ...ad,
                  publishedAt: ad.publishedAt?.toISOString() ?? null,
                }}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
