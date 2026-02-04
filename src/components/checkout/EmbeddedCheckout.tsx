"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/store/cart";
import { loadStripe } from "@stripe/stripe-js";
import {
  EmbeddedCheckoutProvider,
  EmbeddedCheckout,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export default function CheckoutPage() {
  const cart = useCartStore();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createSession = async () => {
      try {
        const response = await fetch(
          "/api/payments/stripe/create-checkout-session",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              items: cart.cart.items.map((item) => ({
                productId: item.product.id,
                quantity: item.quantity,
              })),
              metadata: {
                cartId: "default",
                items: JSON.stringify(
                  cart.cart.items.map((item) => ({
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
        if (!response.ok) throw new Error(data.error);

        setClientSecret(data.clientSecret);
      } catch (err) {
        setError("Unable to load checkout");
      }
    };

    createSession();
  }, [cart]);

  if (error) return <p>{error}</p>;
  if (!clientSecret) return <p>Loading checkout...</p>;

  return (
    <EmbeddedCheckoutProvider
      stripe={stripePromise}
      options={{ clientSecret }}
    >
      <EmbeddedCheckout />
    </EmbeddedCheckoutProvider>
  );
}
