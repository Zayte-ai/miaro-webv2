"use client";

import { useEffect, useMemo, useState } from "react";
import {
  TrendingUp,
  DollarSign,
  Users,
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  RefreshCw,
  Download,
  Target,
} from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";

interface AnalyticsData {
  revenue: {
    current: number;
    previous: number;
    change: number;
  };
  orders: {
    current: number;
    previous: number;
    change: number;
  };
  customers: {
    current: number;
    previous: number;
    change: number;
  };
  averageOrder: {
    current: number;
    previous: number;
    change: number;
  };
  conversionRate: {
    current: number;
    previous: number;
    change: number;
  };
}

interface SalesDataPoint {
  date: string;
  sales: number;
  orders: number;
}

interface TopProduct {
  id: string;
  name: string;
  sales: number;
  revenue: number;
  image?: string;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
  revenue: number;
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState("7d");
  const [loading, setLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null
  );
  const [salesData, setSalesData] = useState<SalesDataPoint[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, salesRes, productsRes, categoriesRes] =
        await Promise.all([
          fetch(`/api/admin/analytics/metrics?range=${dateRange}`),
          fetch(`/api/admin/analytics/sales?range=${dateRange}`),
          fetch(`/api/admin/analytics/top-products?range=${dateRange}`),
          fetch(`/api/admin/analytics/categories?range=${dateRange}`),
        ]);

      if (analyticsRes.ok) {
        const data = (await analyticsRes.json()) as AnalyticsData;
        setAnalyticsData(data);
      }

      if (salesRes.ok) {
        const data = (await salesRes.json()) as SalesDataPoint[];
        setSalesData(data);
      }

      if (productsRes.ok) {
        const data = (await productsRes.json()) as TopProduct[];
        setTopProducts(data);
      }

      if (categoriesRes.ok) {
        const data = (await categoriesRes.json()) as CategoryData[];
        setCategoryData(data);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch analytics data", error);
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    setAnalyticsData({
      revenue: {
        current: 15420.5,
        previous: 12850.3,
        change: 20,
      },
      orders: {
        current: 89,
        previous: 76,
        change: 17.1,
      },
      customers: {
        current: 45,
        previous: 38,
        change: 18.4,
      },
      averageOrder: {
        current: 173.25,
        previous: 169.08,
        change: 2.5,
      },
      conversionRate: {
        current: 3.2,
        previous: 2.8,
        change: 14.3,
      },
    });

    setSalesData([
      { date: "2024-07-01", sales: 1200, orders: 8 },
      { date: "2024-07-02", sales: 1850, orders: 12 },
      { date: "2024-07-03", sales: 1100, orders: 7 },
      { date: "2024-07-04", sales: 2200, orders: 15 },
      { date: "2024-07-05", sales: 1950, orders: 11 },
      { date: "2024-07-06", sales: 2400, orders: 16 },
      { date: "2024-07-07", sales: 2100, orders: 13 },
    ]);

    setTopProducts([
      { id: "1", name: "Classic White Tee", sales: 45, revenue: 1349.55 },
      { id: "2", name: "Slim Fit Jeans", sales: 32, revenue: 4159.68 },
      { id: "3", name: "Navy Hoodie", sales: 28, revenue: 2239.72 },
      { id: "4", name: "Leather Jacket", sales: 15, revenue: 2999.85 },
      { id: "5", name: "Basic Black Tee", sales: 38, revenue: 1139.62 },
    ]);

    setCategoryData([
      { name: "T-Shirts", value: 35, color: "#3B82F6", revenue: 5240.3 },
      { name: "Jeans", value: 25, color: "#10B981", revenue: 6789.45 },
      { name: "Hoodies", value: 20, color: "#F59E0B", revenue: 3456.78 },
      { name: "Jackets", value: 15, color: "#EF4444", revenue: 4567.89 },
      { name: "Accessories", value: 5, color: "#8B5CF6", revenue: 1234.56 },
    ]);
  };

  useEffect(() => {
    fetchAnalyticsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange]);

  const exportData = async () => {
    try {
      const response = await fetch(
        `/api/admin/analytics/export?range=${dateRange}`
      );
      if (!response.ok) {
        return;
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.style.display = "none";
      anchor.href = url;
      anchor.download = `analytics-${dateRange}-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to export analytics data", error);
    }
  };

  const formatChange = (change: number) => {
    const isPositive = change >= 0;
    const Icon = isPositive ? ArrowUpRight : ArrowDownRight;

    return (
      <span
        className={`flex items-center ${
          isPositive ? "text-green-600" : "text-red-600"
        }`}
      >
        <Icon className="mr-1 h-4 w-4" />
        {Math.abs(change).toFixed(1)}%
      </span>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const maxSales = useMemo(() => {
    return salesData.reduce((max, item) => Math.max(max, item.sales), 0);
  }, [salesData]);

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center">
              <h2 className="text-2xl font-semibold text-gray-900">
                Analytics
              </h2>
              <span className="ml-4 text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={dateRange}
                onChange={(event) => setDateRange(event.target.value)}
                className="rounded-md border border-gray-300 px-4 py-2 focus:border-black focus:ring-black"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <button
                onClick={fetchAnalyticsData}
                disabled={loading}
                className="flex items-center rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
              <button
                onClick={exportData}
                className="flex items-center rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-gray-100 p-6">
          {loading && (
            <div className="flex items-center justify-center py-8 text-gray-600">
              <RefreshCw className="mr-2 h-8 w-8 animate-spin" />
              Loading analytics…
            </div>
          )}

          {!loading && analyticsData && (
            <>
              <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-lg bg-white p-6 shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Revenue
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {formatCurrency(analyticsData.revenue.current)}
                      </p>
                      <div className="mt-2">
                        {formatChange(analyticsData.revenue.change)}
                      </div>
                    </div>
                    <DollarSign className="h-8 w-8 text-green-600" />
                  </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Total Orders
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {analyticsData.orders.current.toLocaleString()}
                      </p>
                      <div className="mt-2">
                        {formatChange(analyticsData.orders.change)}
                      </div>
                    </div>
                    <ShoppingCart className="h-8 w-8 text-blue-600" />
                  </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        New Customers
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {analyticsData.customers.current.toLocaleString()}
                      </p>
                      <div className="mt-2">
                        {formatChange(analyticsData.customers.change)}
                      </div>
                    </div>
                    <Users className="h-8 w-8 text-purple-600" />
                  </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Average Order
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {formatCurrency(analyticsData.averageOrder.current)}
                      </p>
                      <div className="mt-2">
                        {formatChange(analyticsData.averageOrder.change)}
                      </div>
                    </div>
                    <TrendingUp className="h-8 w-8 text-yellow-600" />
                  </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        Conversion Rate
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {analyticsData.conversionRate.current.toFixed(1)}%
                      </p>
                      <div className="mt-2">
                        {formatChange(analyticsData.conversionRate.change)}
                      </div>
                    </div>
                    <Target className="h-8 w-8 text-indigo-600" />
                  </div>
                </div>
              </div>

              <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-2">
                <div className="rounded-lg bg-white shadow">
                  <div className="border-b px-6 py-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Sales Trend
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="flex h-64 items-end justify-between space-x-2">
                      {salesData.map((day) => {
                        const height = maxSales
                          ? (day.sales / maxSales) * 100
                          : 0;
                        return (
                          <div
                            key={day.date}
                            className="group flex flex-1 cursor-pointer flex-col items-center"
                          >
                            <div className="mb-2 text-xs text-gray-600 opacity-0 transition-opacity group-hover:opacity-100">
                              {formatCurrency(day.sales)}
                            </div>
                            <div
                              className="w-full rounded-t bg-blue-500 transition-colors group-hover:bg-blue-600"
                              style={{ height: `${height}%` }}
                              title={`${formatDate(day.date)}: ${formatCurrency(
                                day.sales
                              )} (${day.orders} orders)`}
                            />
                            <div className="mt-2 text-xs text-gray-500">
                              {formatDate(day.date)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-white shadow">
                  <div className="border-b px-6 py-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Sales by Category
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {categoryData.map((category) => (
                        <div
                          key={category.name}
                          className="flex items-center justify-between rounded-lg p-3 transition-colors hover:bg-gray-50"
                        >
                          <div className="flex items-center">
                            <div
                              className="mr-3 h-4 w-4 rounded"
                              style={{ backgroundColor: category.color }}
                            />
                            <div>
                              <span className="text-sm font-medium text-gray-900">
                                {category.name}
                              </span>
                              <div className="text-xs text-gray-500">
                                {formatCurrency(category.revenue)} revenue
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="mr-3 h-2 w-32 rounded-full bg-gray-200">
                              <div
                                className="h-2 rounded-full"
                                style={{
                                  width: `${category.value}%`,
                                  backgroundColor: category.color,
                                }}
                              />
                            </div>
                            <span className="w-8 text-sm text-gray-600">
                              {category.value}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg bg-white shadow">
                <div className="border-b px-6 py-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Top Selling Products
                  </h3>
                </div>
                <div className="p-6">
                  <div className="overflow-x-auto">
                    <table className="min-w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                            Product
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                            Units Sold
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                            Revenue
                          </th>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                            Avg. Price
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {topProducts.map((product) => (
                          <tr
                            key={product.id}
                            className="border-b last:border-b-0 transition-colors hover:bg-gray-50"
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center">
                                <div className="mr-3 flex h-8 w-8 items-center justify-center rounded bg-gray-200">
                                  <Package className="h-4 w-4 text-gray-400" />
                                </div>
                                <span className="font-medium text-gray-900">
                                  {product.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {product.sales.toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {formatCurrency(product.revenue)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {formatCurrency(product.revenue / product.sales)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
