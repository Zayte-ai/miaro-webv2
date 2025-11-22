# Stripe Embedded Checkout Setup Guide

This guide will help you set up Stripe Embedded Checkout for the Maison Miaro e-commerce platform.

## Prerequisites

- Node.js 18+ installed
- A Stripe account ([Sign up here](https://dashboard.stripe.com/register))
- Basic knowledge of Next.js and React

## Step 1: Get Your Stripe API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com/)
2. Navigate to **Developers** → **API keys**
3. Copy your **Publishable key** (starts with `pk_test_` or `pk_live_`)
4. Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)

⚠️ **Important**: Never commit your secret key to version control!

## Step 2: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your Stripe keys:
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
   STRIPE_SECRET_KEY=sk_test_your_secret_key_here
   ```

## Step 3: Install Dependencies

The required Stripe packages are already included in `package.json`. Install them with:

```bash
npm install
```

## Step 4: Run the Development Server

```bash
npm run dev
```

The application will start at `http://localhost:3000`

## Step 5: Test the Checkout Flow

1. Navigate to the shop page and add items to your cart
2. Go to the cart page at `/cart`
3. Click **Proceed to Checkout**
4. You'll be redirected to `/checkout` with the embedded Stripe checkout form
5. Use [Stripe test cards](https://stripe.com/docs/testing#cards) to test payments:
   - **Successful payment**: `4242 4242 4242 4242`
   - **Requires authentication**: `4000 0025 0000 3155`
   - **Declined payment**: `4000 0000 0000 9995`

6. Use any future expiration date (e.g., `12/34`)
7. Use any 3-digit CVC (e.g., `123`)
8. Use any postal code (e.g., `12345`)

## How It Works

### Architecture Overview

```
Cart Page → Checkout Page → Stripe Embedded Checkout → Success Page
```

### File Structure

```
Miaro/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── payments/
│   │   │       └── stripe/
│   │   │           └── create-checkout-session/
│   │   │               └── route.ts          # API endpoint for creating checkout sessions
│   │   ├── cart/
│   │   │   └── page.tsx                      # Shopping cart page
│   │   └── checkout/
│   │       ├── page.tsx                      # Checkout page with embedded form
│   │       └── success/
│   │           └── page.tsx                  # Order confirmation page
│   └── components/
│       └── checkout/
│           └── EmbeddedCheckout.tsx          # Stripe embedded checkout component
```

### API Endpoints

#### POST `/api/payments/stripe/create-checkout-session`

Creates a new Stripe Checkout Session with embedded UI mode.

**Request Body:**
```json
{
  "items": [
    {
      "productId": "prod_123",
      "name": "Product Name",
      "price": 29.99,
      "quantity": 1,
      "size": "M",
      "color": "Black",
      "image": "https://..."
    }
  ],
  "customerEmail": "customer@example.com",
  "successUrl": "http://localhost:3000/checkout/success?session_id={CHECKOUT_SESSION_ID}",
  "cancelUrl": "http://localhost:3000/cart",
  "metadata": {}
}
```

**Response:**
```json
{
  "clientSecret": "cs_test_...",
  "sessionId": "cs_test_..."
}
```

#### GET `/api/payments/stripe/create-checkout-session?session_id=cs_test_...`

Retrieves the status of a checkout session.

**Response:**
```json
{
  "status": "complete",
  "customerEmail": "customer@example.com",
  "paymentStatus": "paid"
}
```

## Features

### ✅ Implemented Features

- **Embedded Checkout UI**: Native Stripe checkout form embedded directly in your site
- **Automatic Tax Calculation**: Stripe Tax automatically calculates taxes
- **Multiple Shipping Options**: Free and express shipping available
- **Order Summary**: Clear breakdown of items, quantities, and pricing
- **Success Page**: Confirmation page with order details
- **Cart Integration**: Automatic cart clearing after successful payment
- **Error Handling**: Graceful error messages and fallbacks
- **Responsive Design**: Works on mobile, tablet, and desktop

### 🎨 Customization Options

You can customize the checkout experience in [`src/app/api/payments/stripe/create-checkout-session/route.ts`](src/app/api/payments/stripe/create-checkout-session/route.ts):

- **Shipping countries**: Modify `allowed_countries` array
- **Shipping rates**: Adjust `shipping_options` with your own rates
- **Currency**: Change the `currency` field (default: USD)
- **Tax calculation**: Enable/disable `automatic_tax`
- **Metadata**: Add custom metadata for tracking

## Testing

### Test Card Numbers

| Card Number | Scenario |
|------------|----------|
| `4242 4242 4242 4242` | Successful payment |
| `4000 0025 0000 3155` | Requires 3D Secure authentication |
| `4000 0000 0000 9995` | Always declined |
| `4000 0000 0000 0341` | Attaches to Customer object |

[Full list of test cards](https://stripe.com/docs/testing#cards)

### Testing Automatic Tax

When testing in test mode, use these addresses:

- **Washington State** (has sales tax):
  - Address: `123 Main St`
  - City: `Seattle`
  - State: `WA`
  - ZIP: `98101`
  - Country: `US`

## Production Deployment

### 1. Switch to Live Mode

1. In Stripe Dashboard, toggle from **Test mode** to **Live mode**
2. Copy your **live** API keys
3. Update your production environment variables:
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   ```

### 2. Enable Payment Methods

1. Go to [Stripe Dashboard → Settings → Payment Methods](https://dashboard.stripe.com/settings/payment_methods)
2. Enable the payment methods you want to accept:
   - Cards (Visa, Mastercard, Amex, etc.)
   - Apple Pay
   - Google Pay
   - Link (Stripe's one-click checkout)

### 3. Configure Webhooks (Recommended)

For production, you should handle webhook events to update orders:

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Set the endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`

5. Create the webhook handler at `src/app/api/webhooks/stripe/route.ts` (not included in this setup)

### 4. Update Success URL

Update the `NEXT_PUBLIC_APP_URL` in your production environment to your actual domain:

```env
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

## Troubleshooting

### "Stripe has not been correctly initialized"

**Solution**: Make sure you've added `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` to your `.env.local` file and restarted your dev server.

### "Invalid API Key provided"

**Solution**: Double-check that your `STRIPE_SECRET_KEY` in `.env.local` matches your Stripe Dashboard key exactly.

### "Checkout session creation failed"

**Solution**: Check the console logs for detailed error messages. Common issues:
- Missing required fields in the request
- Invalid pricing (must be positive numbers)
- Network connectivity issues

### Cart not clearing after payment

**Solution**: The cart clears automatically when the success page detects a completed payment. Make sure:
1. The session ID is present in the URL
2. The checkout session status is `complete`
3. Payment status is `paid`

## Security Best Practices

1. ✅ **Never expose your secret key**: Only use `STRIPE_SECRET_KEY` in server-side code
2. ✅ **Use HTTPS in production**: Stripe requires HTTPS for live mode
3. ✅ **Validate webhook signatures**: Verify webhook events came from Stripe
4. ✅ **Implement rate limiting**: Prevent abuse of your checkout endpoint
5. ✅ **Log suspicious activity**: Monitor for unusual patterns

## Resources

- [Stripe Embedded Checkout Documentation](https://stripe.com/docs/payments/checkout/how-checkout-works)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Next.js Documentation](https://nextjs.org/docs)
- [Stripe Testing Guide](https://stripe.com/docs/testing)

## Support

- **Stripe Support**: [https://support.stripe.com/](https://support.stripe.com/)
- **Stripe Discord**: [https://stripe.com/discord](https://stripe.com/discord)
- **Documentation Issues**: Open an issue in this repository

---

**Created for Maison Miaro** | Last Updated: 2025-10-09
