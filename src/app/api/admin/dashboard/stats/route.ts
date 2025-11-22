import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    await requireAdmin(request);

    // Get total counts
    const [
      totalProducts,
      totalOrders,
      totalCustomers,
      totalRevenue,
      recentOrders,
      lowStockProducts,
    ] = await Promise.all([
      // Total products
      prisma.product.count({
        where: { isActive: true },
      }),

      // Total orders (excluding canceled/refunded)
      prisma.order.count({
        where: {
          status: {
            notIn: ['CANCELED', 'REFUNDED'],
          },
        },
      }),

      // Total customers
      prisma.user.count({
        where: { isActive: true },
      }),

      // Total revenue
      prisma.order.aggregate({
        where: {
          status: {
            notIn: ['CANCELED', 'REFUNDED'],
          },
        },
        _sum: {
          totalAmount: true,
        },
      }),

      // Recent orders
      prisma.order.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),

      // Low stock products
      prisma.product.findMany({
        where: {
          isActive: true,
          inventory: {
            quantity: {
              lte: prisma.productInventory.fields.lowStockThreshold,
            },
          },
        },
        take: 5,
        include: {
          inventory: true,
          images: {
            take: 1,
            orderBy: {
              sortOrder: 'asc',
            },
          },
        },
        orderBy: {
          inventory: {
            quantity: 'asc',
          },
        },
      }),
    ]);

    // Calculate new customers in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newCustomers = await prisma.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    return NextResponse.json({
      stats: {
        totalProducts,
        totalOrders,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        newCustomers,
      },
      recentOrders: recentOrders.map((order) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customer: order.user
          ? `${order.user.firstName} ${order.user.lastName}`
          : 'Guest',
        email: order.email,
        total: order.totalAmount,
        status: order.status,
        items: order.items.map((item) => ({
          productName: item.product.name,
          quantity: item.quantity,
        })),
        createdAt: order.createdAt,
      })),
      lowStockProducts: lowStockProducts.map((product) => ({
        id: product.id,
        name: product.name,
        sku: product.sku,
        stock: product.inventory?.quantity || 0,
        lowStockThreshold: product.inventory?.lowStockThreshold || 10,
        price: product.price,
        image: product.images[0]?.url,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);

    if (error.name === 'AdminAuthError') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
