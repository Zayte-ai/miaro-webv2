"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Users,
  ShoppingCart,
  BarChart3,
  Search,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useAdminStore } from "@/store/admin";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  totalOrders: number;
  totalSpent: number;
  lastOrder: string | null;
  createdAt: string;
  status: "active" | "inactive";
}

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [sortBy, setSortBy] = useState("name");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { adminToken } = useAdminStore();

  useEffect(() => {
    fetchCustomers();
  }, [statusFilter, searchTerm]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();

      if (statusFilter !== "all") {
        params.append("isActive", statusFilter === "active" ? "true" : "false");
      }

      if (searchTerm) {
        params.append("search", searchTerm);
      }

      const response = await fetch(`/api/admin/customers?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }

      const data = await response.json();
      setCustomers(data.customers || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setError("Failed to load customers");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    return [...customers].sort((a, b) => {
      switch (sortBy) {
        case "totalSpent":
          return b.totalSpent - a.totalSpent;
        case "totalOrders":
          return b.totalOrders - a.totalOrders;
        case "lastOrder":
          if (!a.lastOrder) return 1;
          if (!b.lastOrder) return -1;
          return new Date(b.lastOrder).getTime() - new Date(a.lastOrder).getTime();
        case "name":
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [customers, sortBy]);

  const customerStats = useMemo(() => {
    const total = customers.length;
    const active = customers.filter(
      (customer) => customer.status === "active"
    ).length;
    const inactive = customers.filter(
      (customer) => customer.status === "inactive"
    ).length;
    const averageSpent =
      total > 0
        ? customers.reduce((sum, customer) => sum + customer.totalSpent, 0) /
          total
        : 0;

    return { total, active, inactive, averageSpent };
  }, [customers]);

  const handleDeleteCustomer = (customerId: string) => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      // TODO: Implement customer deletion API
      console.log("Deleting customer", customerId);
    }
  };

  const handleToggleStatus = async (customerId: string, currentStatus: string) => {
    try {
      const response = await fetch("/api/admin/customers", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          userId: customerId,
          isActive: currentStatus === "inactive",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update customer");
      }

      // Refresh customers
      fetchCustomers();
    } catch (err) {
      console.error("Error updating customer:", err);
      // alert("Failed to update customer status");
      console.error("Failed to update customer status");
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-2xl font-semibold text-gray-900">Customers</h2>
            <div className="text-sm text-gray-600">
              {filteredCustomers.length} customers
            </div>
          </div>
        </header>

        <div className="border-b bg-white px-6 py-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-white text-center">
              <div className="text-2xl font-bold text-gray-900">
                {customerStats.total}
              </div>
              <div className="text-sm text-gray-600">Total Customers</div>
            </div>
            <div className="rounded-lg bg-white text-center">
              <div className="text-2xl font-bold text-green-600">
                {customerStats.active}
              </div>
              <div className="text-sm text-gray-600">Active</div>
            </div>
            <div className="rounded-lg bg-white text-center">
              <div className="text-2xl font-bold text-red-600">
                {customerStats.inactive}
              </div>
              <div className="text-sm text-gray-600">Inactive</div>
            </div>
            <div className="rounded-lg bg-white text-center">
              <div className="text-2xl font-bold text-blue-600">
                ${customerStats.averageSpent.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Avg. Spent</div>
            </div>
          </div>
        </div>

        <div className="border-b bg-white px-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search customers..."
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
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="rounded-md border border-gray-300 px-4 py-2 focus:border-black focus:outline-none focus:ring-black"
            >
              <option value="name">Sort by Name</option>
              <option value="totalSpent">Sort by Spent</option>
              <option value="totalOrders">Sort by Orders</option>
              <option value="lastOrder">Sort by Last Order</option>
            </select>
          </div>
        </div>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-white">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-500">Loading customers...</div>
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
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Orders
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Total Spent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Last Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {filteredCustomers.map((customer) => {
                    const initials = customer.name
                      .split(" ")
                      .map((part) => part[0])
                      .join("");

                    return (
                      <tr
                        key={customer.id}
                        className="transition-colors hover:bg-gray-50"
                      >
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center">
                            <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-600">
                              {initials}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {customer.name}
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <Calendar className="mr-1 h-3 w-3" />
                                Joined {new Date(customer.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="text-sm text-gray-900">
                            <div className="mb-1 flex items-center">
                              <Mail className="mr-1 h-3 w-3 text-gray-400" />
                              {customer.email}
                            </div>
                            <div className="mb-1 flex items-center">
                              <Phone className="mr-1 h-3 w-3 text-gray-400" />
                              {customer.phone}
                            </div>
                            <div className="flex items-center">
                              <MapPin className="mr-1 h-3 w-3 text-gray-400" />
                              {customer.location}
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {customer.totalOrders}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          ${customer.totalSpent.toFixed(2)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {customer.lastOrder
                            ? new Date(customer.lastOrder).toLocaleDateString()
                            : "Never"}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <button
                            onClick={() => handleToggleStatus(customer.id, customer.status)}
                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${
                              customer.status === "active"
                                ? "bg-green-100 text-green-800 hover:bg-green-200"
                                : "bg-red-100 text-red-800 hover:bg-red-200"
                            }`}
                          >
                            {customer.status}
                          </button>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              className="text-blue-600 hover:text-blue-900"
                              title="View customer"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              className="text-gray-600 hover:text-gray-900"
                              title="Edit customer"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteCustomer(customer.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Delete customer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filteredCustomers.length === 0 && (
                <div className="py-12 text-center">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No customers found
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchTerm || statusFilter !== "all"
                      ? "Try adjusting your search or filters."
                      : "No customers have signed up yet."}
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
