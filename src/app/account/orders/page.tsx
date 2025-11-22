"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/user";
import AccountLayout from "@/components/account/AccountLayout";
import Link from "next/link";

// Mock orders data - in a real app this would come from an API
const mockOrders = [
  {
    id: "ORD-1234-5678",
    date: "2025-08-01",
    status: "Delivered",
    total: 129.99,
    items: [
      {
        id: "1",
        name: "Premium Cotton T-Shirt",
        price: 49.99,
        quantity: 1,
        image: "/images/products/tshirt-1.jpg",
      },
      {
        id: "2",
        name: "Designer Jeans",
        price: 79.99,
        quantity: 1,
        image: "/images/products/jeans-1.jpg",
      },
    ],
  },
  {
    id: "ORD-2345-6789",
    date: "2025-07-15",
    status: "Processing",
    total: 69.99,
    items: [
      {
        id: "3",
        name: "Casual Hoodie",
        price: 69.99,
        quantity: 1,
        image: "/images/products/hoodie-1.jpg",
      },
    ],
  },
];

export default function OrdersPage() {
  const { isAuthenticated } = useUserStore();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }

    // In a real app, this would be an API call
    const fetchOrders = async () => {
      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800));
        setOrders(mockOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [isAuthenticated, router]);

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
            Order History
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            View and track your orders
          </p>
        </div>

        {isLoading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500 mb-4">
              You haven't placed any orders yet.
            </p>
            <Link
              href="/shop"
              className="inline-block bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {orders.map((order) => (
              <div key={order.id} className="p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      Order #{order.id}
                    </h4>
                    <p className="text-sm text-gray-500">
                      Placed on {new Date(order.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="mt-2 sm:mt-0">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === "Delivered"
                          ? "bg-green-100 text-green-800"
                          : order.status === "Processing"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>

                <div className="mt-6 border-t border-b border-gray-200 py-4 divide-y divide-gray-200">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="py-4 flex">
                      <div className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-md overflow-hidden">
                        <div className="h-full w-full flex items-center justify-center text-xs text-gray-500">
                          Image
                        </div>
                      </div>
                      <div className="ml-4 flex-1 flex flex-col">
                        <div>
                          <div className="flex justify-between text-base font-medium text-gray-900">
                            <h5>{item.name}</h5>
                            <p className="ml-4">${item.price.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="flex-1 flex items-end justify-between text-sm">
                          <p className="text-gray-500">Qty {item.quantity}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex justify-between">
                  <p className="text-sm font-medium text-gray-900">
                    Total: ${order.total.toFixed(2)}
                  </p>
                  <div className="flex space-x-3">
                    <Link
                      href={`/account/orders/${order.id}`}
                      className="text-sm font-medium text-black hover:text-gray-700"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AccountLayout>
  );
}
