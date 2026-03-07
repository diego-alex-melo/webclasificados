import { randomBytes } from 'crypto';

import { prisma } from '@/lib/db/prisma';
import { updateReputation } from '@/lib/services/reputation-service';
import {
  sendExpirationWarning,
  sendExpiredNotice,
  sendOnboardingTips,
  sendMetricsReminder,
  sendGoogleReviewRequest,
} from '@/lib/services/email-service';

// ── Helpers ─────────────────────────────────────────────────────────────────

function daysFromNow(days: number): { gte: Date; lt: Date } {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() + days);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { gte: start, lt: end };
}

function daysAgo(days: number): { gte: Date; lt: Date } {
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { gte: start, lt: end };
}

function logCron(job: string, message: string) {
  console.log(`[CRON:${job}] ${new Date().toISOString()} — ${message}`);
}

// ── Expiration Warnings ─────────────────────────────────────────────────────

/**
 * Find ACTIVE ads expiring in 6 days (day 54 of 60-day lifecycle).
 * Send a warning email with ad metrics to each advertiser.
 */
export async function processExpirationWarnings(): Promise<{ warned: number }> {
  const expiryWindow = daysFromNow(6);

  const ads = await prisma.ad.findMany({
    where: {
      status: 'ACTIVE',
      expiresAt: expiryWindow,
    },
    include: {
      advertiser: { select: { email: true } },
      clickEvents: { select: { type: true } },
    },
  });

  logCron('warnings', `Found ${ads.length} ads expiring in 6 days`);

  let warned = 0;

  for (const ad of ads) {
    try {
      const views = ad.clickEvents.filter((e) => e.type === 'VIEW').length;
      const clicks = ad.clickEvents.filter((e) => e.type === 'WHATSAPP').length;

      await sendExpirationWarning(ad.advertiser.email, ad.title, 6, {
        views,
        clicks,
      });

      warned++;
      logCron('warnings', `Warned: "${ad.title}" → ${ad.advertiser.email}`);
    } catch (err) {
      logCron('warnings', `Error warning ad ${ad.id}: ${err}`);
    }
  }

  logCron('warnings', `Complete: ${warned}/${ads.length} warned`);
  return { warned };
}

// ── Expirations ─────────────────────────────────────────────────────────────

/**
 * Find ACTIVE ads where expiresAt <= now.
 * Set status to EXPIRED, generate reactivation token, send notice email.
 */
export async function processExpirations(): Promise<{ expired: number }> {
  const now = new Date();

  const ads = await prisma.ad.findMany({
    where: {
      status: 'ACTIVE',
      expiresAt: { lte: now },
    },
    include: {
      advertiser: { select: { email: true } },
    },
  });

  logCron('expirations', `Found ${ads.length} ads to expire`);

  let expired = 0;

  for (const ad of ads) {
    try {
      const reactivationToken = randomBytes(32).toString('hex');

      await prisma.ad.update({
        where: { id: ad.id },
        data: {
          status: 'EXPIRED',
          reactivationToken,
        },
      });

      await sendExpiredNotice(ad.advertiser.email, ad.title, reactivationToken);

      expired++;
      logCron('expirations', `Expired: "${ad.title}" → ${ad.advertiser.email}`);
    } catch (err) {
      logCron('expirations', `Error expiring ad ${ad.id}: ${err}`);
    }
  }

  logCron('expirations', `Complete: ${expired}/${ads.length} expired`);
  return { expired };
}

// ── Reputation Recalculation ────────────────────────────────────────────────

/**
 * Recalculate reputation for all advertisers.
 */
export async function processReputationRecalc(): Promise<{ updated: number }> {
  const advertisers = await prisma.advertiser.findMany({
    select: { id: true },
  });

  logCron('reputation', `Recalculating for ${advertisers.length} advertisers`);

  let updated = 0;

  for (const advertiser of advertisers) {
    try {
      await updateReputation(advertiser.id);
      updated++;
    } catch (err) {
      logCron('reputation', `Error updating ${advertiser.id}: ${err}`);
    }
  }

  logCron('reputation', `Complete: ${updated}/${advertisers.length} updated`);
  return { updated };
}

// ── Cleanup ─────────────────────────────────────────────────────────────────

/**
 * Delete EXPIRED ads older than 90 days and orphaned click events.
 */
export async function processCleanup(): Promise<{ deleted: number }> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);

  // Delete expired ads older than 90 days (cascades to click events, services, traditions)
  const result = await prisma.ad.deleteMany({
    where: {
      status: 'EXPIRED',
      expiresAt: { lte: cutoff },
    },
  });

  logCron('cleanup', `Deleted ${result.count} expired ads older than 90 days`);

  // Note: ClickEvent has onDelete: Cascade, so related events are deleted with the ad.
  // No orphaned click events should exist, but log the result for visibility.

  logCron('cleanup', `Complete: ${result.count} expired ads deleted (with cascaded relations)`);
  return { deleted: result.count };
}

// ── Google Review Request ───────────────────────────────────────────────────

/**
 * Find advertisers whose first ad was published exactly 7 days ago.
 * Send Google Business review request email.
 */
export async function processGoogleReviewRequest(): Promise<{ sent: number }> {
  const publishedWindow = daysAgo(7);

  // Find advertisers with their first-ever ad published exactly 7 days ago
  const advertisers = await prisma.advertiser.findMany({
    where: {
      ads: {
        some: {
          publishedAt: publishedWindow,
        },
      },
    },
    include: {
      ads: {
        select: { publishedAt: true },
        orderBy: { publishedAt: 'asc' },
        take: 1,
      },
    },
  });

  // Filter to only those whose FIRST ad was published 7 days ago
  const eligible = advertisers.filter((a) => {
    const firstAd = a.ads[0];
    if (!firstAd?.publishedAt) return false;
    const pub = firstAd.publishedAt;
    return pub >= publishedWindow.gte && pub < publishedWindow.lt;
  });

  logCron('review-request', `Found ${eligible.length} eligible advertisers`);

  let sent = 0;

  for (const advertiser of eligible) {
    try {
      await sendGoogleReviewRequest(advertiser.email);
      sent++;
      logCron('review-request', `Sent review request to ${advertiser.email}`);
    } catch (err) {
      logCron('review-request', `Error sending to ${advertiser.email}: ${err}`);
    }
  }

  logCron('review-request', `Complete: ${sent}/${eligible.length} sent`);
  return { sent };
}

// ── Onboarding Emails ───────────────────────────────────────────────────────

/**
 * Send onboarding sequence emails based on when the advertiser's first ad was published:
 * - Day 1: Tips email "Cómo mejorar tu anuncio"
 * - Day 3: "¿Ya revisaste tus métricas?" email
 * (Day 0 welcome is handled by auth flow; Day 7 review request is handled above)
 */
export async function processOnboardingEmails(): Promise<{ sent: number }> {
  let sent = 0;

  // Day 1: Tips email
  const day1Window = daysAgo(1);
  const day1Ads = await prisma.ad.findMany({
    where: {
      status: 'ACTIVE',
      publishedAt: day1Window,
    },
    include: {
      advertiser: { select: { email: true } },
    },
  });

  // Deduplicate: only first ads per advertiser (check if advertiser has older ads)
  for (const ad of day1Ads) {
    try {
      const olderAds = await prisma.ad.count({
        where: {
          advertiserId: ad.advertiserId,
          publishedAt: { lt: day1Window.gte },
        },
      });

      // Only send if this is their first ad
      if (olderAds === 0) {
        await sendOnboardingTips(ad.advertiser.email, ad.title);
        sent++;
        logCron('onboarding', `Day 1 tips sent to ${ad.advertiser.email}`);
      }
    } catch (err) {
      logCron('onboarding', `Error sending Day 1 tips for ad ${ad.id}: ${err}`);
    }
  }

  // Day 3: Metrics reminder
  const day3Window = daysAgo(3);
  const day3Ads = await prisma.ad.findMany({
    where: {
      status: 'ACTIVE',
      publishedAt: day3Window,
    },
    include: {
      advertiser: { select: { email: true } },
      clickEvents: { select: { type: true } },
    },
  });

  for (const ad of day3Ads) {
    try {
      const olderAds = await prisma.ad.count({
        where: {
          advertiserId: ad.advertiserId,
          publishedAt: { lt: day3Window.gte },
        },
      });

      if (olderAds === 0) {
        const views = ad.clickEvents.filter((e) => e.type === 'VIEW').length;
        const clicks = ad.clickEvents.filter((e) => e.type === 'WHATSAPP').length;

        await sendMetricsReminder(ad.advertiser.email, ad.title, { views, clicks });
        sent++;
        logCron('onboarding', `Day 3 metrics sent to ${ad.advertiser.email}`);
      }
    } catch (err) {
      logCron('onboarding', `Error sending Day 3 metrics for ad ${ad.id}: ${err}`);
    }
  }

  logCron('onboarding', `Complete: ${sent} onboarding emails sent`);
  return { sent };
}

// ── Badge Verification ────────────────────────────────────────────────────

const BADGE_FETCH_TIMEOUT = 8000;
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://brujosclassifieds.com';

/**
 * Verify badge presence on advertiser websites (runs biweekly).
 * Fetches each advertiser's websiteUrl and checks for a link to brujosclassifieds.com
 * containing the badge image. Updates badgeVerified and recalculates reputation.
 */
export async function processBadgeVerification(): Promise<{ verified: number; revoked: number; skipped: number }> {
  const advertisers = await prisma.advertiser.findMany({
    where: {
      websiteUrl: { not: null },
      ads: { some: { status: 'ACTIVE' } },
    },
    select: {
      id: true,
      websiteUrl: true,
      badgeVerified: true,
      ads: {
        where: { status: 'ACTIVE' },
        select: { slug: true },
      },
    },
  });

  logCron('badge', `Checking ${advertisers.length} advertisers with websites`);

  let verified = 0;
  let revoked = 0;
  let skipped = 0;

  for (const advertiser of advertisers) {
    if (!advertiser.websiteUrl) {
      skipped++;
      continue;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), BADGE_FETCH_TIMEOUT);

      const res = await fetch(advertiser.websiteUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'BrujosClassifieds-BadgeBot/1.0' },
      });
      clearTimeout(timeout);

      if (!res.ok) {
        logCron('badge', `HTTP ${res.status} for ${advertiser.websiteUrl} — skipping`);
        skipped++;
        continue;
      }

      const html = await res.text();

      // Check if the page contains a link to any of their ad slugs with badge.svg
      const adSlugs = advertiser.ads.map((a) => a.slug);
      const hasBadge = adSlugs.some((slug) => {
        const adUrl = `${BASE_URL}/anuncio/${slug}`;
        return html.includes(adUrl) && html.includes(`${BASE_URL}/badge.svg`);
      });

      if (hasBadge && !advertiser.badgeVerified) {
        await prisma.advertiser.update({
          where: { id: advertiser.id },
          data: { badgeVerified: true },
        });
        await updateReputation(advertiser.id);
        verified++;
        logCron('badge', `Verified: ${advertiser.websiteUrl}`);
      } else if (!hasBadge && advertiser.badgeVerified) {
        await prisma.advertiser.update({
          where: { id: advertiser.id },
          data: { badgeVerified: false },
        });
        await updateReputation(advertiser.id);
        revoked++;
        logCron('badge', `Revoked: ${advertiser.websiteUrl}`);
      }
    } catch (err) {
      // Fetch failed (timeout, DNS, etc.) — don't change badge status
      logCron('badge', `Fetch error for ${advertiser.websiteUrl}: ${err}`);
      skipped++;
    }
  }

  logCron('badge', `Complete: ${verified} verified, ${revoked} revoked, ${skipped} skipped`);
  return { verified, revoked, skipped };
}
