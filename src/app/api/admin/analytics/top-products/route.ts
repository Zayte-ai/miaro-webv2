import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';

const getRangeDates = (range: string) => {
  const now = new Date();
  const rangeData = {
    '7d': { days: 7 },
    '30d': { days: 30 },
    '90d': { days: 90 },
    '1y': { days: 365 },
  };

  const { days } = rangeData[range as keyof typeof rangeData] || rangeData['7d'];

  const startDate = new Date(now);
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  return { startDate, endDate: now };
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

    const { startDate, endDate } = getRangeDates(range);

    // Fetch top products by revenue
    const orderItems = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          status: {
            notIn: ['CANCELED', 'REFUNDED'],
          },
        },
      },
      _sum: {
        quantity: true,
        totalPrice: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          totalPrice: 'desc',
        },
      },
      take: 10,
    });

    // Fetch product details
    const productIds = orderItems.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: {
        id: {
          in: productIds,
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    // Create a map for quick lookup
    const productMap = new Map(products.map((p) => [p.id, p.name]));

    // Combine data
    const topProducts = orderItems.map((item) => ({
      id: item.productId,
      name: productMap.get(item.productId) || 'Unknown Product',
      sales: item._sum.quantity || 0,
      revenue: Math.round((item._sum.totalPrice || 0) * 100) / 100,
    }));

    return NextResponse.json(topProducts);
  } catch (error: any) {
    console.error('Analytics top products API error:', error);

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

export const revalidate = 600; // Revalidate every 10 minutes
