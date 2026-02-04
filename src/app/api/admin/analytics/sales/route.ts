import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const getRangeDates = (range: string) => {
  const now = new Date();
  const rangeData = {
    '7d': { days: 7, interval: 1 },
    '30d': { days: 30, interval: 1 },
    '90d': { days: 90, interval: 3 },
    '1y': { days: 365, interval: 30 },
  };

  const { days, interval } = rangeData[range as keyof typeof rangeData] || rangeData['7d'];

  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  return { startDate, endDate: now, days, interval };
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

    const { startDate, endDate, days, interval } = getRangeDates(range);

    // Fetch all orders in the date range
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          notIn: ['CANCELED', 'REFUNDED'],
        },
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group orders by date/interval
    const salesMap = new Map<string, { sales: number; orders: number }>();

    // Initialize all dates in the range with 0 values
    for (let i = 0; i <= days; i += interval) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0];
      salesMap.set(dateKey, { sales: 0, orders: 0 });
    }

    // Aggregate orders into date buckets
    orders.forEach((order) => {
      const orderDate = new Date(order.createdAt);

      // For intervals > 1, round down to nearest interval
      if (interval > 1) {
        const daysSinceStart = Math.floor(
          (orderDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        const bucketDay = Math.floor(daysSinceStart / interval) * interval;
        const bucketDate = new Date(startDate);
        bucketDate.setDate(bucketDate.getDate() + bucketDay);
        orderDate.setTime(bucketDate.getTime());
      }

      const dateKey = orderDate.toISOString().split('T')[0];

      if (salesMap.has(dateKey)) {
        const current = salesMap.get(dateKey)!;
        salesMap.set(dateKey, {
          sales: current.sales + order.totalAmount,
          orders: current.orders + 1,
        });
      }
    });

    // Convert map to array and format
    const salesData = Array.from(salesMap.entries())
      .map(([date, data]) => ({
        date,
        sales: Math.round(data.sales * 100) / 100,
        orders: data.orders,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json(salesData);
  } catch (error: any) {
    console.error('Analytics sales API error:', error);

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
