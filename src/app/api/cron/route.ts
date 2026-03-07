import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import {
  processExpirationWarnings,
  processExpirations,
  processReputationRecalc,
  processCleanup,
  processGoogleReviewRequest,
  processOnboardingEmails,
  processBadgeVerification,
} from '@/lib/services/cron-service';

import type { ApiResponse } from '@/types';

const CRON_SECRET = process.env.CRON_SECRET;

const bodySchema = z.object({
  job: z.enum([
    'expirations',
    'warnings',
    'reputation',
    'cleanup',
    'review-request',
    'onboarding',
    'badge-verification',
  ]),
});

type CronJob = z.infer<typeof bodySchema>['job'];

const JOB_HANDLERS: Record<CronJob, () => Promise<Record<string, number>>> = {
  warnings: processExpirationWarnings,
  expirations: processExpirations,
  reputation: processReputationRecalc,
  cleanup: processCleanup,
  'review-request': processGoogleReviewRequest,
  onboarding: processOnboardingEmails,
  'badge-verification': processBadgeVerification,
};

/**
 * POST /api/cron
 *
 * Protected cron endpoint. Requires CRON_SECRET in Authorization header.
 * Body: { job: "expirations" | "warnings" | "reputation" | "cleanup" | "review-request" | "onboarding" }
 *
 * When called without a specific job (by Vercel Cron schedule), runs all jobs sequentially.
 */
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // Validate CRON_SECRET
    if (!CRON_SECRET) {
      console.error('[CRON] CRON_SECRET is not configured');
      return NextResponse.json(
        { error: 'Cron not configured' },
        { status: 500 },
      );
    }

    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    // Parse and validate body
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: `Invalid job. Must be one of: ${Object.keys(JOB_HANDLERS).join(', ')}` },
        { status: 400 },
      );
    }

    const { job } = parsed.data;
    const handler = JOB_HANDLERS[job];

    console.log(`[CRON] ${new Date().toISOString()} — Starting job: ${job}`);
    const startTime = Date.now();

    const result = await handler();

    const duration = Date.now() - startTime;
    console.log(`[CRON] ${new Date().toISOString()} — Job ${job} completed in ${duration}ms`);

    return NextResponse.json({
      data: { job, result, durationMs: duration },
    });
  } catch (err) {
    console.error('[CRON] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * GET /api/cron
 *
 * Vercel Cron triggers via GET. Runs all jobs sequentially.
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // Validate CRON_SECRET — Vercel Cron sends it as authorization header
    if (!CRON_SECRET) {
      console.error('[CRON] CRON_SECRET is not configured');
      return NextResponse.json(
        { error: 'Cron not configured' },
        { status: 500 },
      );
    }

    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    console.log(`[CRON] ${new Date().toISOString()} — Running all cron jobs`);
    const startTime = Date.now();

    const results: Record<string, Record<string, number>> = {};
    const jobs: CronJob[] = [
      'expirations',
      'warnings',
      'reputation',
      'cleanup',
      'review-request',
      'onboarding',
    ];

    for (const job of jobs) {
      try {
        results[job] = await JOB_HANDLERS[job]();
      } catch (err) {
        console.error(`[CRON] Job ${job} failed:`, err);
        results[job] = { error: 1 };
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[CRON] ${new Date().toISOString()} — All jobs completed in ${duration}ms`);

    return NextResponse.json({
      data: { results, durationMs: duration },
    });
  } catch (err) {
    console.error('[CRON] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
