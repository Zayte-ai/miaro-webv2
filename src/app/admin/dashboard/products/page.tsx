"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Package,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
} from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useAdminStore } from "@/store/admin";

interface AdminCategory {
  id: string;
  name: string;
  slug: string;
}

interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  category: AdminCategory;
  isActive: boolean;
  isFeatured: boolean;
  inventory?: {
    quantity: number;
    lowStockThreshold: number;
    allowBackorder: boolean;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export default function ProductsPage() {
  const { adminToken } = useAdminStore();
  const [productsData, setProductsData] = useState<AdminProduct[]>([]);
  const [categoriesData, setCategoriesData] = useState<AdminCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!adminToken) {
      return;
    }

    const abortController = new AbortController();

    async function loadData() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const [categoryResponse, productResponse] = await Promise.all([
          fetch("/api/admin/categories", {
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
            signal: abortController.signal,
          }),
          fetch("/api/admin/products", {
            headers: {
              Authorization: `Bearer ${adminToken}`,
            },
            signal: abortController.signal,
          }),
        ]);

        if (!categoryResponse.ok) {
          const data = await categoryResponse.json();
          throw new Error(data.message ?? "Failed to load categories");
        }
        if (!productResponse.ok) {
          const data = await productResponse.json();
          throw new Error(data.message ?? "Failed to load products");
        }

        const categoriesJson = await categoryResponse.json();
        const productsJson = await productResponse.json();

        setCategoriesData(categoriesJson.data ?? []);
        setProductsData(productsJson.data ?? []);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        console.error("Failed to load admin products", error);
        setErrorMessage((error as Error).message ?? "Failed to load data");
      } finally {
        setIsLoading(false);
      }
    }

    loadData();

    return () => abortController.abort();
  }, [adminToken]);

  const filteredProducts = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return [...productsData]
      .filter((product) => {
        const matchesSearch =
          !query ||
          product.name.toLowerCase().includes(query) ||
          product.slug.toLowerCase().includes(query) ||
          product.category.name.toLowerCase().includes(query);
        const matchesCategory =
          selectedCategory === "all" ||
          product.category.slug === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "price":
            return a.price - b.price;
          case "category":
            return a.category.name.localeCompare(b.category.name);
          case "name":
          default:
            return a.name.localeCompare(b.name);
        }
      });
  }, [productsData, searchTerm, selectedCategory, sortBy]);

  const refreshProducts = async () => {
    if (!adminToken) {
      return;
    }
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/products", {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message ?? "Failed to refresh products");
      }
      const data = await response.json();
      setProductsData(data.data ?? []);
    } catch (error) {
      console.error("Failed to refresh products", error);
      setErrorMessage((error as Error).message ?? "Failed to refresh products");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const product = productsData.find((item) => item.id === productId);
    if (!product || !adminToken) {
      return;
    }

    if (
      !window.confirm(`Delete "${product.name}"? This action cannot be undone.`)
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message ?? "Failed to delete product");
      }

      setProductsData((previous) =>
        previous.filter((item) => item.id !== productId)
      );
    } catch (error) {
      console.error("Product deletion failed", error);
      alert((error as Error).message ?? "Failed to delete product");
    }
  };

  const handleAdjustStock = async (product: AdminProduct) => {
    if (!adminToken) {
      return;
    }

    const currentQuantity = product.inventory?.quantity ?? 0;
    const input = window.prompt(
      `Set the available stock for "${product.name}"`,
      String(currentQuantity)
    );

    if (input === null) {
      return;
    }

    const nextQuantity = Number.parseInt(input, 10);
    if (Number.isNaN(nextQuantity) || nextQuantity < 0) {
      alert("Please enter a valid non-negative number");
      return;
    }

    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ inventory: { quantity: nextQuantity } }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message ?? "Failed to update stock");
      }

      setProductsData((previous) =>
        previous.map((item) => (item.id === product.id ? data.data : item))
      );
    } catch (error) {
      console.error("Failed to update inventory", error);
      alert((error as Error).message ?? "Failed to update inventory");
    }
  };

  const getStockLabel = (product: AdminProduct) =>
    product.inventory?.quantity ?? 0;

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Products</h2>
              <div className="mt-1 flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  {filteredProducts.length} products
                </span>
                <Link
                  href="/admin/dashboard/categories"
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Manage Categories →
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={refreshProducts}
                disabled={isLoading}
                className="flex items-center rounded-md border border-gray-300 px-3 py-2 text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </button>
              <Link
                href="/admin/dashboard/products/new"
                className="flex items-center rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Product
              </Link>
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
                placeholder="Search products..."
                className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 focus:border-black focus:outline-none focus:ring-black"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="rounded-md border border-gray-300 px-4 py-2 focus:border-black focus:outline-none focus:ring-black"
            >
              <option value="all">All Categories</option>
              {categoriesData.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              className="rounded-md border border-gray-300 px-4 py-2 focus:border-black focus:outline-none focus:ring-black"
            >
              <option value="name">Sort by Name</option>
              <option value="price">Sort by Price</option>
              <option value="category">Sort by Category</option>
            </select>
          </div>
        </div>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-white">
          {errorMessage && (
            <div className="border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {isLoading && productsData.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-sm text-gray-500">
              Loading products...
            </div>
          ) : null}

          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Stock
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
              {filteredProducts.map((product) => (
                <tr
                  key={product.id}
                  className="transition-colors hover:bg-gray-50"
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center">
                      <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-md bg-gray-200">
                        <Package className="h-5 w-5 text-gray-400" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {product.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-800">
                      {product.category.name}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    ${product.price.toFixed(2)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {getStockLabel(product)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        (product.inventory?.quantity ?? 0) > 0
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {(product.inventory?.quantity ?? 0) > 0
                        ? "In Stock"
                        : "Out of Stock"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Link
                        href={`/products/${product.id}`}
                        target="_blank"
                        className="text-gray-400 transition-colors hover:text-gray-600"
                        title="View product"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/admin/dashboard/products/${product.id}/edit`}
                        className="text-blue-600 transition-colors hover:text-blue-900"
                        title="Edit product"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleAdjustStock(product)}
                        className="text-gray-500 transition-colors hover:text-gray-700"
                        title="Adjust stock"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-red-600 transition-colors hover:text-red-900"
                        title="Delete product"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredProducts.length === 0 && (
            <div className="py-12 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No products found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filters.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
