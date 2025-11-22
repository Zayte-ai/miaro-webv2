# Admin Panel & Stripe Integration Guide

This guide explains how the Maison Miaro admin panel integrates with Stripe Embedded Checkout and how orders are managed.

## Overview

The system uses Stripe Webhooks to automatically create orders in your database when customers complete checkout. This ensures the admin panel always has up-to-date order information.

## Architecture

```
Customer Checkout → Stripe Checkout Session → Webhook Event → Order Created → Admin Panel
```

## Files Created/Modified

### API Routes

1. **`/api/webhooks/stripe/route.ts`** - Stripe webhook handler
   - Receives events from Stripe when checkout sessions complete
   - Automatically creates orders in your database
   - Handles payment success, failure, and refunds

2. **`/api/orders/route.ts`** - Order management API
   - Updated to accept Stripe session data
   - Creates orders with payment information
   - Includes `stripeSessionId` and `paymentStatus` fields

3. **`/api/payments/stripe/create-checkout-session/route.ts`** - Checkout session creation
   - Creates Stripe embedded checkout sessions
   - Includes product metadata for webhook processing

## How It Works

### 1. Customer Completes Checkout

When a customer clicks "Proceed to Checkout" from the cart:

1. The checkout page loads at `/checkout`
2. A Stripe checkout session is created via `/api/payments/stripe/create-checkout-session`
3. The embedded Stripe checkout form is displayed
4. Customer enters payment and shipping information
5. Stripe processes the payment

### 2. Webhook Processing

After successful payment:

1. Stripe sends a `checkout.session.completed` event to `/api/webhooks/stripe`
2. The webhook handler:
   - Retrieves the full session with line items
   - Extracts customer, shipping, and product data
   - Creates an order via `/api/orders`
   - Updates the session metadata with the order ID

### 3. Order Created

The order is now available in the admin panel with:

- Order ID (format: `MML-[timestamp]-[random]`)
- Customer information (name, email, phone)
- Shipping address
- Billing address
- Line items with product details
- Payment information (Stripe session ID, payment intent ID)
- Order status (`confirmed` for paid orders)
- Pricing breakdown (subtotal, tax, shipping, total)

## Admin Panel Integration

### Current Admin API Routes

The admin panel has these API routes available:

- `/api/admin/auth` - Admin authentication
- `/api/admin/analytics/categories` - Category analytics
- `/api/admin/analytics/export` - Export analytics data
- `/api/admin/analytics/metrics` - General metrics
- `/api/admin/analytics/sales` - Sales data
- `/api/admin/analytics/top-products` - Top selling products
- `/api/admin/products` - Product management
- `/api/admin/products/[id]` - Individual product management

### Admin Dashboard Routes

Based on the sidebar component, these admin pages should exist:

- `/admin/dashboard` - Main dashboard
- `/admin/dashboard/products` - Product management
- `/admin/dashboard/categories` - Category management
- `/admin/dashboard/orders` - **Order management (view Stripe orders here)**
- `/admin/dashboard/customers` - Customer management
- `/admin/dashboard/analytics` - Analytics and reports
- `/admin/dashboard/settings` - Admin settings

## Viewing Orders in Admin

### Order Data Structure

Each order created from Stripe checkout contains:

```typescript
{
  id: "MML-1696825600000-ABC123XYZ",
  status: "confirmed", // or "pending"
  items: [
    {
      productId: "prod_123",
      variantId: "size-m-color-black",
      quantity: 2,
      price: 29.99,
      name: "Product Name"
    }
  ],
  customer: {
    email: "customer@example.com",
    phone: "+1234567890"
  },
  shippingAddress: {
    firstName: "John",
    lastName: "Doe",
    address1: "123 Main St",
    address2: "Apt 4B",
    city: "New York",
    state: "NY",
    postalCode: "10001",
    country: "US",
    phone: "+1234567890"
  },
  billingAddress: { /* same structure as shipping */ },
  shipping: {
    method: "standard", // or shipping rate ID from Stripe
    cost: 15.00
  },
  payment: {
    method: "stripe",
    intentId: "pi_abc123",
    sessionId: "cs_test_abc123",
    status: "paid"
  },
  pricing: {
    subtotal: 59.98,
    tax: 5.40,
    shipping: 15.00,
    discount: 0,
    total: 80.38,
    currency: "usd"
  },
  createdAt: "2024-10-09T12:00:00.000Z",
  updatedAt: "2024-10-09T12:00:00.000Z"
}
```

### Accessing Order Information

To retrieve orders in the admin panel:

```typescript
// Get all orders
const response = await fetch('/api/orders', {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});

// Get specific order
const response = await fetch('/api/orders?id=MML-123456', {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});
```

## Setting Up Stripe Webhooks

### Development (Local Testing)

1. **Install Stripe CLI**:
   ```bash
   # Windows
   scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
   scoop install stripe

   # macOS
   brew install stripe/stripe-cli/stripe

   # Linux
   # Download from: https://github.com/stripe/stripe-cli/releases
   ```

2. **Login to Stripe**:
   ```bash
   stripe login
   ```

3. **Forward webhooks to local server**:
   ```bash
   stripe listen --forward-to localhost:3001/api/webhooks/stripe
   ```

4. **Copy the webhook secret** (starts with `whsec_`) and add to `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret
   ```

5. **Test the webhook**:
   ```bash
   stripe trigger checkout.session.completed
   ```

### Production

1. **Go to Stripe Dashboard** → [Webhooks](https://dashboard.stripe.com/webhooks)

2. **Click "Add endpoint"**

3. **Enter your endpoint URL**:
   ```
   https://yourdomain.com/api/webhooks/stripe
   ```

4. **Select events to listen to**:
   - `checkout.session.completed` - Required
   - `checkout.session.async_payment_succeeded` - For async payments
   - `checkout.session.async_payment_failed` - Payment failures
   - `payment_intent.succeeded` - Payment confirmations
   - `payment_intent.payment_failed` - Payment failures
   - `charge.refunded` - Refund processing

5. **Copy the signing secret** and add to your production environment:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret
   ```

6. **Deploy your application** with the new webhook secret

## Testing the Integration

### Test Checkout Flow

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Start Stripe webhook forwarding**:
   ```bash
   stripe listen --forward-to localhost:3001/api/webhooks/stripe
   ```

3. **Complete a test checkout**:
   - Go to http://localhost:3001
   - Add items to cart
   - Click "Proceed to Checkout"
   - Use test card: `4242 4242 4242 4242`
   - Complete the checkout

4. **Check webhook console**:
   - You should see `checkout.session.completed` event
   - Order should be created automatically

5. **Verify in logs**:
   ```
   Checkout session completed: cs_test_...
   Order created successfully: MML-...
   ```

### Test Cases

#### ✅ Successful Payment
- **Card**: `4242 4242 4242 4242`
- **Expected**: Order created with status `confirmed`

#### 🔐 3D Secure Authentication
- **Card**: `4000 0025 0000 3155`
- **Expected**: Requires authentication, then order created

#### ❌ Declined Payment
- **Card**: `4000 0000 0000 9995`
- **Expected**: Payment fails, no order created

#### 💰 Refund Testing
1. Complete a successful payment
2. Go to Stripe Dashboard → Payments
3. Find the payment and click "Refund"
4. The webhook should receive `charge.refunded` event

## Admin Dashboard Features

### Order Management

The admin panel should display:

- **Order List**: All orders with filtering and search
- **Order Details**: Full order information
- **Customer Information**: Name, email, phone
- **Shipping Details**: Address and shipping method
- **Payment Status**: Paid, pending, failed, refunded
- **Order Status**: Confirmed, processing, shipped, delivered
- **Fulfillment**: Mark orders as shipped, add tracking numbers

### Analytics Integration

Orders from Stripe checkout will appear in:

- **Sales Reports**: Daily, weekly, monthly revenue
- **Product Analytics**: Best sellers, revenue by product
- **Customer Analytics**: New vs returning customers
- **Payment Analytics**: Success rate, average order value

## Troubleshooting

### Webhook Not Receiving Events

**Problem**: Stripe sends events but webhook doesn't receive them

**Solutions**:
1. Check that Stripe CLI is running: `stripe listen --forward-to localhost:3001/api/webhooks/stripe`
2. Verify webhook secret in `.env`: `STRIPE_WEBHOOK_SECRET=whsec_...`
3. Check server logs for errors
4. Ensure endpoint is accessible: `curl http://localhost:3001/api/webhooks/stripe`

### Orders Not Creating

**Problem**: Webhook receives events but orders aren't created

**Solutions**:
1. Check webhook console logs for errors
2. Verify `/api/orders` endpoint is working
3. Check that all required fields are present in webhook data
4. Review server logs for database errors

### Payment Status Not Updating

**Problem**: Orders created but payment status shows as pending

**Solutions**:
1. Check that `paymentStatus` field is being passed from webhook
2. Verify webhook is receiving `checkout.session.completed` event
3. Ensure session is retrieved with correct parameters
4. Check that payment intent status is `succeeded`

### Admin Can't See Orders

**Problem**: Admin panel doesn't show Stripe orders

**Solutions**:
1. Verify orders are being created (check database or logs)
2. Ensure admin has proper authentication
3. Check that `/api/orders` returns data
4. Verify admin dashboard is querying correct endpoint

## Security Best Practices

### Webhook Security

1. **Always verify webhook signatures**:
   ```typescript
   const event = stripe.webhooks.constructEvent(
     body,
     signature,
     webhookSecret
   );
   ```

2. **Use webhook secrets from environment variables**:
   ```typescript
   const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
   ```

3. **Validate all webhook data before processing**:
   ```typescript
   if (!session.customer_details?.email) {
     throw new Error('Missing customer email');
   }
   ```

### Admin Access

1. **Protect admin routes** with authentication middleware
2. **Use JWT tokens** for admin session management
3. **Implement role-based access** (admin, manager, viewer)
4. **Log all admin actions** for audit trail

### Data Protection

1. **Never expose Stripe secret keys** in client-side code
2. **Sanitize user input** before saving to database
3. **Use HTTPS** for all API communications
4. **Encrypt sensitive data** in database

## Future Enhancements

### Recommended Features

1. **Order Notifications**:
   - Email customers when order status changes
   - Send shipping confirmation with tracking
   - SMS notifications for important updates

2. **Inventory Management**:
   - Auto-reserve stock when order is placed
   - Release inventory if payment fails
   - Low stock alerts for admin

3. **Fulfillment Integration**:
   - Connect with ShipBob, Fulfillment by Amazon
   - Auto-create shipping labels
   - Track fulfillment status

4. **Advanced Analytics**:
   - Revenue forecasting
   - Customer lifetime value
   - Cart abandonment tracking
   - Conversion funnel analysis

5. **Customer Portal**:
   - Order tracking page
   - Return/refund requests
   - Order history
   - Reorder functionality

## Support & Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Stripe Webhooks Guide**: https://stripe.com/docs/webhooks
- **Stripe Embedded Checkout**: https://stripe.com/docs/payments/checkout
- **Test Cards**: https://stripe.com/docs/testing#cards
- **Stripe Dashboard**: https://dashboard.stripe.com

---

**Last Updated**: 2025-10-09
**Version**: 1.0.0
**Author**: MaisonMiaro Development Team
