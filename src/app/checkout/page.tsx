"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export default function CheckoutPage() {
  const router = useRouter();
  const { cart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to cart if empty
  useEffect(() => {
    if (mounted && cart.items.length === 0) {
      router.push("/cart");
    }
  }, [mounted, cart.items.length, router]);

  // Create Stripe Checkout Session
  useEffect(() => {
    if (!mounted || cart.items.length === 0) return;

    const createSession = async () => {
      try {
        const response = await fetch(
          "/api/payments/stripe/create-checkout-session",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: cart.items.map((item) => ({
                productId: item.product.id,
                sizeId: item.selectedSize?.id,
                colorId: item.selectedColor?.id,
                quantity: item.quantity,
              })),
              metadata: {
                cartId: "default",
                items: JSON.stringify(
                  cart.items.map((item) => ({
                    productId: item.product.id,
                    name: item.product.name,
                    size: item.selectedSize?.value,
                    color: item.selectedColor?.name,
                    quantity: item.quantity,
                  }))
                ),
              },
            }),
          }
        );

        const data = await response.json();
        if (!response.ok) {
          // Handle stock validation errors specifically
          if (data.code === 'INSUFFICIENT_STOCK') {
            throw new Error(data.error || `Insufficient stock. Please update your cart.`);
          }
          throw new Error(data.error || "Failed to create checkout session");
        }

        setClientSecret(data.clientSecret);
      } catch (err) {
        console.error("Checkout error:", err);
        setError(err instanceof Error ? err.message : "Unable to load checkout");
      }
    };

    createSession();
  }, [mounted, cart.items]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Your cart is empty
          </h1>
          <p className="text-gray-600 mb-8">
            Add items to your cart before checking out
          </p>
          <Link
            href="/shop"
            className="bg-gray-900 text-white px-8 py-3 rounded-md font-medium hover:bg-gray-800 transition-colors inline-block"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Checkout Error
          </h1>
          <p className="text-red-600 mb-8">{error}</p>
          <Link
            href="/cart"
            className="bg-gray-900 text-white px-8 py-3 rounded-md font-medium hover:bg-gray-800 transition-colors inline-block"
          >
            Return to Cart
          </Link>
        </div>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparing checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
          <p className="text-gray-600">
            Complete your purchase securely with Stripe
          </p>
        </div>

        {/* Stripe Embedded Checkout */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <EmbeddedCheckoutProvider
            stripe={stripePromise}
            options={{ clientSecret }}
          >
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      </div>
    </div>
  );
}

