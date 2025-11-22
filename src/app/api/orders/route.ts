import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

// This would typically come from your database
interface OrderData {
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    price: number;
    name: string;
  }>;
  shippingAddress: {
    firstName: string;
    lastName: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  billingAddress: {
    firstName: string;
    lastName: string;
    company?: string;
    address1: string;
    address2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone?: string;
  };
  customerEmail: string;
  customerPhone?: string;
  shippingMethod: string;
  shippingCost: number;
  tax: number;
  subtotal: number;
  total: number;
  currency: string;
  paymentMethod: string;
  paymentIntentId: string;
  stripeSessionId?: string;
  paymentStatus?: string;
  discountCode?: string;
  discountAmount?: number;
}

// Create a new order
export async function POST(request: NextRequest) {
  try {
    const body: OrderData = await request.json();

    // Validate required fields
    const requiredFields = [
      'items', 'shippingAddress', 'billingAddress', 'customerEmail',
      'shippingMethod', 'total', 'paymentIntentId'
    ];

    for (const field of requiredFields) {
      if (!body[field as keyof OrderData]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validate items
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    // Generate order ID
    const orderId = `MML-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create order object
    const order = {
      id: orderId,
      status: body.paymentStatus === 'paid' ? 'confirmed' : 'pending',
      items: body.items,
      shippingAddress: body.shippingAddress,
      billingAddress: body.billingAddress,
      customer: {
        email: body.customerEmail,
        phone: body.customerPhone,
      },
      shipping: {
        method: body.shippingMethod,
        cost: body.shippingCost,
      },
      payment: {
        method: body.paymentMethod,
        intentId: body.paymentIntentId,
        sessionId: body.stripeSessionId,
        status: body.paymentStatus || 'pending',
      },
      pricing: {
        subtotal: body.subtotal,
        tax: body.tax,
        shipping: body.shippingCost,
        discount: body.discountAmount || 0,
        total: body.total,
        currency: body.currency,
      },
      discountCode: body.discountCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // In a real application, save to database
    // await saveOrderToDatabase(order);

    // Reserve inventory
    await reserveInventory(body.items, orderId);

    // Send order confirmation email
    await sendOrderConfirmationEmail(order);

    // Integrate with fulfillment system
    await createFulfillmentOrder(order);

    // Track analytics
    await trackOrderCreated(order);

    return NextResponse.json({
      success: true,
      orderId: orderId,
      order: {
        id: orderId,
        status: order.status,
        total: order.pricing.total,
        currency: order.pricing.currency,
        createdAt: order.createdAt,
      },
    });

  } catch (error) {
    console.error('Order creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}

// Get order details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('id');
    const customerEmail = searchParams.get('email');

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // In a real application, fetch from database
    const order = await getOrderFromDatabase(orderId);

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // If email is provided, verify it matches the order
    if (customerEmail && order.customer.email !== customerEmail) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Get current order status and tracking
    const orderStatus = await getOrderStatus(orderId);
    const trackingInfo = await getTrackingInfo(orderId);

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        status: orderStatus,
        tracking: trackingInfo,
      },
    });

  } catch (error) {
    console.error('Order fetch failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

// Helper functions (these would be implemented with real services)

async function reserveInventory(items: OrderData['items'], orderId: string) {
  try {
    for (const item of items) {
      await fetch('/api/inventory/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          orderId: orderId,
        }),
      });
    }
  } catch (error) {
    console.error('Inventory reservation failed:', error);
    throw new Error('Failed to reserve inventory');
  }
}

async function sendOrderConfirmationEmail(order: any) {
  try {
    await fetch('/api/email/order-confirmation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: order.customer.email,
        orderId: order.id,
        items: order.items,
        total: order.pricing.total,
        shippingAddress: order.shippingAddress,
      }),
    });
  } catch (error) {
    console.error('Email sending failed:', error);
    // Don't throw - email failure shouldn't fail order creation
  }
}

async function createFulfillmentOrder(order: any) {
  try {
    // This would integrate with your fulfillment provider (ShipBob, Fulfillment by Amazon, etc.)
    await fetch('/api/fulfillment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order.id,
        items: order.items,
        shippingAddress: order.shippingAddress,
        shippingMethod: order.shipping.method,
      }),
    });
  } catch (error) {
    console.error('Fulfillment order creation failed:', error);
    // Log but don't throw - fulfillment can be handled manually
  }
}

async function trackOrderCreated(order: any) {
  try {
    // Track with analytics services
    await Promise.all([
      // Google Analytics
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'purchase',
          orderId: order.id,
          value: order.pricing.total,
          currency: order.pricing.currency,
          items: order.items,
        }),
      }),
      // Facebook Pixel
      fetch('/api/analytics/facebook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'Purchase',
          value: order.pricing.total,
          currency: order.pricing.currency,
        }),
      }),
    ]);
  } catch (error) {
    console.error('Analytics tracking failed:', error);
    // Don't throw - analytics failure shouldn't affect order
  }
}

// Mock database functions (replace with real database queries)
async function getOrderFromDatabase(orderId: string) {
  // This would be a real database query
  return {
    id: orderId,
    status: 'confirmed',
    items: [],
    customer: { email: 'customer@example.com' },
    createdAt: new Date().toISOString(),
  };
}

async function getOrderStatus(orderId: string) {
  // This would check with fulfillment provider
  return 'processing';
}

async function getTrackingInfo(orderId: string) {
  // This would fetch from shipping carrier
  return {
    trackingNumber: null,
    carrier: null,
    status: 'order_received',
    updates: [
      {
        status: 'order_received',
        description: 'Order has been received and is being processed',
        timestamp: new Date().toISOString(),
      },
    ],
  };
}
