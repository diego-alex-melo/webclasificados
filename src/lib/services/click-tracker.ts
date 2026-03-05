import { createHash } from 'crypto';

import { prisma } from '@/lib/db/prisma';

import type { ClickType } from '@/generated/prisma';

// ── Types ───────────────────────────────────────────────────────────────────

interface AdMetrics {
  views: number;
  whatsappClicks: number;
  websiteClicks: number;
  weeklyData: WeeklyDataPoint[];
}

interface WeeklyDataPoint {
  date: string;
  views: number;
  whatsapp: number;
  website: number;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex');
}

function extractIp(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]!.trim();
  return headers.get('x-real-ip');
}

// ── Track Click ─────────────────────────────────────────────────────────────

/**
 * Record a click event for an ad. Designed for fire-and-forget usage:
 * call without await in redirect flows so tracking never blocks the user.
 */
export async function trackClick(
  adId: string,
  type: ClickType,
  headers: Headers,
): Promise<void> {
  const ip = extractIp(headers);

  await prisma.clickEvent.create({
    data: {
      adId,
      type,
      referrer: headers.get('referer') ?? null,
      userAgent: headers.get('user-agent') ?? null,
      ipHash: ip ? hashIp(ip) : null,
    },
  });
}

// ── Get Ad Metrics ──────────────────────────────────────────────────────────

/**
 * Aggregate click metrics for a single ad.
 * Returns total counts by type and a weekly breakdown for the last 8 weeks.
 */
export async function getAdMetrics(adId: string): Promise<AdMetrics> {
  // Total counts by type
  const counts = await prisma.clickEvent.groupBy({
    by: ['type'],
    where: { adId },
    _count: { id: true },
  });

  const countMap: Record<string, number> = {};
  for (const row of counts) {
    countMap[row.type] = row._count.id;
  }

  // Weekly breakdown — last 8 weeks
  const eightWeeksAgo = new Date();
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56);

  const events = await prisma.clickEvent.findMany({
    where: {
      adId,
      createdAt: { gte: eightWeeksAgo },
    },
    select: {
      type: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Group events by ISO week start (Monday)
  const weekBuckets = new Map<string, { views: number; whatsapp: number; website: number }>();

  // Pre-fill 8 week buckets
  for (let i = 7; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i * 7);
    const weekStart = getWeekStart(d);
    const key = weekStart.toISOString().slice(0, 10);
    if (!weekBuckets.has(key)) {
      weekBuckets.set(key, { views: 0, whatsapp: 0, website: 0 });
    }
  }

  for (const event of events) {
    const weekStart = getWeekStart(event.createdAt);
    const key = weekStart.toISOString().slice(0, 10);
    let bucket = weekBuckets.get(key);
    if (!bucket) {
      bucket = { views: 0, whatsapp: 0, website: 0 };
      weekBuckets.set(key, bucket);
    }
    if (event.type === 'VIEW') bucket.views++;
    else if (event.type === 'WHATSAPP') bucket.whatsapp++;
    else if (event.type === 'WEBSITE') bucket.website++;
  }

  const weeklyData: WeeklyDataPoint[] = Array.from(weekBuckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }));

  return {
    views: countMap['VIEW'] ?? 0,
    whatsappClicks: countMap['WHATSAPP'] ?? 0,
    websiteClicks: countMap['WEBSITE'] ?? 0,
    weeklyData,
  };
}

// ── Get Ad Position ─────────────────────────────────────────────────────────

/**
 * Calculate the 1-based position of an ad within its service category,
 * ordered by lastBumpedAt then publishedAt (same order as the listing page).
 */
export async function getAdPosition(
  adId: string,
  serviceSlug: string,
  countryCode: string,
): Promise<number> {
  const ads = await prisma.ad.findMany({
    where: {
      status: 'ACTIVE',
      advertiser: { countryCode },
      services: { some: { service: { slug: serviceSlug } } },
    },
    select: { id: true },
    orderBy: [
      { lastBumpedAt: 'desc' },
      { publishedAt: 'desc' },
    ],
  });

  const index = ads.findIndex((a) => a.id === adId);
  return index === -1 ? 0 : index + 1;
}

// ── Week helper ─────────────────────────────────────────────────────────────

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  // Monday = 1, Sunday = 0 → shift so Monday is start
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
