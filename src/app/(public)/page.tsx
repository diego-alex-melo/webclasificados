import Link from 'next/link';
import { prisma } from '@/lib/db/prisma';
import { SERVICE_CATEGORIES } from '@/lib/utils/services';
import SearchBar from '@/components/SearchBar';
import AdCard from '@/components/AdCard';

export const revalidate = 60; // ISR: revalidate every 60 seconds

export default async function HomePage() {
  const recentAds = await prisma.ad.findMany({
    where: { status: 'ACTIVE' },
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
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden px-4 pb-16 pt-20">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-purple/5 to-transparent" />
        <div className="relative mx-auto max-w-3xl text-center">
          <h1 className="mb-4 text-3xl font-bold leading-tight sm:text-5xl">
            Encuentra{' '}
            <span className="text-gradient-gold">servicios esotéricos</span>{' '}
            profesionales
          </h1>
          <p className="mb-8 text-lg text-text-secondary">
            Brujos, tarotistas, santeros, videntes y más. Conecta con profesionales
            esotéricos verificados en toda Latinoamérica.
          </p>
          <div className="mx-auto max-w-xl">
            <SearchBar large />
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="bg-bg-secondary/40 py-16">
        <div className="mx-auto max-w-6xl px-4">
        <h2 className="mb-6 text-center text-2xl font-bold">Servicios</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICE_CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/buscar?service=${cat.slug}`}
              prefetch={false}
              className="card-gradient flex items-start gap-4 rounded-xl p-5 transition-all"
            >
              <span className="text-3xl">{cat.emoji}</span>
              <div>
                <h3 className="font-semibold text-text-primary">{cat.name}</h3>
                <p className="mt-1 text-sm text-text-secondary">{cat.description}</p>
              </div>
            </Link>
          ))}
        </div>
        </div>
      </section>

      {/* Recent Ads */}
      {recentAds.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Anuncios recientes</h2>
            <Link
              href="/buscar"
              className="text-sm text-accent-gold transition-colors hover:text-accent-gold-light"
            >
              Ver todos
            </Link>
          </div>
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
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-bg-secondary/40 py-16 px-4">
        <div className="mx-auto max-w-2xl rounded-2xl bg-gradient-to-br from-accent-purple/20 to-bg-card p-8 text-center sm:p-12">
          <h2 className="mb-3 text-2xl font-bold">
            ¿Eres profesional esotérico?
          </h2>
          <p className="mb-6 text-text-secondary">
            Publica tu anuncio gratis y conecta con miles de personas que buscan tus servicios
            en toda Latinoamérica.
          </p>
          <Link
            href="/dashboard"
            className="glow-gold inline-block rounded-full bg-accent-gold px-8 py-3 font-semibold text-bg-primary transition-all hover:bg-accent-gold-light"
          >
            Publicar anuncio gratis
          </Link>
        </div>
      </section>
    </div>
  );
}
