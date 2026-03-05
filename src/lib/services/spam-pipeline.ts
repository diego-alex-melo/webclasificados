import Redis from 'ioredis';

import { prisma } from '@/lib/db/prisma';
import { contentHash } from '@/lib/utils/content-hash';
import { validateText } from '@/lib/utils/text-validator';
import { textSimilarity } from '@/lib/utils/text-similarity';

export interface SpamCheckInput {
  title: string;
  description: string;
  whatsappNumber: string;
  imageUrl?: string;
  advertiserId: string;
  ip?: string;
}

export interface SpamCheckResult {
  passed: boolean;
  step: string;
  reason?: string;
}

const RATE_LIMIT_WINDOW = 300; // 5 minutes in seconds
const SIMILARITY_THRESHOLD = 0.8;

let redis: Redis | null = null;

function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
  }
  return redis;
}

// ── Step 1: Rate limit ──────────────────────────────────────────────────────

async function checkRateLimit(ip?: string, advertiserId?: string): Promise<SpamCheckResult> {
  const step = 'rate_limit';
  try {
    const r = getRedis();

    const keys: string[] = [];
    if (ip) keys.push(`ratelimit:ad:${ip}`);
    if (advertiserId) keys.push(`ratelimit:ad:${advertiserId}`);

    for (const key of keys) {
      const existing = await r.get(key);
      if (existing) {
        return {
          passed: false,
          step,
          reason: 'Debes esperar 5 minutos entre publicaciones',
        };
      }
    }

    // Set rate limit keys
    for (const key of keys) {
      await r.setex(key, RATE_LIMIT_WINDOW, '1');
    }

    return { passed: true, step };
  } catch {
    // If Redis is unavailable, allow the request (fail-open for rate limiting)
    return { passed: true, step };
  }
}

// ── Step 2: Text validation ─────────────────────────────────────────────────

function checkTextValidation(title: string, description: string): SpamCheckResult {
  const step = 'text_validation';
  const result = validateText(title, description);

  if (!result.valid) {
    return { passed: false, step, reason: result.reason };
  }

  return { passed: true, step };
}

// ── Step 3: Exact duplicate ─────────────────────────────────────────────────

async function checkExactDuplicate(
  title: string,
  description: string,
  whatsappNumber: string,
): Promise<SpamCheckResult> {
  const step = 'exact_duplicate';
  const hash = contentHash(title, description, whatsappNumber);

  const existing = await prisma.ad.findFirst({
    where: {
      contentHash: hash,
      status: { in: ['ACTIVE', 'PENDING'] },
    },
  });

  if (existing) {
    return {
      passed: false,
      step,
      reason: 'Ya existe un anuncio con el mismo contenido',
    };
  }

  return { passed: true, step };
}

// ── Step 4: Text similarity ─────────────────────────────────────────────────

async function checkTextSimilarity(
  title: string,
  description: string,
  whatsappNumber: string,
): Promise<SpamCheckResult> {
  const step = 'text_similarity';

  const existingAds = await prisma.ad.findMany({
    where: {
      advertiser: { whatsappNumber },
      status: { in: ['ACTIVE', 'PENDING'] },
    },
    select: { title: true, description: true },
  });

  for (const ad of existingAds) {
    const titleSim = textSimilarity(title, ad.title);
    const descSim = textSimilarity(description, ad.description);
    const avgSim = (titleSim + descSim) / 2;

    if (avgSim > SIMILARITY_THRESHOLD) {
      return {
        passed: false,
        step,
        reason: 'El anuncio es muy similar a uno existente',
      };
    }
  }

  return { passed: true, step };
}

// ── Step 5: OCR check ───────────────────────────────────────────────────────

async function checkOcr(_imageUrl?: string): Promise<SpamCheckResult> {
  const step = 'ocr_check';

  // TODO: Integrate Google Cloud Vision API
  // 1. Send image to Vision API for text detection
  // 2. Check extracted text for phone numbers and URLs
  // 3. Block if detected
  return { passed: true, step };
}

// ── Step 6: AI moderation ───────────────────────────────────────────────────

async function checkAiModeration(
  _title: string,
  _description: string,
): Promise<SpamCheckResult> {
  const step = 'ai_moderation';

  // TODO: Integrate OpenAI moderation API
  // 1. Send title + description to OpenAI for content analysis
  // 2. Check for spam, scams, prohibited content
  // 3. Block if flagged
  return { passed: true, step };
}

// ── Step 7: Reputation check ────────────────────────────────────────────────

async function checkReputation(advertiserId: string): Promise<SpamCheckResult> {
  const step = 'reputation_check';

  const advertiser = await prisma.advertiser.findUnique({
    where: { id: advertiserId },
    select: { reputation: true },
  });

  if (!advertiser) {
    return {
      passed: false,
      step,
      reason: 'Anunciante no encontrado',
    };
  }

  if (advertiser.reputation < 20) {
    return {
      passed: false,
      step,
      reason: 'Tu cuenta ha sido bloqueada por baja reputación',
    };
  }

  if (advertiser.reputation < 50) {
    return {
      passed: false,
      step,
      reason: 'Tu anuncio requiere revisión manual debido a tu reputación',
    };
  }

  return { passed: true, step };
}

// ── Pipeline orchestrator ───────────────────────────────────────────────────

export async function runSpamPipeline(input: SpamCheckInput): Promise<SpamCheckResult> {
  const { title, description, whatsappNumber, imageUrl, advertiserId, ip } = input;

  // Step 1: Rate limit
  const rateResult = await checkRateLimit(ip, advertiserId);
  if (!rateResult.passed) return rateResult;

  // Step 2: Text validation
  const textResult = checkTextValidation(title, description);
  if (!textResult.passed) return textResult;

  // Step 3: Exact duplicate
  const dupResult = await checkExactDuplicate(title, description, whatsappNumber);
  if (!dupResult.passed) return dupResult;

  // Step 4: Text similarity
  const simResult = await checkTextSimilarity(title, description, whatsappNumber);
  if (!simResult.passed) return simResult;

  // Step 5: OCR check
  const ocrResult = await checkOcr(imageUrl);
  if (!ocrResult.passed) return ocrResult;

  // Step 6: AI moderation
  const aiResult = await checkAiModeration(title, description);
  if (!aiResult.passed) return aiResult;

  // Step 7: Reputation check
  const repResult = await checkReputation(advertiserId);
  if (!repResult.passed) return repResult;

  return { passed: true, step: 'all' };
}
