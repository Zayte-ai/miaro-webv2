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

// Category colors for visual consistency
const categoryColors = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#06B6D4', '#84CC16', '#EC4899', '#F97316', '#6366F1',
];

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

    // Fetch category revenue by joining through products
    const orderItems = await prisma.orderItem.findMany({
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
      include: {
        product: {
          include: {
            category: true,
          },
        },
      },
    });

    // Aggregate revenue by category
    const categoryMap = new Map<string, { name: string; revenue: number }>();

    orderItems.forEach((item) => {
      const categoryId = item.product.categoryId;
      const categoryName = item.product.category.name;

      if (categoryMap.has(categoryId)) {
        const existing = categoryMap.get(categoryId)!;
        categoryMap.set(categoryId, {
          name: existing.name,
          revenue: existing.revenue + item.totalPrice,
        });
      } else {
        categoryMap.set(categoryId, {
          name: categoryName,
          revenue: item.totalPrice,
        });
      }
    });

    // Calculate total revenue
    let totalRevenue = 0;
    categoryMap.forEach((data) => {
      totalRevenue += data.revenue;
    });

    // Convert to array with percentages and colors
    const categoryData = Array.from(categoryMap.values())
      .map((category, index) => ({
        name: category.name,
        color: categoryColors[index % categoryColors.length],
        revenue: Math.round(category.revenue * 100) / 100,
        value: totalRevenue > 0 ? Math.round((category.revenue / totalRevenue) * 100) : 0,
      }))
      .sort((a, b) => b.value - a.value);

    return NextResponse.json(categoryData);
  } catch (error: any) {
    console.error('Analytics categories API error:', error);

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
