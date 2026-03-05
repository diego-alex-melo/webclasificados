import { NextRequest, NextResponse } from 'next/server';

import { getAdvertiserFromToken, AuthError } from '@/lib/services/auth-service';
import {
  getReferralStats,
  getReferredUsers,
  generateReferralLink,
  generateWhatsAppShareLink,
} from '@/lib/services/referral-service';
import type { ApiResponse } from '@/types';

/**
 * GET /api/referrals
 * Returns referral stats, links, and referred users for the authenticated advertiser.
 */
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autenticación requerido' },
        { status: 401 },
      );
    }

    const token = authHeader.slice(7);
    const advertiser = await getAdvertiserFromToken(token);

    const [stats, referredUsers] = await Promise.all([
      getReferralStats(advertiser.id),
      getReferredUsers(advertiser.id),
    ]);

    return NextResponse.json({
      data: {
        code: stats.code,
        referralLink: generateReferralLink(stats.code),
        whatsappShareLink: generateWhatsAppShareLink(stats.code),
        referrals: stats.referrals,
        bonusRepublications: stats.bonusRepublications,
        referredUsers,
      },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    console.error('GET /api/referrals error:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
