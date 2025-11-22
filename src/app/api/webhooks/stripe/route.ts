import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'checkout.session.async_payment_succeeded':
        await handleAsyncPaymentSucceeded(event.data.object as Stripe.Checkout.Session);
        break;

      case 'checkout.session.async_payment_failed':
        await handleAsyncPaymentFailed(event.data.object as Stripe.Checkout.Session);
        break;

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as Stripe.Charge);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

// Handle successful checkout session
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log('Checkout session completed:', session.id);

    // Retrieve session with line items
    const sessionWithLineItems = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ['line_items', 'line_items.data.price.product'],
    });

    // Extract order data from session
    const lineItems = sessionWithLineItems.line_items?.data || [];
    const customerDetails = sessionWithLineItems.customer_details;
    const shippingDetails = sessionWithLineItems.shipping_details;

    // Create order in database
    const orderData = {
      items: lineItems.map((item: any) => {
        const product = item.price?.product;
        const metadata = typeof product === 'object' ? product.metadata : {};

        return {
          productId: metadata.productId || 'unknown',
          variantId: metadata.variantId || '',
          quantity: item.quantity || 1,
          price: item.price?.unit_amount ? item.price.unit_amount / 100 : 0,
          name: item.description || 'Product',
        };
      }),
      shippingAddress: {
        firstName: shippingDetails?.name?.split(' ')[0] || '',
        lastName: shippingDetails?.name?.split(' ').slice(1).join(' ') || '',
        address1: shippingDetails?.address?.line1 || '',
        address2: shippingDetails?.address?.line2 || '',
        city: shippingDetails?.address?.city || '',
        state: shippingDetails?.address?.state || '',
        postalCode: shippingDetails?.address?.postal_code || '',
        country: shippingDetails?.address?.country || '',
        phone: customerDetails?.phone || '',
      },
      billingAddress: {
        firstName: customerDetails?.name?.split(' ')[0] || '',
        lastName: customerDetails?.name?.split(' ').slice(1).join(' ') || '',
        address1: shippingDetails?.address?.line1 || '',
        address2: shippingDetails?.address?.line2 || '',
        city: shippingDetails?.address?.city || '',
        state: shippingDetails?.address?.state || '',
        postalCode: shippingDetails?.address?.postal_code || '',
        country: shippingDetails?.address?.country || '',
        phone: customerDetails?.phone || '',
      },
      customerEmail: customerDetails?.email || '',
      customerPhone: customerDetails?.phone || '',
      shippingMethod: sessionWithLineItems.shipping_cost?.shipping_rate || 'standard',
      shippingCost: sessionWithLineItems.shipping_cost?.amount_total
        ? sessionWithLineItems.shipping_cost.amount_total / 100
        : 0,
      tax: sessionWithLineItems.total_details?.amount_tax
        ? sessionWithLineItems.total_details.amount_tax / 100
        : 0,
      subtotal: sessionWithLineItems.amount_subtotal
        ? sessionWithLineItems.amount_subtotal / 100
        : 0,
      total: sessionWithLineItems.amount_total
        ? sessionWithLineItems.amount_total / 100
        : 0,
      currency: sessionWithLineItems.currency || 'usd',
      paymentMethod: 'stripe',
      paymentIntentId: typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent?.id || '',
      stripeSessionId: session.id,
      paymentStatus: session.payment_status,
    };

    // Save order to database
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      throw new Error('Failed to create order from webhook');
    }

    const result = await response.json();
    console.log('Order created successfully:', result.orderId);

    // Update session metadata with order ID
    await stripe.checkout.sessions.update(session.id, {
      metadata: {
        ...session.metadata,
        orderId: result.orderId,
      },
    });

  } catch (error) {
    console.error('Error handling checkout session completed:', error);
    throw error;
  }
}

// Handle async payment succeeded
async function handleAsyncPaymentSucceeded(session: Stripe.Checkout.Session) {
  console.log('Async payment succeeded for session:', session.id);

  // Update order status to confirmed
  // This would typically update your database
  try {
    // Fetch order by session ID and update status
    console.log('Payment confirmed for session:', session.id);
  } catch (error) {
    console.error('Error handling async payment succeeded:', error);
  }
}

// Handle async payment failed
async function handleAsyncPaymentFailed(session: Stripe.Checkout.Session) {
  console.log('Async payment failed for session:', session.id);

  // Update order status to failed
  // Send notification to customer
  try {
    console.log('Payment failed for session:', session.id);
  } catch (error) {
    console.error('Error handling async payment failed:', error);
  }
}

// Handle payment intent succeeded
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent succeeded:', paymentIntent.id);

  // Additional processing if needed
  // This fires after checkout.session.completed for regular payments
}

// Handle payment intent failed
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  console.log('Payment intent failed:', paymentIntent.id);

  // Notify customer of payment failure
  // Update order status
}

// Handle refund
async function handleChargeRefunded(charge: Stripe.Charge) {
  console.log('Charge refunded:', charge.id);

  // Update order status to refunded
  // Send refund confirmation email
  try {
    const paymentIntentId = typeof charge.payment_intent === 'string'
      ? charge.payment_intent
      : charge.payment_intent?.id;

    console.log('Processing refund for payment intent:', paymentIntentId);
  } catch (error) {
    console.error('Error handling charge refunded:', error);
  }
}
