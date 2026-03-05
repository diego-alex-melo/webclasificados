import type { Metadata } from 'next';
import { prisma } from '@/lib/db/prisma';
import { SERVICE_CATEGORIES } from '@/lib/utils/services';
import { COUNTRY_MAP } from '@/lib/utils/countries';
import SearchBar from '@/components/SearchBar';
import AdCard from '@/components/AdCard';
import Pagination from '@/components/Pagination';
import Breadcrumbs from '@/components/Breadcrumbs';

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export const metadata: Metadata = {
  title: 'Buscar Servicios Esotéricos',
  description:
    'Busca y encuentra servicios esotéricos profesionales. Filtra por país, servicio, tradición y tipo de profesional.',
};

export default async function SearchPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const query = typeof sp.q === 'string' ? sp.q : '';
  const serviceFilter = typeof sp.service === 'string' ? sp.service : '';
  const countryFilter = typeof sp.country === 'string' ? sp.country : '';
  const traditionFilter = typeof sp.tradition === 'string' ? sp.tradition : '';
  const professionalFilter = typeof sp.professional === 'string' ? sp.professional : '';
  const page = Math.max(1, Number(sp.page) || 1);
  const pageSize = 12;

  // Build where clause
  const where: Record<string, unknown> = { status: 'ACTIVE' };

  if (query) {
    where.OR = [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
    ];
  }
  if (countryFilter) {
    where.advertiser = { countryCode: countryFilter.toUpperCase() };
  }
  if (serviceFilter) {
    where.services = { some: { service: { slug: serviceFilter } } };
  }
  if (traditionFilter) {
    where.traditions = { some: { tradition: { slug: traditionFilter } } };
  }
  if (professionalFilter) {
    where.professionalType = professionalFilter;
  }

  const skip = (page - 1) * pageSize;

  const [ads, total, services, traditions] = await Promise.all([
    prisma.ad.findMany({
      where,
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
      skip,
      take: pageSize,
    }),
    prisma.ad.count({ where }),
    prisma.service.findMany({ orderBy: { name: 'asc' } }),
    prisma.tradition.findMany({ orderBy: { name: 'asc' } }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  // Build search params for pagination links
  const paginationParams: Record<string, string> = {};
  if (query) paginationParams.q = query;
  if (serviceFilter) paginationParams.service = serviceFilter;
  if (countryFilter) paginationParams.country = countryFilter;
  if (traditionFilter) paginationParams.tradition = traditionFilter;
  if (professionalFilter) paginationParams.professional = professionalFilter;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs items={[{ label: 'Inicio', href: '/' }, { label: 'Buscar' }]} />

      <div className="mb-8">
        <SearchBar defaultValue={query} large />
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        {/* Filters Sidebar */}
        <aside className="space-y-6">
          <FilterSection title="País">
            {Object.entries(COUNTRY_MAP).map(([code, { name, flag }]) => (
              <FilterLink
                key={code}
                href={buildFilterUrl({ ...paginationParams, country: code })}
                active={countryFilter.toUpperCase() === code}
              >
                {flag} {name}
              </FilterLink>
            ))}
          </FilterSection>

          <FilterSection title="Servicio">
            {SERVICE_CATEGORIES.map((s) => (
              <FilterLink
                key={s.slug}
                href={buildFilterUrl({ ...paginationParams, service: s.slug })}
                active={serviceFilter === s.slug}
              >
                {s.emoji} {s.name}
              </FilterLink>
            ))}
          </FilterSection>

          {traditions.length > 0 && (
            <FilterSection title="Tradición">
              {traditions.map((t) => (
                <FilterLink
                  key={t.slug}
                  href={buildFilterUrl({ ...paginationParams, tradition: t.slug })}
                  active={traditionFilter === t.slug}
                >
                  {t.name}
                </FilterLink>
              ))}
            </FilterSection>
          )}

          {/* Clear filters */}
          {(serviceFilter || countryFilter || traditionFilter || professionalFilter) && (
            <a
              href={query ? `/buscar?q=${encodeURIComponent(query)}` : '/buscar'}
              className="block text-center text-sm text-accent-gold transition-colors hover:text-accent-gold-light"
            >
              Limpiar filtros
            </a>
          )}
        </aside>

        {/* Results */}
        <div>
          <p className="mb-4 text-sm text-text-secondary">
            {total === 0
              ? 'No se encontraron resultados'
              : `${total} anuncio${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''}`}
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
                baseUrl="/buscar"
                searchParams={paginationParams}
              />
            </>
          ) : (
            <div className="rounded-xl bg-bg-card p-12 text-center">
              <p className="mb-2 text-4xl">&#x1F50E;</p>
              <p className="mb-2 text-lg font-semibold">Sin resultados</p>
              <p className="text-sm text-text-secondary">
                Intenta con otros términos de búsqueda o ajusta los filtros.
              </p>
              {query && (
                <p className="mt-4 text-sm text-text-secondary">
                  Sugerencias: prueba con palabras más generales como &ldquo;tarot&rdquo;,
                  &ldquo;amarre&rdquo;, &ldquo;limpieza&rdquo;
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function buildFilterUrl(params: Record<string, string>) {
  const sp = new URLSearchParams();
  for (const [key, val] of Object.entries(params)) {
    if (val && key !== 'page') sp.set(key, val);
  }
  return `/buscar?${sp.toString()}`;
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-text-primary">{title}</h3>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={`rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
        active
          ? 'bg-accent-purple/20 text-accent-purple-light'
          : 'text-text-secondary hover:bg-bg-card hover:text-text-primary'
      }`}
    >
      {children}
    </a>
  );
}
