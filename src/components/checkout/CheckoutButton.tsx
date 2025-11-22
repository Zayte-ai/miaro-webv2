import { useState } from "react";
import { useCartStore } from "@/store/cart";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getStripe } from "@/lib/stripe-client";

interface CheckoutButtonProps {
  customerId?: string;
  className?: string;
}

export function CheckoutButton({ customerId, className }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const cart = useCartStore();
  const router = useRouter();

  const handleCheckout = async () => {
    try {
      setLoading(true);

      const stripe = await getStripe();
      if (!stripe) throw new Error("Stripe failed to initialize");

      // Create checkout session
      const response = await fetch(
        "/api/payments/stripe/create-checkout-session",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            items: cart.cart.items.map((item) => ({
              productId: item.product.id,
              name: item.product.name,
              description: `${item.selectedSize.name || ""} ${
                item.selectedColor.name || ""
              }`.trim(),
              price: item.product.price,
              quantity: item.quantity,
              image: item.product.images[0],
            })),
            customerId,
            metadata: {
              cartId: "default",
            },
          }),
        }
      );

      const { sessionId } = await response.json();
      if (!sessionId) throw new Error("Failed to create checkout session");

      // Redirect to checkout using window.location
      window.location.href = `/checkout?session_id=${sessionId}`;
    } catch (error) {
      console.error("Checkout error:", error);
      // Show error notification
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading || cart.cart.items.length === 0}
      className={`w-full flex items-center justify-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-300 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        "Checkout"
      )}
    </button>
  );
}
