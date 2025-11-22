import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { sendOrderConfirmationEmail } from '@/lib/email';
import type Stripe from 'stripe';

// This helper reconstructs the full stripe raw body from chunks
async function getRawBody(request: NextRequest): Promise<string> {
  const reader = request.body?.getReader();
  if (!reader) return '';

  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }

  const concatenated = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
  let offset = 0;
  for (const chunk of chunks) {
    concatenated.set(chunk, offset);
    offset += chunk.length;
  }

  return new TextDecoder().decode(concatenated);
}

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');
    const rawBody = await getRawBody(request);

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature header' },
        { status: 400 }
      );
    }

    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.orderId) {
          const order = await prisma.order.update({
            where: { id: session.metadata.orderId },
            data: {
              status: 'CONFIRMED',
              paymentStatus: 'CAPTURED',
              payments: {
                create: {
                  amount: session.amount_total! / 100,
                  currency: session.currency?.toUpperCase() ?? 'USD',
                  status: 'CAPTURED',
                  method: 'CREDIT_CARD',
                  gateway: 'stripe',
                  gatewayTransactionId: session.payment_intent as string,
                  gatewayResponse: session as any
                }
              }
            },
            include: {
              items: {
                select: {
                  product: {
                    select: {
                      name: true,
                      images: true
                    }
                  },
                  quantity: true,
                  price: true
                }
              },
              shippingAddress: true
            }
          });

          // Calculate estimated delivery (14 days from now)
          const estimatedDelivery = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          });

          // Send order confirmation email
          await sendOrderConfirmationEmail({
            orderNumber: order.orderNumber,
            customerName: session.customer_details?.name || 'Customer',
            customerEmail: order.email,
            items: order.items.map((item: any) => ({
              name: item.product.name,
              quantity: item.quantity,
              price: item.price,
              image: item.product.images[0]?.url || ''
            })),
            total: order.totalAmount,
            subtotal: order.subtotal,
            tax: order.taxAmount,
            shipping: order.shippingAmount,
            estimatedDelivery,
            shippingAddress: order.shippingAddress ? {
              line1: order.shippingAddress.street,
              line2: order.shippingAddress.street2 || undefined,
              city: order.shippingAddress.city,
              state: order.shippingAddress.state,
              postal_code: order.shippingAddress.zipCode,
              country: order.shippingAddress.country
            } : undefined
          });
        }
        break;
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.orderId) {
          await prisma.order.update({
            where: { id: session.metadata.orderId },
            data: {
              status: 'CANCELED',
              paymentStatus: 'FAILED',
              canceledAt: new Date(),
            }
          });
        }
        break;
      }

      case 'payment_intent.succeeded': {
        // Additional payment success handling if needed
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        if (paymentIntent.metadata?.orderId) {
          await prisma.order.update({
            where: { id: paymentIntent.metadata.orderId },
            data: {
              paymentStatus: 'FAILED',
            }
          });
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    );
  }
}