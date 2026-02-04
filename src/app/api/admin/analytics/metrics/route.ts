import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getRangeDates = (range: string) => {
  const now = new Date();
  const rangeData = {
    '7d': { days: 7 },
    '30d': { days: 30 },
    '90d': { days: 90 },
    '1y': { days: 365 },
  };

  const { days } = rangeData[range as keyof typeof rangeData] || rangeData['7d'];

  const currentStart = new Date(now);
  currentStart.setDate(currentStart.getDate() - days);

  const previousStart = new Date(currentStart);
  previousStart.setDate(previousStart.getDate() - days);

  return {
    currentStart,
    currentEnd: now,
    previousStart,
    previousEnd: currentStart,
  };
};

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '7d';

    // Validate range parameter
    const validRanges = ['7d', '30d', '90d', '1y'];
    if (!validRanges.includes(range)) {
      return NextResponse.json(
        { error: 'Invalid range parameter' },
        { status: 400 }
      );
    }

    const { currentStart, currentEnd, previousStart, previousEnd } = getRangeDates(range);

    // Fetch current period data
    const [currentRevenue, currentOrders, currentCustomers] = await Promise.all([
      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: currentStart,
            lte: currentEnd,
          },
          status: {
            notIn: ['CANCELED', 'REFUNDED'],
          },
        },
        _sum: {
          totalAmount: true,
        },
      }),
      prisma.order.count({
        where: {
          createdAt: {
            gte: currentStart,
            lte: currentEnd,
          },
          status: {
            notIn: ['CANCELED', 'REFUNDED'],
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: currentStart,
            lte: currentEnd,
          },
        },
      }),
    ]);

    // Fetch previous period data for comparison
    const [previousRevenue, previousOrders, previousCustomers] = await Promise.all([
      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: previousStart,
            lte: previousEnd,
          },
          status: {
            notIn: ['CANCELED', 'REFUNDED'],
          },
        },
        _sum: {
          totalAmount: true,
        },
      }),
      prisma.order.count({
        where: {
          createdAt: {
            gte: previousStart,
            lte: previousEnd,
          },
          status: {
            notIn: ['CANCELED', 'REFUNDED'],
          },
        },
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: previousStart,
            lte: previousEnd,
          },
        },
      }),
    ]);

    const currentRevenueValue = currentRevenue._sum.totalAmount || 0;
    const previousRevenueValue = previousRevenue._sum.totalAmount || 0;
    const currentAvgOrder = currentOrders > 0 ? currentRevenueValue / currentOrders : 0;
    const previousAvgOrder = previousOrders > 0 ? previousRevenueValue / previousOrders : 0;

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const analyticsData = {
      revenue: {
        current: currentRevenueValue,
        previous: previousRevenueValue,
        change: calculateChange(currentRevenueValue, previousRevenueValue),
      },
      orders: {
        current: currentOrders,
        previous: previousOrders,
        change: calculateChange(currentOrders, previousOrders),
      },
      customers: {
        current: currentCustomers,
        previous: previousCustomers,
        change: calculateChange(currentCustomers, previousCustomers),
      },
      averageOrder: {
        current: currentAvgOrder,
        previous: previousAvgOrder,
        change: calculateChange(currentAvgOrder, previousAvgOrder),
      },
      conversionRate: {
        current: 0, // TODO: Implement conversion rate tracking
        previous: 0,
        change: 0,
      },
    };

    return NextResponse.json(analyticsData);
  } catch (error: any) {
    console.error('Analytics metrics API error:', error);

    if (error.name === 'AdminAuthError') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
