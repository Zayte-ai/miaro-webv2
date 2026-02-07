import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import type Stripe from 'stripe';

/**
 * PRICE MAP - Server-side mapping of productId to Stripe price_id
 * This ensures prices NEVER come from the frontend and cannot be manipulated
 * 
 * To add products:
 * 1. Create a product in Stripe Dashboard
 * 2. Create a price for that product
 * 3. Add the mapping here: 'your-product-id': 'price_xxxxx'
 */
const PRICE_MAP: Record<string, string> = {
  // MaisonMiaro Products - Stripe Price IDs (LIVE MODE)
  'cmkt16xtg000awnj81l64bfex': 'price_1SwrmnC73ocS8esoPWpYgiHD', // Product "test" - $2 CAD
  'cmkq72xjp000mwnqsmis7ocdv': 'price_1SwmF9C73ocS8esoLxF1Fv3w', // Default price (à vérifier)
  
  // Add more product mappings here
  // Format: 'productId': 'Stripe price_id'
  // Get product IDs from your database, price IDs from Stripe Dashboard
};

export async function POST(request: NextRequest) {
  try {
    // DEBUG: Log Stripe configuration
    const stripeKey = process.env.STRIPE_SECRET_KEY || '';
    console.log('🔐 DEBUG - Stripe Secret Key:', stripeKey.substring(0, 20) + '...' + stripeKey.substring(stripeKey.length - 10));
    console.log('🗺️  DEBUG - PRICE_MAP:', PRICE_MAP);
    
    const {
      items,
      customerId,
      metadata = {},
    } = await request.json();

    if (!items?.length) {
      return NextResponse.json(
        { error: 'No items provided' },
        { status: 400 }
      );
    }

    // CRITICAL: Server-side stock validation
    console.log('📦 Validating stock for', items.length, 'items...');
    
    for (const item of items) {
      if (!item.productId) {
        return NextResponse.json(
          { error: 'Product ID is required for all items' },
          { status: 400 }
        );
      }

      // Fetch product with inventory and variants
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          inventory: true,
          variants: {
            include: {
              inventory: true,
            },
          },
        },
      });

      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.productId}` },
          { status: 404 }
        );
      }

      let availableStock = 0;
      let stockSource = 'product';

      // If size is selected, check variant-level inventory
      if (item.sizeId && product.variants && product.variants.length > 0) {
        // sizeId format is "optionId:value" (e.g., "cmkt16xst0002wnj8awo48l64:M")
        const sizeValue = item.sizeId.split(':')[1];
        
        const matchingVariant = product.variants.find(v => v.name === sizeValue);
        
        if (matchingVariant) {
          availableStock = matchingVariant.inventory?.quantity ?? 0;
          stockSource = 'variant';
          console.log(`  → Using variant stock for ${sizeValue}:`, availableStock);
        } else {
          // Variant not found, use product-level inventory as fallback
          availableStock = product.inventory?.quantity ?? 0;
          console.log(`  → Variant ${sizeValue} not found, using product stock:`, availableStock);
        }
      } else {
        // No size selected, use product-level inventory
        availableStock = product.inventory?.quantity ?? 0;
        console.log(`  → Using product-level stock:`, availableStock);
      }

      // Reject if insufficient stock
      if (availableStock < item.quantity) {
        const sizeLabel = item.sizeId ? ` in size ${item.sizeId.split(':')[1]}` : '';
        return NextResponse.json(
          { 
            error: `Insufficient stock for ${product.name}${sizeLabel}. Only ${availableStock} available.`,
            code: 'INSUFFICIENT_STOCK',
            productId: item.productId,
            availableStock,
            requestedQuantity: item.quantity,
          },
          { status: 400 }
        );
      }

      console.log(`✅ Stock validated for ${product.name}: ${item.quantity}/${availableStock} (${stockSource})`);
    }

    // Validate and map products to Stripe price IDs (SERVER-SIDE ONLY)
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
    
    for (const item of items) {
      // Fetch product from database to get stripePriceId
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { id: true, name: true, stripePriceId: true, price: true },
      });

      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found` },
          { status: 404 }
        );
      }

      // Use stripePriceId from database (preferred) or fallback to PRICE_MAP
      let priceId = product.stripePriceId;
      
      if (!priceId) {
        // Fallback to PRICE_MAP for backward compatibility
        priceId = PRICE_MAP[item.productId];
      }

      // Security: Reject if no price ID found
      if (!priceId) {
        console.error(`No Stripe price found for product: ${item.productId} (${product.name})`);
        return NextResponse.json(
          { 
            error: `Product "${product.name}" is not configured for checkout. Please add a Stripe Price ID in the admin panel or contact support.`,
            code: 'MISSING_STRIPE_PRICE_ID',
            productId: item.productId,
          },
          { status: 400 }
        );
      }

      // Use Stripe price_id (NOT price_data)
      console.log(`💰 DEBUG - Using price_id: ${priceId} for product: ${product.name} (${item.productId})`);
      lineItems.push({
        price: priceId,
        quantity: item.quantity || 1,
      });
    }

    // Determine base URL with fallback for local development
    const baseUrl =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (process.env.NODE_ENV === 'production'
        ? 'https://maisonmiaro.com'
        : 'http://localhost:3000');

    console.log('Stripe checkout - BASE_URL env:', process.env.NEXT_PUBLIC_BASE_URL);
    console.log('Stripe checkout - NODE_ENV:', process.env.NODE_ENV);
    console.log('Stripe checkout - Final baseUrl:', baseUrl);

    // Validate that baseUrl is absolute
    if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
      console.error('Invalid base URL:', baseUrl);
      return NextResponse.json(
        { error: 'Invalid server configuration: BASE_URL must be absolute' },
        { status: 500 }
      );
    }

    // Create or retrieve Stripe customer
    const customer = customerId ? { customer: customerId } : {};

    // Create Checkout Session with secure price mapping
    console.log('🛒 DEBUG - Creating checkout session with line items:', JSON.stringify(lineItems, null, 2));
    
    // Payment methods disponibles:
    // - 'card': Cartes bancaires (Visa, Mastercard, Amex, etc.)
    // NOTE: Pour activer PayPal, allez sur https://dashboard.stripe.com/settings/payment_methods
    const session = await stripe.checkout.sessions.create({
      ...customer,
      
      // Méthodes de paiement acceptées
      payment_method_types: ['card'], // Ajoutez 'paypal' une fois activé dans Stripe
      
      mode: 'payment',
      line_items: lineItems,
      
      // URLs de redirection
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout`,
      
      // Collection de l'adresse de facturation
      billing_address_collection: 'required',
      
      // Collection de l'adresse de livraison
      shipping_address_collection: {
        allowed_countries: ['CA', 'US', 'FR', 'BE', 'CH', 'LU', 'MC', 'GB', 'DE', 'IT', 'ES', 'PT', 'NL'],
      },
      
      // Options de livraison (optionnel)
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 0, // Livraison gratuite
              currency: 'cad',
            },
            display_name: 'Livraison gratuite',
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 5,
              },
              maximum: {
                unit: 'business_day',
                value: 10,
              },
            },
          },
        },
      ],
      
      // Taxes automatiques (si configuré dans Stripe)
      automatic_tax: {
        enabled: true,
      },
      
      // Métadonnées personnalisées
      metadata: {
        ...metadata,
        orderSource: 'web',
      },
    });

    console.log('✅ Session créée:', session.id);
    console.log('� URL:', session.url);

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error('Stripe checkout session creation failed:', error);
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'Failed to create checkout session' },
      { status: 400 }
    );
  }
}

// Get session status
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return NextResponse.json({
      status: session.status,
      customerEmail: session.customer_details?.email,
      paymentStatus: session.payment_status,
    });
  } catch (error) {
    console.error('Stripe session retrieval failed:', error);
    const err = error as Error;
    return NextResponse.json(
      { error: err.message || 'Failed to retrieve session' },
      { status: 400 }
    );
  }
}
