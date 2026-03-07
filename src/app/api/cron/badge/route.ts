import { NextRequest, NextResponse } from 'next/server';

import { processBadgeVerification } from '@/lib/services/cron-service';

import type { ApiResponse } from '@/types';

const CRON_SECRET = process.env.CRON_SECRET;

/**
 * GET /api/cron/badge
 *
 * Biweekly cron (1st and 15th of each month) to verify badge presence
 * on advertiser websites. Updates badgeVerified and reputation.
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    if (!CRON_SECRET) {
      console.error('[CRON:badge] CRON_SECRET is not configured');
      return NextResponse.json({ error: 'Cron not configured' }, { status: 500 });
    }

    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log(`[CRON:badge] ${new Date().toISOString()} — Starting badge verification`);
    const startTime = Date.now();

    const result = await processBadgeVerification();

    const duration = Date.now() - startTime;
    console.log(`[CRON:badge] ${new Date().toISOString()} — Completed in ${duration}ms`);

    return NextResponse.json({
      data: { job: 'badge-verification', result, durationMs: duration },
    });
  } catch (err) {
    console.error('[CRON:badge] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
