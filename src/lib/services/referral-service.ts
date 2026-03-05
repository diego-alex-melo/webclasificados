import { prisma } from '@/lib/db/prisma';

// ── Config ──────────────────────────────────────────────────────────────────

const APP_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://brujosclassifieds.com';
const BOOST_DAYS = 3;

// ── Types ───────────────────────────────────────────────────────────────────

interface ReferralStats {
  code: string;
  referrals: number;
  bonusRepublications: number;
}

interface ReferredUser {
  email: string;
  createdAt: Date;
}

// ── Validate Referral Code ──────────────────────────────────────────────────

/**
 * Check if a referral code exists and belongs to an active advertiser.
 */
export async function validateReferralCode(
  code: string,
): Promise<{ valid: boolean; referrerEmail?: string }> {
  if (!code || code.length !== 8) {
    return { valid: false };
  }

  const referrer = await prisma.advertiser.findUnique({
    where: { referralCode: code },
    select: { email: true, emailVerified: true },
  });

  if (!referrer || !referrer.emailVerified) {
    return { valid: false };
  }

  // Mask email for privacy: b***@email.com
  const [localPart, domain] = referrer.email.split('@');
  const maskedEmail = `${localPart![0]}***@${domain}`;

  return { valid: true, referrerEmail: maskedEmail };
}

// ── Process Referral ────────────────────────────────────────────────────────

/**
 * Process a referral after a new advertiser registers.
 * - Sets referredById on the new advertiser
 * - Grants referrer 1 bonus republication (increments reputation by 5)
 * - Grants new advertiser a 3-day position boost (sets lastBumpedAt to now)
 */
export async function processReferral(
  newAdvertiserId: string,
  referralCode: string,
): Promise<void> {
  const referrer = await prisma.advertiser.findUnique({
    where: { referralCode: referralCode },
    select: { id: true },
  });

  if (!referrer) {
    console.warn(`[Referral] Invalid referral code: ${referralCode}`);
    return;
  }

  // Prevent self-referral
  if (referrer.id === newAdvertiserId) {
    console.warn(`[Referral] Self-referral attempt: ${newAdvertiserId}`);
    return;
  }

  // Set referredById on new advertiser
  await prisma.advertiser.update({
    where: { id: newAdvertiserId },
    data: { referredById: referrer.id },
  });

  // Grant referrer reputation bonus (serves as bonus republication indicator)
  // Each referral adds +5 reputation (capped at 200 by reputation service)
  await prisma.advertiser.update({
    where: { id: referrer.id },
    data: {
      reputation: { increment: 5 },
    },
  });

  // Grant new advertiser a position boost by setting lastBumpedAt
  // This effectively bumps their ad to the top for BOOST_DAYS
  const boostUntil = new Date();
  boostUntil.setDate(boostUntil.getDate() + BOOST_DAYS);

  // Update active ads of the new advertiser (if any exist at this point)
  await prisma.ad.updateMany({
    where: {
      advertiserId: newAdvertiserId,
      status: 'ACTIVE',
    },
    data: {
      lastBumpedAt: new Date(),
    },
  });
}

// ── Get Referral Stats ──────────────────────────────────────────────────────

/**
 * Get referral statistics for an advertiser.
 */
export async function getReferralStats(advertiserId: string): Promise<ReferralStats> {
  const advertiser = await prisma.advertiser.findUnique({
    where: { id: advertiserId },
    select: {
      referralCode: true,
      _count: {
        select: { referrals: true },
      },
    },
  });

  if (!advertiser) {
    throw new Error(`Advertiser ${advertiserId} not found`);
  }

  const referralCount = advertiser._count.referrals;

  return {
    code: advertiser.referralCode,
    referrals: referralCount,
    // Each referral grants 1 bonus republication
    bonusRepublications: referralCount,
  };
}

// ── Get Referred Users ──────────────────────────────────────────────────────

/**
 * Get list of users referred by this advertiser (emails masked).
 */
export async function getReferredUsers(advertiserId: string): Promise<ReferredUser[]> {
  const referrals = await prisma.advertiser.findMany({
    where: { referredById: advertiserId },
    select: {
      email: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return referrals.map((r) => {
    const [localPart, domain] = r.email.split('@');
    return {
      email: `${localPart![0]}***@${domain}`,
      createdAt: r.createdAt,
    };
  });
}

// ── Link Generators ─────────────────────────────────────────────────────────

/**
 * Generate a referral registration link.
 */
export function generateReferralLink(referralCode: string): string {
  return `${APP_URL}/registro?ref=${referralCode}`;
}

/**
 * Generate a WhatsApp share link with pre-filled referral message.
 */
export function generateWhatsAppShareLink(referralCode: string): string {
  const link = generateReferralLink(referralCode);
  const message = `Te invito a publicar tu servicio esotérico en WebClasificados. Regístrate con mi enlace: ${link}`;
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
