"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { CheckoutForm } from "@/components/checkout/EmbeddedCheckout";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to cart if empty
  useEffect(() => {
    if (mounted && cart.items.length === 0) {
      router.push("/cart");
    }
  }, [mounted, cart.items.length, router]);

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

  // Transform cart items to checkout format
  const checkoutItems = cart.items.map((item) => ({
    productId: item.product.id,
    variantId: `${item.selectedSize.id}-${item.selectedColor.id}`,
    name: item.product.name,
    description: `Size: ${item.selectedSize.value}, Color: ${item.selectedColor.name}`,
    price: item.product.price,
    quantity: item.quantity,
    image: item.product.images[0],
    size: item.selectedSize.value,
    color: item.selectedColor.name,
  }));

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

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Order Summary
          </h2>
          <div className="space-y-3">
            {cart.items.map((item) => (
              <div
                key={`${item.product.id}-${item.selectedSize.id}-${item.selectedColor.id}`}
                className="flex justify-between text-sm"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.product.name}</p>
                  <p className="text-gray-600">
                    {item.selectedSize.value} / {item.selectedColor.name} × {item.quantity}
                  </p>
                </div>
                <p className="font-medium text-gray-900">
                  ${(item.product.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
            <div className="border-t border-gray-200 pt-3 mt-3">
              <div className="flex justify-between font-semibold text-gray-900">
                <span>Subtotal</span>
                <span>${cart.total.toFixed(2)}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Shipping and taxes calculated at checkout
              </p>
            </div>
          </div>
        </div>

        {/* Embedded Checkout */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <CheckoutForm
            items={checkoutItems}
            metadata={{
              cartId: `cart_${Date.now()}`,
              itemCount: cart.itemCount.toString(),
            }}
          />
        </div>
      </div>
    </div>
  );
}
