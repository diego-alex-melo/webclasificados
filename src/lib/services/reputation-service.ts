import { prisma } from '@/lib/db/prisma';

const BASE_REPUTATION = 100;
const MIN_REPUTATION = 0;
const MAX_REPUTATION = 200;

const BONUS_CLICKS_THRESHOLD = 10;
const BONUS_CLICKS = 20;
const BONUS_AGE_30_DAYS = 10;
const BONUS_AGE_90_DAYS = 20;
const BONUS_WEBSITE = 10;
const PENALTY_REJECTION = -30;

/**
 * Calculate the reputation score for an advertiser based on multiple factors.
 *
 * Factors:
 * - Base: 100
 * - Active ad with >10 WhatsApp clicks: +20
 * - Account age >30 days: +10
 * - Account age >90 days: +20 (stacks with 30-day bonus)
 * - Has website URL: +10
 * - Rejected ads: -30 per rejection
 *
 * Range: [0, 200]
 */
export async function calculateReputation(advertiserId: string): Promise<number> {
  const advertiser = await prisma.advertiser.findUnique({
    where: { id: advertiserId },
    include: {
      ads: {
        select: {
          id: true,
          status: true,
          clickEvents: {
            where: { type: 'WHATSAPP' },
            select: { id: true },
          },
        },
      },
    },
  });

  if (!advertiser) {
    throw new Error(`Advertiser ${advertiserId} not found`);
  }

  let score = BASE_REPUTATION;

  // Active ad with >10 WhatsApp clicks
  const hasPopularAd = advertiser.ads.some(
    (ad) => ad.status === 'ACTIVE' && ad.clickEvents.length > BONUS_CLICKS_THRESHOLD,
  );
  if (hasPopularAd) {
    score += BONUS_CLICKS;
  }

  // Account age bonuses
  const now = new Date();
  const accountAgeDays = (now.getTime() - advertiser.createdAt.getTime()) / (1000 * 60 * 60 * 24);

  if (accountAgeDays > 90) {
    score += BONUS_AGE_90_DAYS;
  }
  if (accountAgeDays > 30) {
    score += BONUS_AGE_30_DAYS;
  }

  // Has website URL
  if (advertiser.websiteUrl) {
    score += BONUS_WEBSITE;
  }

  // Rejected ads penalty
  const rejectedCount = advertiser.ads.filter((ad) => ad.status === 'REJECTED').length;
  score += rejectedCount * PENALTY_REJECTION;

  return Math.max(MIN_REPUTATION, Math.min(MAX_REPUTATION, score));
}

/**
 * Recalculate and persist the reputation score for an advertiser.
 */
export async function updateReputation(advertiserId: string): Promise<number> {
  const reputation = await calculateReputation(advertiserId);

  await prisma.advertiser.update({
    where: { id: advertiserId },
    data: { reputation },
  });

  return reputation;
}
