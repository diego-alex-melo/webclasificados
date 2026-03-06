import { randomUUID } from 'crypto';

import { prisma } from '@/lib/db/prisma';
import { contentHash } from '@/lib/utils/content-hash';
import { generateAdSlug } from '@/lib/utils/slug';
import { runSpamPipeline } from '@/lib/services/spam-pipeline';
import { countryFromPhone } from '@/lib/utils/country-from-phone';
import { isAdmin } from '@/lib/utils/admin-auth';

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
  whatsappNumber: string;
  countryCode: string;
  websiteUrl?: string;
  ip?: string;
}

interface UpdateAdInput {
  title: string;
  description: string;
  imageUrl?: string;
  services: string[];
  professionalType: string;
  traditions: string[];
  advertiserId: string;
  whatsappNumber: string;
  countryCode: string;
  websiteUrl?: string;
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
const MAX_ADS_PER_ACCOUNT = 3;
const DEFAULT_PAGE_SIZE = 20;

const activeAdIncludes = {
  services: { include: { service: true } },
  traditions: { include: { tradition: true } },
  advertiser: {
    select: {
      id: true,
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

// ── Validate ad limits ──────────────────────────────────────────────────────

async function validateAdLimits(advertiserId: string, countryCode: string, excludeAdId?: string) {
  // Admins have no limits
  const advertiser = await prisma.advertiser.findUnique({
    where: { id: advertiserId },
    select: { email: true },
  });
  if (advertiser && isAdmin(advertiser.email)) return;

  const where: Record<string, unknown> = {
    advertiserId,
    status: { in: ['ACTIVE', 'PENDING'] },
  };
  if (excludeAdId) {
    where.id = { not: excludeAdId };
  }

  const existingAds = await prisma.ad.findMany({
    where,
    select: { id: true, countryCode: true },
  });

  if (existingAds.length >= MAX_ADS_PER_ACCOUNT) {
    throw new AdError(`Solo puedes tener ${MAX_ADS_PER_ACCOUNT} anuncios activos`, 409);
  }

  const hasCountry = existingAds.some((a) => a.countryCode === countryCode);
  if (hasCountry) {
    throw new AdError('Ya tienes un anuncio en este pais', 409);
  }
}

// ── Validate WhatsApp uniqueness (only ACTIVE/PENDING from other advertisers) ─

async function validateWhatsAppUnique(
  whatsappNumber: string,
  advertiserId: string,
  excludeAdId?: string,
) {
  const existing = await prisma.ad.findFirst({
    where: {
      whatsappNumber,
      status: { in: ['ACTIVE', 'PENDING'] },
      advertiserId: { not: advertiserId },
      ...(excludeAdId ? { id: { not: excludeAdId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new AdError('Este numero de WhatsApp ya esta en uso por otro anunciante', 409);
  }
}

// ── Validate Website uniqueness (only ACTIVE/PENDING from other advertisers) ─

async function validateWebsiteUnique(
  websiteUrl: string | undefined | null,
  advertiserId: string,
  excludeAdId?: string,
) {
  if (!websiteUrl) return;

  const existing = await prisma.ad.findFirst({
    where: {
      websiteUrl,
      status: { in: ['ACTIVE', 'PENDING'] },
      advertiserId: { not: advertiserId },
      ...(excludeAdId ? { id: { not: excludeAdId } } : {}),
    },
    select: { id: true },
  });

  if (existing) {
    throw new AdError('Este sitio web ya esta en uso por otro anunciante', 409);
  }
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
    whatsappNumber,
    countryCode,
    websiteUrl,
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

  // 2. Validate limits: max 3 ads, max 1 per country
  await validateAdLimits(advertiserId, countryCode);

  // 3. Validate WhatsApp and website uniqueness (ACTIVE/PENDING from other advertisers)
  await validateWhatsAppUnique(whatsappNumber, advertiserId);
  await validateWebsiteUnique(websiteUrl, advertiserId);

  // 4. Generate content hash
  const hash = contentHash(title, description, whatsappNumber);

  // 5. Run spam pipeline
  let spamResult;
  try {
    spamResult = await runSpamPipeline({
      title,
      description,
      whatsappNumber,
      imageUrl,
      advertiserId,
      ip,
    });
  } catch (err) {
    console.error('[createAd] Spam pipeline error:', err);
    throw new AdError('Error en el sistema de verificacion. Intenta de nuevo.', 500);
  }

  // 6. Resolve service and tradition IDs
  const serviceRecords = await prisma.service.findMany({
    where: { slug: { in: services } },
  });

  const traditionRecords = await prisma.tradition.findMany({
    where: { slug: { in: traditions } },
  });

  // 7. Create ad
  const now = new Date();
  const adId = randomUUID();
  const slug = generateAdSlug(title, adId);

  await prisma.ad.create({
    data: {
      id: adId,
      advertiserId,
      title,
      description,
      imageUrl: imageUrl ?? null,
      contentHash: hash,
      whatsappNumber,
      countryCode,
      websiteUrl: websiteUrl ?? null,
      professionalType,
      status: spamResult.passed ? 'ACTIVE' : 'REJECTED',
      publishedAt: spamResult.passed ? now : null,
      expiresAt: spamResult.passed ? expiresAt() : null,
      rejectionReason: spamResult.passed ? null : spamResult.reason,
      slug,
    },
  });

  // 8. Link services and traditions
  if (serviceRecords.length > 0) {
    await Promise.all(
      serviceRecords.map((s) =>
        prisma.adService.create({ data: { adId, serviceId: s.id } }),
      ),
    );
  }

  if (traditionRecords.length > 0) {
    await Promise.all(
      traditionRecords.map((t) =>
        prisma.adTradition.create({ data: { adId, traditionId: t.id } }),
      ),
    );
  }

  // 9. Fetch complete ad with relations
  return prisma.ad.findUniqueOrThrow({
    where: { id: adId },
    include: activeAdIncludes,
  });
}

// ── Update ──────────────────────────────────────────────────────────────────

export async function updateAd(adId: string, data: UpdateAdInput): Promise<Ad> {
  const {
    title, description, imageUrl, services, professionalType,
    traditions, advertiserId, whatsappNumber, countryCode, websiteUrl,
  } = data;

  // 1. Verify ad exists and belongs to this advertiser (include REJECTED for correction)
  const existing = await prisma.ad.findFirst({
    where: { id: adId, advertiserId, status: { in: ['ACTIVE', 'PENDING', 'REJECTED'] } },
  });

  if (!existing) {
    throw new AdError('Anuncio no encontrado o no te pertenece', 404);
  }

  // 2. If country changed, validate limits
  if (countryCode !== existing.countryCode) {
    await validateAdLimits(advertiserId, countryCode, adId);
  }

  // 3. Validate WhatsApp and website uniqueness
  if (whatsappNumber !== existing.whatsappNumber) {
    await validateWhatsAppUnique(whatsappNumber, advertiserId, adId);
  }
  if (websiteUrl !== (existing.websiteUrl ?? undefined)) {
    await validateWebsiteUnique(websiteUrl, advertiserId, adId);
  }

  // 4. Resolve service and tradition IDs
  const serviceRecords = await prisma.service.findMany({
    where: { slug: { in: services } },
  });

  const traditionRecords = await prisma.tradition.findMany({
    where: { slug: { in: traditions } },
  });

  // 4b. If correcting a REJECTED ad, re-run spam pipeline
  const wasRejected = existing.status === 'REJECTED';
  let newStatus = existing.status;
  let rejectionReason: string | null = existing.rejectionReason;

  if (wasRejected) {
    const spamResult = await runSpamPipeline({
      title,
      description,
      whatsappNumber,
      imageUrl,
      advertiserId,
    });
    newStatus = spamResult.passed ? 'ACTIVE' : 'REJECTED';
    rejectionReason = spamResult.passed ? null : (spamResult.reason ?? null);
  }

  // 5. Update ad fields
  const hash = contentHash(title, description, whatsappNumber);
  const now = new Date();

  await prisma.ad.update({
    where: { id: adId },
    data: {
      title,
      description,
      imageUrl: imageUrl ?? null,
      contentHash: hash,
      whatsappNumber,
      countryCode,
      websiteUrl: websiteUrl ?? null,
      professionalType,
      ...(wasRejected
        ? {
            status: newStatus,
            rejectionReason,
            publishedAt: newStatus === 'ACTIVE' ? now : null,
            expiresAt: newStatus === 'ACTIVE' ? expiresAt() : null,
          }
        : {}),
    },
  });

  // 6. Replace services
  await prisma.adService.deleteMany({ where: { adId } });
  if (serviceRecords.length > 0) {
    await Promise.all(
      serviceRecords.map((s) =>
        prisma.adService.create({ data: { adId, serviceId: s.id } }),
      ),
    );
  }

  // 7. Replace traditions
  await prisma.adTradition.deleteMany({ where: { adId } });
  if (traditionRecords.length > 0) {
    await Promise.all(
      traditionRecords.map((t) =>
        prisma.adTradition.create({ data: { adId, traditionId: t.id } }),
      ),
    );
  }

  // 8. Return updated ad with relations
  return prisma.ad.findUniqueOrThrow({
    where: { id: adId },
    include: activeAdIncludes,
  });
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
    ...(countryCode ? { countryCode } : {}),
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
    countryCode,
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
    countryCode,
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
    countryCode,
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
    where.countryCode = filters.countryCode;
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

  await prisma.ad.update({
    where: { id: ad.id },
    data: { lastBumpedAt: new Date() },
  });

  return prisma.ad.findUniqueOrThrow({
    where: { id: ad.id },
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

  // Validate ad limits (max 3 ads, 1 per country)
  await validateAdLimits(ad.advertiserId, ad.countryCode, ad.id);

  // Validate WhatsApp not taken by another advertiser
  await validateWhatsAppUnique(ad.whatsappNumber, ad.advertiserId, ad.id);

  // Validate website not taken by another advertiser
  await validateWebsiteUnique(ad.websiteUrl, ad.advertiserId, ad.id);

  await prisma.ad.update({
    where: { id: adId },
    data: {
      status: 'ACTIVE',
      expiresAt: expiresAt(),
      publishedAt: new Date(),
    },
  });

  return prisma.ad.findUniqueOrThrow({
    where: { id: adId },
    include: activeAdIncludes,
  });
}

// ── Advertiser's ads ────────────────────────────────────────────────────────

export async function getAdvertiserAds(advertiserId: string) {
  return prisma.ad.findMany({
    where: {
      advertiserId,
      status: { in: ['ACTIVE', 'PENDING', 'REJECTED'] },
    },
    include: activeAdIncludes,
    orderBy: { createdAt: 'desc' },
  });
}

// Keep single-ad getter for backward compat (e.g. bump route)
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
