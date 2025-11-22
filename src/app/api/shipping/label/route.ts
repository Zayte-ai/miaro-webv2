import { NextRequest, NextResponse } from 'next/server';
import { createShippingLabel, calculatePackageWeight, type Address } from '@/lib/fedex';
import { prisma } from '@/lib/db';
import { requireAdmin } from '@/lib/admin-auth';

/**
 * Create shipping label for an order
 * Admin only endpoint
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdmin(request);

    const body = await request.json();
    const { orderId, serviceType } = body;

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get order with shipping address and items
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        shippingAddress: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order || !order.shippingAddress) {
      return NextResponse.json(
        { success: false, error: 'Order or shipping address not found' },
        { status: 404 }
      );
    }

    // Convert address to FedEx format
    const shippingAddress: Address = {
      streetLines: [order.shippingAddress.street, order.shippingAddress.street2].filter(Boolean) as string[],
      city: order.shippingAddress.city,
      stateOrProvinceCode: order.shippingAddress.state,
      postalCode: order.shippingAddress.zipCode,
      countryCode: order.shippingAddress.country,
      contactPersonName: `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`,
      phoneNumber: order.shippingAddress.phone || '',
    };

    // Calculate package weight from order items
    const weight = calculatePackageWeight(
      order.items.map(item => ({
        weight: (item.product as any).weight,
        quantity: item.quantity,
      }))
    );

    // Create shipping label
    const label = await createShippingLabel(
      order.orderNumber,
      shippingAddress,
      { weight },
      serviceType || 'FEDEX_GROUND'
    );

    // Update order with tracking information
    await prisma.order.update({
      where: { id: orderId },
      data: {
        trackingNumber: label.trackingNumber,
        fulfillmentStatus: 'PARTIALLY_FULFILLED',
        updatedAt: new Date(),
      },
    });

    // Store label in database (optional - you might want to save the PDF)
    // For now, we'll just return it to be downloaded/printed

    return NextResponse.json({
      success: true,
      data: {
        trackingNumber: label.trackingNumber,
        labelImage: label.labelImage, // Base64 PDF
        labelFormat: label.labelFormat,
      },
    });
  } catch (error: any) {
    console.error('Create label API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to create shipping label',
      },
      { status: 500 }
    );
  }
}
