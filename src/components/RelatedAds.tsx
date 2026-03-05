import { prisma } from '@/lib/db/prisma';
import AdCard from '@/components/AdCard';

interface RelatedAdsProps {
  currentAdId: string;
  serviceSlugs: string[];
  countryCode: string;
}

export default async function RelatedAds({
  currentAdId,
  serviceSlugs,
  countryCode,
}: RelatedAdsProps) {
  const related = await prisma.ad.findMany({
    where: {
      id: { not: currentAdId },
      status: 'ACTIVE',
      advertiser: { countryCode },
      services: serviceSlugs.length > 0
        ? { some: { service: { slug: { in: serviceSlugs } } } }
        : undefined,
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
    orderBy: { publishedAt: 'desc' },
    take: 6,
  });

  if (related.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="mb-6 text-xl font-bold text-text-primary">Anuncios relacionados</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((ad) => (
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
  );
}
