"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Package,
  Search,
  Eye,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
} from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useAdminStore } from "@/store/admin";

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  price: number;
  totalPrice: number;
  product: {
    id: string;
    name: string;
    images: Array<{ url: string }>;
  };
  productVariant: any;
}

interface Order {
  id: string;
  orderNumber: string;
  email: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  } | null;
  items: OrderItem[];
  subtotal: number;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  trackingNumber: string | null;
  createdAt: string;
  shippingAddress: any;
  billingAddress: any;
}

export default function OrdersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { adminToken } = useAdminStore();

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, searchTerm]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (statusFilter !== "all") {
        params.append("status", statusFilter.toUpperCase());
      }

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(`/api/admin/orders?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();
      setOrders(data.orders || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching orders:", err);
      setError("Failed to load orders");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          orderId,
          status: newStatus.toUpperCase(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order");
      }

      // Refresh orders
      fetchOrders();
    } catch (err) {
      console.error("Error updating order:", err);
      alert("Failed to update order status");
    }
  };

  const filteredOrders = useMemo(() => {
    return orders;
  }, [orders]);

  const getStatusChip = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case "pending":
        return { icon: Clock, className: "bg-yellow-100 text-yellow-800" };
      case "confirmed":
      case "processing":
        return { icon: AlertCircle, className: "bg-blue-100 text-blue-800" };
      case "shipped":
        return { icon: Truck, className: "bg-purple-100 text-purple-800" };
      case "delivered":
        return { icon: CheckCircle, className: "bg-green-100 text-green-800" };
      case "canceled":
      case "cancelled":
        return { icon: XCircle, className: "bg-red-100 text-red-800" };
      case "refunded":
        return { icon: XCircle, className: "bg-orange-100 text-orange-800" };
      default:
        return { icon: Clock, className: "bg-gray-100 text-gray-800" };
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-2xl font-semibold text-gray-900">Orders</h2>
            <div className="text-sm text-gray-600">
              {filteredOrders.length} orders
            </div>
          </div>
        </header>

        <div className="border-b bg-white px-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search orders or customers..."
                className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 focus:border-black focus:outline-none focus:ring-black"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as typeof statusFilter)
              }
              className="rounded-md border border-gray-300 px-4 py-2 focus:border-black focus:outline-none focus:ring-black"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-white">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading orders...</div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-red-500">{error}</div>
            </div>
          ) : (
            <>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Date
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredOrders.map((order) => {
                    const statusChip = getStatusChip(order.status);
                    const customerName = order.user
                      ? `${order.user.firstName} ${order.user.lastName}`
                      : "Guest";

                    return (
                      <tr
                        key={order.id}
                        className="transition-colors hover:bg-gray-50"
                      >
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {order.orderNumber}
                          </div>
                          {order.trackingNumber && (
                            <div className="text-sm text-gray-500">
                              Tracking: {order.trackingNumber}
                            </div>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {customerName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="space-y-1">
                            {order.items.map((item) => (
                              <div key={item.id}>
                                {item.quantity}× {item.product.name}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          ${order.totalAmount.toFixed(2)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusChip.className}`}
                          >
                            <statusChip.icon className="mr-1 h-4 w-4" />
                            <span className="capitalize">
                              {order.status.toLowerCase()}
                            </span>
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              className="text-blue-600 hover:text-blue-900"
                              title="View order"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <select
                              value={order.status}
                              onChange={(event) =>
                                updateOrderStatus(order.id, event.target.value)
                              }
                              className="rounded border border-gray-300 px-2 py-1 text-sm"
                            >
                              <option value="PENDING">Pending</option>
                              <option value="CONFIRMED">Confirmed</option>
                              <option value="PROCESSING">Processing</option>
                              <option value="SHIPPED">Shipped</option>
                              <option value="DELIVERED">Delivered</option>
                              <option value="CANCELED">Canceled</option>
                              <option value="REFUNDED">Refunded</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredOrders.length === 0 && (
                <div className="py-12 text-center">
                  <Package className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No orders found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || statusFilter !== "all"
                      ? "Try adjusting your search or filters."
                      : "No orders have been placed yet."}
                  </p>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
