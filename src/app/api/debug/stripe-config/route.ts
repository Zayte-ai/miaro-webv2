import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint de debug pour vérifier la configuration Stripe
 */
export async function GET(request: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY || '';
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';
  
  return NextResponse.json({
    hasStripeKey: !!stripeKey,
    stripeKeyPrefix: stripeKey.substring(0, 20) + '...',
    stripeKeySuffix: '...' + stripeKey.substring(stripeKey.length - 10),
    hasPublishableKey: !!publishableKey,
    publishableKeyPrefix: publishableKey.substring(0, 20) + '...',
    isLiveMode: stripeKey.startsWith('sk_live_'),
    nodeEnv: process.env.NODE_ENV,
    allEnvKeys: Object.keys(process.env).filter(k => k.includes('STRIPE')),
  });
}
