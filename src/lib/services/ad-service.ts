import { randomUUID } from 'crypto';

import { prisma } from '@/lib/db/prisma';
import { contentHash } from '@/lib/utils/content-hash';
import { generateAdSlug } from '@/lib/utils/slug';
import { runSpamPipeline } from '@/lib/services/spam-pipeline';

import type { Ad } from '@/generated/prisma';

// ── Types ───────────────────────────────────────────────────────────────────

interface CreateAdInput {
  title: string;
  description: string;
  imageUrl?: string;
  services: string[]; // service slugs
  professionalType: string;
  traditions: string[]; // tradition slugs
  advertiserId: string;
  ip?: string;
}

interface PaginatedAds {
  ads: Ad[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface SearchFilters {
  countryCode?: string;
  serviceSlug?: string;
  traditionSlug?: string;
  professionalType?: string;
}

const AD_EXPIRY_DAYS = 60;
const BUMP_COOLDOWN_HOURS = 48;
const DEFAULT_PAGE_SIZE = 20;

const activeAdIncludes = {
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
} as const;

const activeAdOrderBy = [
  { lastBumpedAt: 'desc' as const },
  { publishedAt: 'desc' as const },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function expiresAt(): Date {
  const d = new Date();
  d.setDate(d.getDate() + AD_EXPIRY_DAYS);
  return d;
}

function paginate(page: number, pageSize: number) {
  const safePage = Math.max(1, page);
  const safeSize = Math.min(Math.max(1, pageSize), 50);
  return { skip: (safePage - 1) * safeSize, take: safeSize, page: safePage, pageSize: safeSize };
}

// ── Create ──────────────────────────────────────────────────────────────────

export async function createAd(data: CreateAdInput): Promise<Ad> {
  const {
    title,
    description,
    imageUrl,
    services,
    professionalType,
    traditions,
    advertiserId,
    ip,
  } = data;

  // 1. Check advertiser exists and is verified
  const advertiser = await prisma.advertiser.findUnique({
    where: { id: advertiserId },
  });

  if (!advertiser) {
    throw new AdError('Anunciante no encontrado', 404);
  }

  if (!advertiser.emailVerified) {
    throw new AdError('Debes verificar tu email antes de publicar', 403);
  }

  // 2. Check limit: max 1 ACTIVE ad per advertiser
  const activeCount = await prisma.ad.count({
    where: { advertiserId, status: 'ACTIVE' },
  });

  if (activeCount >= 1) {
    throw new AdError('Solo puedes tener 1 anuncio activo', 409);
  }

  // 3. Generate content hash
  const hash = contentHash(title, description, advertiser.whatsappNumber);

  // 4. Run spam pipeline
  const spamResult = await runSpamPipeline({
    title,
    description,
    whatsappNumber: advertiser.whatsappNumber,
    imageUrl,
    advertiserId,
    ip,
  });

  // 5. Resolve service and tradition IDs
  const serviceRecords = await prisma.service.findMany({
    where: { slug: { in: services } },
  });

  const traditionRecords = await prisma.tradition.findMany({
    where: { slug: { in: traditions } },
  });

  // 6. Create ad — status depends on spam result
  const now = new Date();
  const adId = randomUUID();
  const slug = generateAdSlug(title, adId);

  const ad = await prisma.ad.create({
    data: {
      id: adId,
      advertiserId,
      title,
      description,
      imageUrl: imageUrl ?? null,
      contentHash: hash,
      professionalType,
      status: spamResult.passed ? 'ACTIVE' : 'REJECTED',
      publishedAt: spamResult.passed ? now : null,
      expiresAt: spamResult.passed ? expiresAt() : null,
      rejectionReason: spamResult.passed ? null : spamResult.reason,
      slug,
      services: {
        create: serviceRecords.map((s) => ({ serviceId: s.id })),
      },
      traditions: {
        create: traditionRecords.map((t) => ({ traditionId: t.id })),
      },
    },
    include: activeAdIncludes,
  });

  return ad;
}

// ── Read by slug ────────────────────────────────────────────────────────────

export async function getAdBySlug(slug: string) {
  const ad = await prisma.ad.findUnique({
    where: { slug },
    include: activeAdIncludes,
  });

  if (!ad) {
    throw new AdError('Anuncio no encontrado', 404);
  }

  return ad;
}

// ── List by country ─────────────────────────────────────────────────────────

export async function getAdsByCountry(
  countryCode: string,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<PaginatedAds> {
  const p = paginate(page, pageSize);

  const where = {
    status: 'ACTIVE' as const,
    ...(countryCode ? { advertiser: { countryCode } } : {}),
  };

  const [ads, total] = await Promise.all([
    prisma.ad.findMany({
      where,
      include: activeAdIncludes,
      orderBy: activeAdOrderBy,
      skip: p.skip,
      take: p.take,
    }),
    prisma.ad.count({ where }),
  ]);

  return {
    ads,
    total,
    page: p.page,
    pageSize: p.pageSize,
    totalPages: Math.ceil(total / p.pageSize),
  };
}

// ── List by service ─────────────────────────────────────────────────────────

export async function getAdsByService(
  countryCode: string,
  serviceSlug: string,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<PaginatedAds> {
  const p = paginate(page, pageSize);

  const where = {
    status: 'ACTIVE' as const,
    advertiser: { countryCode },
    services: { some: { service: { slug: serviceSlug } } },
  };

  const [ads, total] = await Promise.all([
    prisma.ad.findMany({
      where,
      include: activeAdIncludes,
      orderBy: activeAdOrderBy,
      skip: p.skip,
      take: p.take,
    }),
    prisma.ad.count({ where }),
  ]);

  return {
    ads,
    total,
    page: p.page,
    pageSize: p.pageSize,
    totalPages: Math.ceil(total / p.pageSize),
  };
}

// ── List by tradition ───────────────────────────────────────────────────────

export async function getAdsByTradition(
  countryCode: string,
  traditionSlug: string,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<PaginatedAds> {
  const p = paginate(page, pageSize);

  const where = {
    status: 'ACTIVE' as const,
    advertiser: { countryCode },
    traditions: { some: { tradition: { slug: traditionSlug } } },
  };

  const [ads, total] = await Promise.all([
    prisma.ad.findMany({
      where,
      include: activeAdIncludes,
      orderBy: activeAdOrderBy,
      skip: p.skip,
      take: p.take,
    }),
    prisma.ad.count({ where }),
  ]);

  return {
    ads,
    total,
    page: p.page,
    pageSize: p.pageSize,
    totalPages: Math.ceil(total / p.pageSize),
  };
}

// ── List by professional type ───────────────────────────────────────────────

export async function getAdsByProfessional(
  countryCode: string,
  professionalType: string,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<PaginatedAds> {
  const p = paginate(page, pageSize);

  const where = {
    status: 'ACTIVE' as const,
    advertiser: { countryCode },
    professionalType,
  };

  const [ads, total] = await Promise.all([
    prisma.ad.findMany({
      where,
      include: activeAdIncludes,
      orderBy: activeAdOrderBy,
      skip: p.skip,
      take: p.take,
    }),
    prisma.ad.count({ where }),
  ]);

  return {
    ads,
    total,
    page: p.page,
    pageSize: p.pageSize,
    totalPages: Math.ceil(total / p.pageSize),
  };
}

// ── Search ──────────────────────────────────────────────────────────────────

export async function searchAds(
  query: string,
  filters: SearchFilters = {},
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<PaginatedAds> {
  const p = paginate(page, pageSize);

  const where: Record<string, unknown> = {
    status: 'ACTIVE',
    OR: [
      { title: { contains: query, mode: 'insensitive' } },
      { description: { contains: query, mode: 'insensitive' } },
    ],
  };

  if (filters.countryCode) {
    where.advertiser = { countryCode: filters.countryCode };
  }
  if (filters.serviceSlug) {
    where.services = { some: { service: { slug: filters.serviceSlug } } };
  }
  if (filters.traditionSlug) {
    where.traditions = { some: { tradition: { slug: filters.traditionSlug } } };
  }
  if (filters.professionalType) {
    where.professionalType = filters.professionalType;
  }

  const [ads, total] = await Promise.all([
    prisma.ad.findMany({
      where,
      include: activeAdIncludes,
      orderBy: activeAdOrderBy,
      skip: p.skip,
      take: p.take,
    }),
    prisma.ad.count({ where }),
  ]);

  return {
    ads,
    total,
    page: p.page,
    pageSize: p.pageSize,
    totalPages: Math.ceil(total / p.pageSize),
  };
}

// ── Bump ────────────────────────────────────────────────────────────────────

export async function bumpAd(adId: string, advertiserId: string): Promise<Ad> {
  const ad = await prisma.ad.findFirst({
    where: { id: adId, advertiserId, status: 'ACTIVE' },
  });

  if (!ad) {
    throw new AdError('Anuncio no encontrado o no te pertenece', 404);
  }

  // Check 48h cooldown
  if (ad.lastBumpedAt) {
    const cooldownMs = BUMP_COOLDOWN_HOURS * 60 * 60 * 1000;
    const elapsed = Date.now() - ad.lastBumpedAt.getTime();
    if (elapsed < cooldownMs) {
      const hoursLeft = Math.ceil((cooldownMs - elapsed) / (60 * 60 * 1000));
      throw new AdError(
        `Debes esperar ${hoursLeft} horas para volver a destacar tu anuncio`,
        429,
      );
    }
  }

  return prisma.ad.update({
    where: { id: adId },
    data: { lastBumpedAt: new Date() },
    include: activeAdIncludes,
  });
}

// ── Reactivate ──────────────────────────────────────────────────────────────

export async function reactivateAd(adId: string): Promise<Ad> {
  const ad = await prisma.ad.findUnique({ where: { id: adId } });

  if (!ad) {
    throw new AdError('Anuncio no encontrado', 404);
  }

  if (ad.status !== 'EXPIRED') {
    throw new AdError('Solo se pueden reactivar anuncios expirados', 400);
  }

  return prisma.ad.update({
    where: { id: adId },
    data: {
      status: 'ACTIVE',
      expiresAt: expiresAt(),
      publishedAt: new Date(),
    },
    include: activeAdIncludes,
  });
}

// ── Advertiser's ad ─────────────────────────────────────────────────────────

export async function getAdvertiserAd(advertiserId: string) {
  return prisma.ad.findFirst({
    where: {
      advertiserId,
      status: { in: ['ACTIVE', 'PENDING'] },
    },
    include: activeAdIncludes,
    orderBy: { createdAt: 'desc' },
  });
}

// ── Error class ─────────────────────────────────────────────────────────────

export class AdError extends Error {
  constructor(
    message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'AdError';
  }
}
