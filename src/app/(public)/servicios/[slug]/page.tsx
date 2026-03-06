import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import {
  CITIES,
  PROFESSIONAL_SLUGS,
  SLUG_TO_PROFESSIONAL,
  PROFESSIONAL_LABELS,
  findCityBySlug,
} from '@/lib/utils/cities';
import {
  generateOgTags,
  generateBreadcrumbJsonLd,
  generateCategoryJsonLd,
  safeJsonLd,
} from '@/lib/utils/seo-utils';
import Breadcrumbs from '@/components/Breadcrumbs';
import AdCard from '@/components/AdCard';

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ?? 'https://brujosclassifieds.com';

// ── Route param parsing ─────────────────────────────────────────────────────

/**
 * Parse URL slug like "brujos-en-bogota" into professional + city parts.
 * Returns null if the slug doesn't match the expected pattern.
 */
function parseSlug(
  raw: string,
): { professionalSlug: string; citySlug: string } | null {
  const match = raw.match(/^(.+?)-en-(.+)$/);
  if (!match) return null;
  const professionalSlug = match[1];
  const citySlug = match[2];
  if (!SLUG_TO_PROFESSIONAL[professionalSlug]) return null;
  if (!findCityBySlug(citySlug)) return null;
  return { professionalSlug, citySlug };
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Render on-demand, not at build time (225+ combos would require DB during build)
export const dynamic = 'force-dynamic';

// ── Metadata ────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const parsed = parseSlug(slug);
  if (!parsed) return { title: 'Página no encontrada' };

  const label =
    PROFESSIONAL_LABELS[parsed.professionalSlug] ?? parsed.professionalSlug;
  const cityInfo = findCityBySlug(parsed.citySlug)!;

  const title = `${label} en ${cityInfo.city.name} — Servicios Esotéricos`;
  const description = `Encuentra ${label.toLowerCase()} profesionales en ${cityInfo.city.name}. Consultas espirituales, rituales y trabajos esotéricos. Contacta por WhatsApp.`;

  return {
    ...generateOgTags(
      title,
      description,
      undefined,
      `${BASE_URL}/servicios/${slug}`,
    ),
    alternates: {
      canonical: `${BASE_URL}/servicios/${slug}`,
    },
  };
}

// ── FAQ data ────────────────────────────────────────────────────────────────

function getFaqs(label: string, cityName: string) {
  return [
    {
      q: `¿Cómo encontrar ${label.toLowerCase()} confiables en ${cityName}?`,
      a: `En BrujosClassifieds verificamos a cada profesional antes de publicar su anuncio. Revisa las reseñas, el tipo de servicio que ofrecen y contacta directamente por WhatsApp para una consulta inicial.`,
    },
    {
      q: `¿Cuánto cobran los ${label.toLowerCase()} en ${cityName}?`,
      a: `Los precios varían según el tipo de servicio y la experiencia del profesional. La mayoría ofrece una consulta inicial para evaluar tu caso. Contacta directamente para conocer tarifas.`,
    },
    {
      q: `¿Los ${label.toLowerCase()} en ${cityName} atienden de forma virtual?`,
      a: `Muchos profesionales ofrecen consultas virtuales por WhatsApp o videollamada, además de atención presencial en ${cityName}.`,
    },
    {
      q: `¿Cómo publicar mi anuncio como ${label.toLowerCase().replace(/s$/, '')} en ${cityName}?`,
      a: `Regístrate gratis en BrujosClassifieds, verifica tu número de WhatsApp y publica tu anuncio. Aparecerás en las búsquedas de ${cityName} automáticamente.`,
    },
  ];
}

// ── Page component ──────────────────────────────────────────────────────────

export default async function CityProfessionalPage({
  params,
}: PageProps) {
  const { slug } = await params;
  const parsed = parseSlug(slug);
  if (!parsed) notFound();

  const { professionalSlug, citySlug } = parsed;
  const label =
    PROFESSIONAL_LABELS[professionalSlug] ?? professionalSlug;
  const professionalType = SLUG_TO_PROFESSIONAL[professionalSlug]!;
  const cityInfo = findCityBySlug(citySlug)!;
  const cityName = cityInfo.city.name;
  const countryCode = cityInfo.countryCode;

  // Fetch ads matching professional type + country
  // City-level filtering is approximate — ads don't store city yet
  const ads = await prisma.ad.findMany({
    where: {
      status: 'ACTIVE',
      professionalType,
      advertiser: { countryCode },
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
    take: 20,
  });

  const faqs = getFaqs(label, cityName);

  // Related professional type links for this city
  const relatedProfessionals = Object.entries(PROFESSIONAL_LABELS)
    .filter(([s]) => s !== professionalSlug)
    .slice(0, 6);

  // Related city links for this professional type
  const allCities = CITIES[countryCode] ?? [];
  const relatedCities = allCities
    .filter((c) => c.slug !== citySlug)
    .slice(0, 8);

  // Breadcrumbs
  const breadcrumbItems = [
    { name: 'Inicio', url: BASE_URL },
    {
      name: cityName,
      url: `${BASE_URL}/${countryCode.toLowerCase()}`,
    },
    {
      name: `${label} en ${cityName}`,
      url: `${BASE_URL}/servicios/${slug}`,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Breadcrumbs
        items={[
          { label: 'Inicio', href: '/' },
          { label: cityName, href: `/${countryCode.toLowerCase()}` },
          { label: `${label} en ${cityName}` },
        ]}
      />

      {/* JSON-LD: Breadcrumbs */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd(
            generateBreadcrumbJsonLd(breadcrumbItems),
          ),
        }}
      />

      {/* JSON-LD: ItemList */}
      {ads.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonLd(
              generateCategoryJsonLd(
                ads,
                `${label} en ${cityName}`,
                cityName,
              ),
            ),
          }}
        />
      )}

      {/* JSON-LD: FAQPage */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((faq) => ({
              '@type': 'Question',
              name: faq.q,
              acceptedAnswer: {
                '@type': 'Answer',
                text: faq.a,
              },
            })),
          }),
        }}
      />

      {/* Header */}
      <h1 className="mb-2 text-3xl font-bold">
        {label} en {cityName}
      </h1>
      <p className="mb-8 text-text-secondary">
        Encuentra {label.toLowerCase()} profesionales en {cityName}.
        Consultas espirituales, rituales y trabajos esotéricos con contacto
        directo por WhatsApp.
      </p>

      {/* Ads grid */}
      {ads.length > 0 ? (
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold">
            {label} disponibles
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ads.map((ad) => (
              <AdCard
                key={ad.id}
                ad={{
                  ...ad,
                  publishedAt:
                    ad.publishedAt?.toISOString() ?? null,
                }}
              />
            ))}
          </div>
        </section>
      ) : (
        <section className="mb-12 rounded-xl bg-bg-card p-12 text-center">
          <p className="mb-2 text-lg font-semibold">
            Sé el primero en publicar en {cityName}
          </p>
          <p className="mb-4 text-sm text-text-secondary">
            Aún no hay {label.toLowerCase()} registrados en {cityName}.
            Publica tu anuncio gratis y llega a clientes de tu zona.
          </p>
          <Link
            href="/dashboard"
            className="glow-gold inline-flex items-center gap-1.5 rounded-full bg-accent-gold/10 px-6 py-2.5 text-sm font-medium text-accent-gold transition-all hover:bg-accent-gold/20"
          >
            Publicar mi anuncio
          </Link>
        </section>
      )}

      {/* FAQ section */}
      <section className="mb-12">
        <h2 className="mb-6 text-xl font-bold">
          Preguntas frecuentes
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <details key={i} className="card-gradient rounded-xl p-4">
              <summary className="cursor-pointer font-medium text-text-primary">
                {faq.q}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Internal links: other professionals in same city */}
      {relatedProfessionals.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold">
            Otros profesionales en {cityName}
          </h2>
          <div className="flex flex-wrap gap-2">
            {relatedProfessionals.map(([s, lbl]) => (
              <Link
                key={s}
                href={`/servicios/${s}-en-${citySlug}`}
                className="rounded-full bg-accent-purple/10 px-4 py-1.5 text-sm text-accent-purple-light transition-colors hover:bg-accent-purple/20"
              >
                {lbl} en {cityName}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Internal links: same professional in other cities */}
      {relatedCities.length > 0 && (
        <section className="mb-12">
          <h2 className="mb-4 text-xl font-bold">
            {label} en otras ciudades
          </h2>
          <div className="flex flex-wrap gap-2">
            {relatedCities.map((city) => (
              <Link
                key={city.slug}
                href={`/servicios/${professionalSlug}-en-${city.slug}`}
                className="rounded-full bg-accent-gold/10 px-4 py-1.5 text-sm text-accent-gold transition-colors hover:bg-accent-gold/20"
              >
                {label} en {city.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
