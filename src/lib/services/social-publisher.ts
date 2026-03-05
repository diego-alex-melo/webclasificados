import { prisma } from '@/lib/db/prisma';

import type { SocialPlatform } from '@/generated/prisma';

// ── Types ───────────────────────────────────────────────────────────────────

interface AdWithRelations {
  id: string;
  title: string;
  description: string;
  slug: string;
  imageUrl: string | null;
  professionalType: string;
  advertiser: {
    countryCode: string;
  };
  services: Array<{ service: { name: string; slug: string } }>;
}

interface SocialPostResult {
  id: string;
  platform: SocialPlatform;
  externalPostId: string | null;
  postedAt: Date;
}

// ── Config ──────────────────────────────────────────────────────────────────

const APP_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://brujosclassifieds.com';

const PLATFORM_CONFIGS: Record<SocialPlatform, boolean> = {
  FACEBOOK: !!process.env.FACEBOOK_PAGE_ID,
  INSTAGRAM: !!process.env.INSTAGRAM_USER_ID,
  TWITTER: !!process.env.TWITTER_API_KEY,
  PINTEREST: !!process.env.PINTEREST_ACCESS_TOKEN,
  GOOGLE_BUSINESS: !!process.env.GOOGLE_BUSINESS_ACCOUNT_ID,
};

// ── Hashtag Generator ───────────────────────────────────────────────────────

export function generateHashtags(ad: AdWithRelations): string[] {
  const tags = new Set<string>();

  tags.add('#esoterico');
  tags.add('#BrujosClassifieds');

  // Professional type tag
  const typeTag = ad.professionalType
    .toLowerCase()
    .replace(/[^a-záéíóúñü]/g, '')
    .replace(/\//g, '');
  if (typeTag) tags.add(`#${typeTag}`);

  // Service tags
  for (const s of ad.services) {
    const serviceTag = s.service.name
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-záéíóúñü]/g, '');
    if (serviceTag) tags.add(`#${serviceTag}`);
  }

  // Country tag
  const countryMap: Record<string, string> = {
    CO: 'colombia',
    MX: 'mexico',
    US: 'estadosunidos',
    ES: 'españa',
    PE: 'peru',
    CL: 'chile',
    AR: 'argentina',
    EC: 'ecuador',
    VE: 'venezuela',
    PA: 'panama',
    CR: 'costarica',
    GT: 'guatemala',
    SV: 'elsalvador',
    HN: 'honduras',
    NI: 'nicaragua',
    BO: 'bolivia',
    PY: 'paraguay',
    UY: 'uruguay',
    DO: 'republicadominicana',
  };

  const countryTag = countryMap[ad.advertiser.countryCode];
  if (countryTag) tags.add(`#${countryTag}`);

  return Array.from(tags);
}

// ── Caption Generator ───────────────────────────────────────────────────────

function generateCaption(ad: AdWithRelations): string {
  const countryMap: Record<string, string> = {
    CO: 'Colombia',
    MX: 'México',
    US: 'Estados Unidos',
    ES: 'España',
    PE: 'Perú',
    CL: 'Chile',
    AR: 'Argentina',
    EC: 'Ecuador',
    VE: 'Venezuela',
    PA: 'Panamá',
  };

  const country = countryMap[ad.advertiser.countryCode] ?? ad.advertiser.countryCode;
  const adUrl = `${APP_URL}/anuncio/${ad.slug}`;
  const hashtags = generateHashtags(ad).join(' ');

  return `${ad.title} — ${ad.professionalType} en ${country}. Más info: ${adUrl} ${hashtags}`;
}

// ── Platform Publishers ─────────────────────────────────────────────────────

async function publishToFacebook(ad: AdWithRelations): Promise<string | null> {
  // TODO: Implement Facebook Graph API v18.0
  // POST /{page_id}/feed with message, link, picture
  // const pageId = process.env.FACEBOOK_PAGE_ID;
  // const accessToken = process.env.FACEBOOK_ACCESS_TOKEN;
  // const caption = generateCaption(ad);
  // const adUrl = `${APP_URL}/anuncio/${ad.slug}`;
  // const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}/feed`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     message: caption,
  //     link: adUrl,
  //     picture: ad.imageUrl,
  //     access_token: accessToken,
  //   }),
  // });
  // const data = await response.json();
  // return data.id;

  console.log('[SocialPublisher] Facebook publish stubbed for ad:', ad.id);
  return null;
}

async function publishToInstagram(ad: AdWithRelations): Promise<string | null> {
  // TODO: Implement Instagram Graph API
  // Step 1: POST /{ig_user_id}/media with image_url, caption
  // Step 2: POST /{ig_user_id}/media_publish with creation_id
  // const igUserId = process.env.INSTAGRAM_USER_ID;
  // const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  // const caption = generateCaption(ad);

  console.log('[SocialPublisher] Instagram publish stubbed for ad:', ad.id);
  return null;
}

async function publishToTwitter(ad: AdWithRelations): Promise<string | null> {
  // TODO: Implement Twitter API v2
  // POST /2/tweets with text and media
  // const apiKey = process.env.TWITTER_API_KEY;
  // const caption = generateCaption(ad);

  console.log('[SocialPublisher] Twitter publish stubbed for ad:', ad.id);
  return null;
}

async function publishToPinterest(ad: AdWithRelations): Promise<string | null> {
  // TODO: Implement Pinterest API v5
  // POST /pins with title, description, link, media_source
  // const accessToken = process.env.PINTEREST_ACCESS_TOKEN;
  // const adUrl = `${APP_URL}/anuncio/${ad.slug}`;

  console.log('[SocialPublisher] Pinterest publish stubbed for ad:', ad.id);
  return null;
}

async function publishToGoogleBusiness(ad: AdWithRelations): Promise<string | null> {
  // TODO: Implement Google Business Profile API
  // POST /accounts/{account_id}/locations/{location_id}/localPosts
  // const accountId = process.env.GOOGLE_BUSINESS_ACCOUNT_ID;
  // const locationId = process.env.GOOGLE_BUSINESS_LOCATION_ID;

  console.log('[SocialPublisher] Google Business publish stubbed for ad:', ad.id);
  return null;
}

// ── Platform dispatch map ───────────────────────────────────────────────────

const PUBLISHERS: Record<SocialPlatform, (ad: AdWithRelations) => Promise<string | null>> = {
  FACEBOOK: publishToFacebook,
  INSTAGRAM: publishToInstagram,
  TWITTER: publishToTwitter,
  PINTEREST: publishToPinterest,
  GOOGLE_BUSINESS: publishToGoogleBusiness,
};

// ── Main Publisher ──────────────────────────────────────────────────────────

/**
 * Publish an ad to all configured social media platforms.
 * Creates SocialPost records in the database for each successful publish.
 * Errors are caught silently per platform — never fails the ad creation flow.
 */
export async function publishToSocial(ad: AdWithRelations): Promise<SocialPostResult[]> {
  const results: SocialPostResult[] = [];
  const platforms = Object.entries(PLATFORM_CONFIGS) as [SocialPlatform, boolean][];

  const publishPromises = platforms.map(async ([platform, enabled]) => {
    if (!enabled) return null;

    try {
      const publisher = PUBLISHERS[platform];
      const externalPostId = await publisher(ad);

      const socialPost = await prisma.socialPost.create({
        data: {
          adId: ad.id,
          platform,
          externalPostId,
          postedAt: new Date(),
        },
      });

      return socialPost;
    } catch (err) {
      console.error(`[SocialPublisher] Failed to publish to ${platform}:`, err);
      return null;
    }
  });

  const settled = await Promise.allSettled(publishPromises);

  for (const result of settled) {
    if (result.status === 'fulfilled' && result.value) {
      results.push(result.value);
    }
  }

  return results;
}
