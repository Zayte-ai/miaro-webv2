import { NextRequest, NextResponse } from 'next/server';
import { trackShipment, trackMultipleShipments } from '@/lib/fedex';

/**
 * Track one or more shipments by tracking number
 * Public endpoint (customers can track their orders)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const trackingNumber = searchParams.get('trackingNumber');
    const trackingNumbers = searchParams.get('trackingNumbers');

    if (!trackingNumber && !trackingNumbers) {
      return NextResponse.json(
        { success: false, error: 'Tracking number(s) required' },
        { status: 400 }
      );
    }

    let trackingInfo;

    if (trackingNumbers) {
      // Track multiple shipments
      const numbers = trackingNumbers.split(',').map(n => n.trim());
      trackingInfo = await trackMultipleShipments(numbers);
    } else if (trackingNumber) {
      // Track single shipment
      trackingInfo = await trackShipment(trackingNumber);
    }

    return NextResponse.json({
      success: true,
      data: trackingInfo,
    });
  } catch (error: any) {
    console.error('Tracking API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to track shipment',
      },
      { status: 500 }
    );
  }
}

/**
 * Track shipment by order ID
 */
export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get tracking number from order
    const { prisma } = await import('@/lib/db');
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { trackingNumber: true, orderNumber: true },
    });

    if (!order || !order.trackingNumber) {
      return NextResponse.json(
        { success: false, error: 'Order not found or not yet shipped' },
        { status: 404 }
      );
    }

    // Get tracking info from FedEx
    const trackingInfo = await trackShipment(order.trackingNumber);

    return NextResponse.json({
      success: true,
      data: {
        orderNumber: order.orderNumber,
        ...trackingInfo,
      },
    });
  } catch (error: any) {
    console.error('Track by order API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to track order',
      },
      { status: 500 }
    );
  }
}
