import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/db/prisma';
import { COUNTRY_MAP, countryCodeFromSlug } from '@/lib/utils/countries';
import CountryFlag from '@/components/CountryFlag';
import { getServiceBySlug } from '@/lib/utils/services';
import Breadcrumbs from '@/components/Breadcrumbs';
import AdCard from '@/components/AdCard';
import Pagination from '@/components/Pagination';

interface PageProps {
  params: Promise<{ country: string; service: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { country, service } = await params;
  const code = countryCodeFromSlug(country);
  const info = COUNTRY_MAP[code];
  const svc = getServiceBySlug(service);

  if (!info || !svc) return { title: 'Página no encontrada' };

  return {
    title: `${svc.name} en ${info.name}`,
    description: `${svc.description}. Encuentra profesionales de ${svc.name} en ${info.name}. Publica tu anuncio gratis.`,
  };
}

export default async function ServicePage({ params, searchParams }: PageProps) {
  const { country, service } = await params;
  const sp = await searchParams;
  const code = countryCodeFromSlug(country);
  const info = COUNTRY_MAP[code];
  const svc = getServiceBySlug(service);

  if (!info || !svc) notFound();

  const page = Math.max(1, Number(sp.page) || 1);
  const pageSize = 12;

  // Optional filters from query params
  const traditionFilter = typeof sp.tradition === 'string' ? sp.tradition : '';
  const professionalFilter = typeof sp.professional === 'string' ? sp.professional : '';

  const where: Record<string, unknown> = {
    status: 'ACTIVE',
    countryCode: code,
    services: { some: { service: { slug: service } } },
  };

  if (traditionFilter) {
    where.traditions = { some: { tradition: { slug: traditionFilter } } };
  }
  if (professionalFilter) {
    where.professionalType = professionalFilter;
  }

  const [ads, total, traditions, professionalTypes] = await Promise.all([
    prisma.ad.findMany({
      where,
      include: {
        services: { include: { service: true } },
        traditions: { include: { tradition: true } },
        advertiser: {
          select: {
            id: true,
            reputation: true,
          },
        },
      },
      orderBy: [{ lastBumpedAt: 'desc' }, { publishedAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.ad.count({ where }),
    prisma.tradition.findMany({ orderBy: { name: 'asc' } }),
    prisma.ad
      .findMany({
        where: {
          status: 'ACTIVE',
          countryCode: code,
          services: { some: { service: { slug: service } } },
        },
        select: { professionalType: true },
        distinct: ['professionalType'],
      })
      .then((results) => results.map((r) => r.professionalType)),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  const paginationParams: Record<string, string> = {};
  if (traditionFilter) paginationParams.tradition = traditionFilter;
  if (professionalFilter) paginationParams.professional = professionalFilter;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Inicio', href: '/' },
          { label: info.name, href: `/${country}` },
          { label: svc.name },
        ]}
      />

      <h1 className="mb-2 text-3xl font-bold">
        {svc.emoji} {svc.name} en {info.name}
      </h1>
      <p className="mb-8 text-text-secondary">{svc.description}</p>

      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        {/* Filters */}
        <aside className="space-y-6">
          {traditions.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-text-primary">Tradición</h3>
              <div className="flex flex-col gap-1">
                {traditions.map((t) => {
                  const active = traditionFilter === t.slug;
                  const href = active
                    ? `/${country}/${service}`
                    : `/${country}/${service}?tradition=${t.slug}`;
                  return (
                    <a
                      key={t.slug}
                      href={href}
                      className={`rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                        active
                          ? 'bg-accent-purple/20 text-accent-purple-light'
                          : 'text-text-secondary hover:bg-bg-card hover:text-text-primary'
                      }`}
                    >
                      {t.name}
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {professionalTypes.length > 0 && (
            <div>
              <h3 className="mb-2 text-sm font-semibold text-text-primary">Tipo de Profesional</h3>
              <div className="flex flex-col gap-1">
                {professionalTypes.map((pt) => {
                  const active = professionalFilter === pt;
                  const href = active
                    ? `/${country}/${service}`
                    : `/${country}/${service}?professional=${encodeURIComponent(pt)}`;
                  return (
                    <a
                      key={pt}
                      href={href}
                      className={`rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                        active
                          ? 'bg-accent-purple/20 text-accent-purple-light'
                          : 'text-text-secondary hover:bg-bg-card hover:text-text-primary'
                      }`}
                    >
                      {pt}
                    </a>
                  );
                })}
              </div>
            </div>
          )}
        </aside>

        {/* Results */}
        <div>
          <p className="mb-4 text-sm text-text-secondary">
            {total} anuncio{total !== 1 ? 's' : ''}
          </p>

          {ads.length > 0 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {ads.map((ad) => (
                  <AdCard
                    key={ad.id}
                    ad={{
                      ...ad,
                      publishedAt: ad.publishedAt?.toISOString() ?? null,
                    }}
                  />
                ))}
              </div>
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                baseUrl={`/${country}/${service}`}
                searchParams={paginationParams}
              />
            </>
          ) : (
            <div className="rounded-xl bg-bg-card p-12 text-center">
              <p className="mb-2 text-4xl">{svc.emoji}</p>
              <p className="mb-2 text-lg font-semibold">Aún no hay anuncios</p>
              <p className="text-sm text-text-secondary">
                Sé el primero en publicar un anuncio de {svc.name} en {info.name}.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
