"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/user";
import AccountLayout from "@/components/account/AccountLayout";
import { Heart, Trash2 } from "lucide-react";
import Link from "next/link";

// Mock wishlist data
const mockWishlistItems = [
  {
    id: "1",
    name: "Premium Cotton T-Shirt",
    price: 49.99,
    image: "/images/products/tshirt-1.jpg",
    inStock: true,
  },
  {
    id: "3",
    name: "Casual Hoodie",
    price: 69.99,
    image: "/images/products/hoodie-1.jpg",
    inStock: true,
  },
  {
    id: "5",
    name: "Designer Jacket",
    price: 149.99,
    image: "/images/products/jacket-1.jpg",
    inStock: false,
  },
];

interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image: string;
  inStock: boolean;
}

export default function WishlistPage() {
  const { isAuthenticated } = useUserStore();
  const router = useRouter();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    // In a real app, this would be an API call
    const fetchWishlist = async () => {
      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800));
        setWishlistItems(mockWishlistItems);
      } catch (error) {
        console.error("Error fetching wishlist:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchWishlist();
  }, [isAuthenticated, router]);

  const removeFromWishlist = (itemId: string) => {
    setWishlistItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
          <p className="mt-2 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <AccountLayout>
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            My Wishlist
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Items you've saved for later
          </p>
        </div>

        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        ) : wishlistItems.length === 0 ? (
          <div className="p-6 text-center">
            <div className="mb-4">
              <Heart className="h-16 w-16 text-gray-300 mx-auto" />
            </div>
            <p className="text-gray-500 mb-4">Your wishlist is empty.</p>
            <Link
              href="/shop"
              className="inline-block bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {wishlistItems.map((item) => (
              <div key={item.id} className="p-6 flex items-center">
                <div className="flex-shrink-0 w-20 h-20 bg-gray-200 rounded-md overflow-hidden">
                  <div className="h-full w-full flex items-center justify-center text-xs text-gray-500">
                    Image
                  </div>
                </div>

                <div className="ml-4 flex-1">
                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                  <p className="text-gray-600 mt-1">${item.price.toFixed(2)}</p>
                  <p className="text-sm mt-1">
                    {item.inStock ? (
                      <span className="text-green-600">In Stock</span>
                    ) : (
                      <span className="text-red-600">Out of Stock</span>
                    )}
                  </p>
                </div>

                <div className="ml-4 flex-shrink-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                  <button
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      item.inStock
                        ? "bg-black text-white hover:bg-gray-800"
                        : "bg-gray-300 text-gray-500 cursor-not-allowed"
                    }`}
                    disabled={!item.inStock}
                  >
                    Add to Cart
                  </button>
                  <button
                    onClick={() => removeFromWishlist(item.id)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AccountLayout>
  );
}
