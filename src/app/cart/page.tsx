"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Toast } from "@/components/Toast";

export default function CartPage() {
  const router = useRouter();
  const { cart, updateQuantity, removeItem, clearCart } = useCartStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const handleQuantityChange = (
    productId: string,
    sizeId: string,
    colorId: string,
    newQuantity: number
  ) => {
    updateQuantity(productId, sizeId, colorId, newQuantity);
  };

  const handleRemoveItem = (
    productId: string,
    sizeId: string,
    colorId: string,
    productName: string
  ) => {
    setToast({ message: `${productName} removed from cart`, type: "success" });
    setTimeout(() => {
      removeItem(productId, sizeId, colorId);
    }, 50);
  };

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Navigate to checkout page which will handle Stripe integration
      router.push("/checkout");
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err instanceof Error ? err.message : "Failed to start checkout");
      setIsLoading(false);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Your cart is empty
          </h1>
          <p className="text-gray-600 mb-8">
            Start shopping to add items to your cart
          </p>
          <Link
            href="/shop"
            className="bg-gray-900 text-white px-8 py-3 rounded-md font-medium hover:bg-gray-800 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm">
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-semibold text-gray-900">
                Shopping Cart
              </h1>
              <button
                onClick={() => {
                  setToast({ message: "Cart cleared successfully", type: "success" });
                  setTimeout(() => {
                    clearCart();
                  }, 50);
                }}
                className="text-sm text-gray-500 hover:text-red-600 transition-colors"
              >
                Clear Cart
              </button>
            </div>
            <p className="text-gray-600 mt-1">
              {cart.itemCount} {cart.itemCount === 1 ? "item" : "items"} in your
              cart
            </p>
          </div>

          {/* Cart Items */}
          <div className="px-8 py-6">
            <div className="space-y-6">
              {cart.items.map((item) => (
                <div
                  key={`${item.product.id}-${item.selectedSize.id}-${item.selectedColor.id}`}
                  className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg"
                >
                  {/* Product Image */}
                  <div className="flex-shrink-0 w-20 h-20 relative">
                    <Image
                      src={item.product.images[0] || "/images/placeholder.svg"}
                      alt={item.product.name}
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>

                  {/* Product Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-gray-900">
                      {item.product.name}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span>Size: {item.selectedSize.value}</span>
                      <span>Color: {item.selectedColor.name}</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 mt-2">
                      {formatPrice(item.product.price)}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        handleQuantityChange(
                          item.product.id,
                          item.selectedSize.id,
                          item.selectedColor.id,
                          item.quantity - 1
                        )
                      }
                      className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-12 text-center font-medium">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        handleQuantityChange(
                          item.product.id,
                          item.selectedSize.id,
                          item.selectedColor.id,
                          item.quantity + 1
                        )
                      }
                      className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Item Total */}
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">
                      {formatPrice(item.product.price * item.quantity)}
                    </p>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() =>
                      handleRemoveItem(
                        item.product.id,
                        item.selectedSize.id,
                        item.selectedColor.id,
                        item.product.name
                      )
                    }
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Summary */}
          <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-medium text-gray-900">
                Subtotal
              </span>
              <span className="text-lg font-semibold text-gray-900">
                {formatPrice(cart.total)}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Shipping and taxes calculated at checkout
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/shop"
                className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-md font-medium text-center hover:bg-gray-50 transition-colors"
              >
                Continue Shopping
              </Link>
              <button
                onClick={handleCheckout}
                disabled={isLoading}
                className="flex-1 bg-gray-900 text-white px-6 py-3 rounded-md font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {isLoading ? "Processing..." : "Proceed to Checkout"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
