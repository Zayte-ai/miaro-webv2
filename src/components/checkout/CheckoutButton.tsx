"use client";

import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart";
export function CheckoutButton() {
  const router = useRouter();
  const cart = useCartStore();
  return (
    <button
      onClick={() => router.push("/checkout")}
      disabled={cart.cart.items.length === 0}
      className="w-full px-6 py-3 rounded-md bg-indigo-600 text-white disabled:bg-gray-300"
    >
      Checkout
    </button>
  );
}
