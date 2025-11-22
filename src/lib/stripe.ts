import Stripe from 'stripe';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export { stripe };

// Helper functions for common Stripe operations
export async function createPaymentIntent({
  amount,
  currency = 'usd',
  metadata = {},
  customerId,
  paymentMethodId,
}: {
  amount: number;
  currency?: string;
  metadata?: Record<string, string>;
  customerId?: string;
  paymentMethodId?: string;
}) {
  return await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Convert to cents
    currency: currency.toLowerCase(),
    metadata,
    customer: customerId,
    payment_method: paymentMethodId,
    automatic_payment_methods: paymentMethodId ? undefined : { enabled: true },
    confirm: Boolean(paymentMethodId),
  });
}

export async function createCustomer({
  email,
  name,
  metadata = {},
}: {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}) {
  return await stripe.customers.create({
    email,
    name,
    metadata,
  });
}

export async function retrievePaymentIntent(paymentIntentId: string) {
  return await stripe.paymentIntents.retrieve(paymentIntentId);
}

export async function createRefund({
  paymentIntentId,
  amount,
  reason = 'requested_by_customer',
}: {
  paymentIntentId: string;
  amount?: number;
  reason?: Stripe.RefundCreateParams.Reason;
}) {
  return await stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amount ? Math.round(amount * 100) : undefined,
    reason,
  });
}

export async function listPaymentMethods(customerId: string) {
  return await stripe.customers.listPaymentMethods(customerId, {
    type: 'card',
  });
}

export async function attachPaymentMethod({
  customerId,
  paymentMethodId,
}: {
  customerId: string;
  paymentMethodId: string;
}) {
  return await stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });
}

export async function detachPaymentMethod(paymentMethodId: string) {
  return await stripe.paymentMethods.detach(paymentMethodId);
}

export async function updateCustomer({
  customerId,
  defaultPaymentMethod,
}: {
  customerId: string;
  defaultPaymentMethod: string;
}) {
  return await stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: defaultPaymentMethod,
    },
  });
}

// Webhook signature verification helper
export function constructWebhookEvent(
  payload: string | Buffer,
  header: string | null,
  secret: string,
) {
  const signature = header;
  if (!signature) {
    throw new Error('No signature provided');
  }
  return stripe.webhooks.constructEvent(payload, signature, secret);
}