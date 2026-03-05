import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/lib/db/prisma';
import { requireAdmin } from '@/lib/utils/admin-auth';
import { AuthError } from '@/lib/services/auth-service';

import type { ApiResponse } from '@/types';

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    await requireAdmin(request);

    const now = new Date();

    // Start of current week (Monday)
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    weekStart.setHours(0, 0, 0, 0);

    // Start of current month
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Run all queries in parallel
    const [
      totalActiveAds,
      totalUsers,
      clicksThisWeek,
      clicksThisMonth,
      newRegistrationsThisWeek,
      adsByStatus,
      adsByCountry,
      topAdsByWhatsApp,
    ] = await Promise.all([
      // Total active ads
      prisma.ad.count({ where: { status: 'ACTIVE' } }),

      // Total registered users
      prisma.advertiser.count(),

      // Total clicks this week (WhatsApp + Website only)
      prisma.clickEvent.count({
        where: {
          createdAt: { gte: weekStart },
          type: { in: ['WHATSAPP', 'WEBSITE'] },
        },
      }),

      // Total clicks this month
      prisma.clickEvent.count({
        where: {
          createdAt: { gte: monthStart },
          type: { in: ['WHATSAPP', 'WEBSITE'] },
        },
      }),

      // New registrations this week
      prisma.advertiser.count({
        where: { createdAt: { gte: weekStart } },
      }),

      // Ads grouped by status
      prisma.ad.groupBy({
        by: ['status'],
        _count: { id: true },
      }),

      // Ads grouped by advertiser country
      prisma.$queryRaw<Array<{ countryCode: string; count: bigint }>>`
        SELECT a."countryCode" AS "countryCode", COUNT(ad.id)::bigint AS count
        FROM advertisers a
        JOIN ads ad ON ad."advertiserId" = a.id
        WHERE ad.status = 'ACTIVE'
        GROUP BY a."countryCode"
        ORDER BY count DESC
      `,

      // Top 5 ads by WhatsApp clicks this month
      prisma.clickEvent.groupBy({
        by: ['adId'],
        where: {
          type: 'WHATSAPP',
          createdAt: { gte: monthStart },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ]);

    // Fetch ad details for top ads
    const topAdsWithDetails = await Promise.all(
      topAdsByWhatsApp.map(async (entry) => {
        const ad = await prisma.ad.findUnique({
          where: { id: entry.adId },
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            advertiser: { select: { email: true, whatsappNumber: true } },
          },
        });
        return {
          ...ad,
          whatsappClicks: entry._count.id,
        };
      }),
    );

    // Format ads by status into a record
    const statusCounts: Record<string, number> = {
      ACTIVE: 0,
      PENDING: 0,
      EXPIRED: 0,
      REJECTED: 0,
    };
    for (const entry of adsByStatus) {
      statusCounts[entry.status] = entry._count.id;
    }

    // Format ads by country (convert bigint to number)
    const countryCounts = adsByCountry.map((entry) => ({
      countryCode: entry.countryCode,
      count: Number(entry.count),
    }));

    return NextResponse.json({
      data: {
        totalActiveAds,
        totalUsers,
        clicksThisWeek,
        clicksThisMonth,
        newRegistrationsThisWeek,
        adsByStatus: statusCounts,
        adsByCountry: countryCounts,
        topAdsByWhatsApp: topAdsWithDetails,
      },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json(
        { error: err.message },
        { status: err.statusCode },
      );
    }
    console.error('GET /api/admin/metrics error:', err);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 },
    );
  }
}
