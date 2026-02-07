"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  TrendingUp,
  DollarSign,
  Eye,
} from "lucide-react";
import { useAdminStore } from "@/store/admin";

interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  newCustomers: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customer: string;
  email: string;
  total: number;
  status: string;
  items: Array<{ productName: string; quantity: number }>;
  createdAt: string;
}

interface LowStockProduct {
  id: string;
  name: string;
  sku: string | null;
  stock: number;
  lowStockThreshold: number;
  price: number;
  image: string | undefined;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { adminUser, adminToken, logoutAdmin } = useAdminStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    newCustomers: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/dashboard/stats", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Failed to fetch dashboard stats (${response.status})`;
        console.error("[DASHBOARD] API Error:", errorMessage, errorData);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setStats(data.stats);
      setRecentOrders(data.recentOrders);
      setLowStockProducts(data.lowStockProducts);
    } catch (error) {
      console.error("[DASHBOARD] Error fetching dashboard data:", error);
      setToast({ 
        message: error instanceof Error ? error.message : "Failed to load dashboard data", 
        type: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  const displayName = useMemo(() => {
    if (!adminUser) {
      return "Admin";
    }
    const name = `${adminUser.firstName ?? ""} ${
      adminUser.lastName ?? ""
    }`.trim();
    return name || adminUser.email;
  }, [adminUser]);

  const sidebarItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      href: "/admin/dashboard",
      active: true,
    },
    { icon: Package, label: "Products", href: "/admin/dashboard/products" },
    { icon: ShoppingCart, label: "Orders", href: "/admin/dashboard/orders" },
    { icon: Users, label: "Customers", href: "/admin/dashboard/customers" },
    { icon: BarChart3, label: "Analytics", href: "/admin/dashboard/analytics" },
    { icon: Settings, label: "Settings", href: "/admin/dashboard/settings" },
  ];

  const handleLogout = () => {
    logoutAdmin();
    router.push("/admin");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white shadow-lg transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b px-6">
          <h1 className="text-xl font-bold text-gray-900">MaisonMiaro Admin</h1>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-6">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-6 py-3 text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 ${
                item.active
                  ? "border-r-2 border-black bg-gray-100 text-gray-900"
                  : ""
              }`}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-6">
          <div className="mb-4 text-sm text-gray-600">
            Welcome, {displayName}
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center rounded-md px-4 py-2 text-gray-700 transition-colors hover:bg-gray-100"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Logout
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden lg:ml-0">
        <header className="border-b bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="mr-4 lg:hidden"
              >
                <Menu className="h-6 w-6" />
              </button>
              <h2 className="text-2xl font-semibold text-gray-900">
                Dashboard
              </h2>
            </div>
            <div className="text-sm text-gray-600">Welcome, {displayName}</div>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading dashboard...</div>
            </div>
          ) : (
            <>
              <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-white p-6 shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Products
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {stats.totalProducts}
                      </p>
                    </div>
                    <Package className="h-8 w-8 text-blue-600" />
                  </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Orders
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {stats.totalOrders}
                      </p>
                    </div>
                    <ShoppingCart className="h-8 w-8 text-green-600" />
                  </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Revenue</p>
                      <p className="text-3xl font-bold text-gray-900">
                        ${stats.totalRevenue.toFixed(2)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-yellow-600" />
                  </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        New Customers (30d)
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {stats.newCustomers}
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </div>
            </>
          )}

          {!loading && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="rounded-lg bg-white shadow">
                <div className="border-b px-6 py-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Recent Orders
                  </h3>
                </div>
                <div className="p-6">
                  {recentOrders.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">
                      No orders yet
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {recentOrders.map((order) => (
                          <div
                            key={order.id}
                            className="flex items-center justify-between"
                          >
                            <div>
                              <p className="font-medium text-gray-900">
                                {order.customer}
                              </p>
                              <p className="text-sm text-gray-600">
                                Order #{order.orderNumber}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">
                                ${order.total.toFixed(2)}
                              </p>
                              <p
                                className={`text-sm ${
                                  order.status === "DELIVERED"
                                    ? "text-green-600"
                                    : order.status === "SHIPPED"
                                    ? "text-blue-600"
                                    : "text-yellow-600"
                                }`}
                              >
                                {order.status}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-6">
                        <Link
                          href="/admin/dashboard/orders"
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          View all orders →
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="rounded-lg bg-white shadow">
                <div className="border-b px-6 py-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Low Stock Products
                  </h3>
                </div>
                <div className="p-6">
                  {lowStockProducts.length === 0 ? (
                    <div className="py-8 text-center text-gray-500">
                      No low stock products
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                        {lowStockProducts.map((product) => (
                          <div
                            key={product.id}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center">
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="mr-3 h-10 w-10 rounded-md object-cover"
                                />
                              ) : (
                                <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-md bg-gray-200">
                                  <Package className="h-5 w-5 text-gray-400" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-gray-900">
                                  {product.name}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {product.sku || "No SKU"}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium text-red-600">
                                {product.stock} left
                              </p>
                              <Link
                                href={`/admin/dashboard/products`}
                                className="text-sm text-blue-600 hover:text-blue-800"
                              >
                                <Eye className="mr-1 inline h-4 w-4" />
                                Manage
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-6">
                        <Link
                          href="/admin/dashboard/products"
                          className="text-sm font-medium text-blue-600 hover:text-blue-800"
                        >
                          Manage inventory →
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 rounded-lg bg-white shadow">
            <div className="border-b px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Quick Actions
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Link
                  href="/admin/dashboard/products/new"
                  className="flex items-center justify-center rounded-md border border-gray-300 px-4 py-3 hover:bg-gray-50"
                >
                  <Package className="mr-2 h-5 w-5" />
                  Add New Product
                </Link>
                <Link
                  href="/admin/dashboard/orders"
                  className="flex items-center justify-center rounded-md border border-gray-300 px-4 py-3 hover:bg-gray-50"
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  View Orders
                </Link>
                <Link
                  href="/admin/dashboard/analytics"
                  className="flex items-center justify-center rounded-md border border-gray-300 px-4 py-3 hover:bg-gray-50"
                >
                  <BarChart3 className="mr-2 h-5 w-5" />
                  View Analytics
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>

      {sidebarOpen && (
        <button
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close sidebar"
        />
      )}
    </div>
  );
}
