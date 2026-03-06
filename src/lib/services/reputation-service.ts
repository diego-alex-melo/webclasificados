import { prisma } from '@/lib/db/prisma';

const BASE_REPUTATION = 100;
const MIN_REPUTATION = 0;
const MAX_REPUTATION = 200;

const BONUS_BADGE_VERIFIED = 30;
const BONUS_REFERRAL = 10;
const BONUS_RENEWAL = 10;
const BONUS_FIRST_BUMP = 5;
const PENALTY_REJECTION = -30;

/**
 * Calculate the reputation score for an advertiser based on multiple factors.
 *
 * Points reward actions that are HARD to achieve or BENEFIT our SEO/visibility:
 * - Base: 100
 * - Badge/seal verified on advertiser's website: +30
 * - Referred a friend (who registered): +10 per referral
 * - Renewed ad before expiry: +10 per renewal
 * - First bump (republish): +5
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
          renewedAt: true,
          bumpCount: true,
        },
      },
      _count: {
        select: { referrals: true },
      },
    },
  });

  if (!advertiser) {
    throw new Error(`Advertiser ${advertiserId} not found`);
  }

  let score = BASE_REPUTATION;

  // Badge verified on advertiser's website (+30)
  if (advertiser.badgeVerified) {
    score += BONUS_BADGE_VERIFIED;
  }

  // Referrals (+10 per referred friend)
  score += advertiser._count.referrals * BONUS_REFERRAL;

  // Renewals (+10 per ad renewed before expiry)
  const renewedAds = advertiser.ads.filter((ad) => ad.renewedAt !== null).length;
  score += renewedAds * BONUS_RENEWAL;

  // First bump ever (+5, one-time)
  const hasBumped = advertiser.ads.some((ad) => ad.bumpCount > 0);
  if (hasBumped) {
    score += BONUS_FIRST_BUMP;
  }

  // Rejected ads penalty (-30 per rejection)
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
