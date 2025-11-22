"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Edit, Trash2, Tag, Search, X } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useAdminStore } from "@/store/admin";

interface AdminCategory {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  _count?: {
    products: number;
  };
}

export default function CategoriesPage() {
  const { adminToken } = useAdminStore();
  const [categoriesData, setCategoriesData] = useState<AdminCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(
    null
  );
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!adminToken) {
      return;
    }

    const abortController = new AbortController();

    async function loadCategories() {
      try {
        setIsLoading(true);
        setErrorMessage(null);

        const response = await fetch("/api/admin/categories", {
          headers: { Authorization: `Bearer ${adminToken}` },
          signal: abortController.signal,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message ?? "Failed to load categories");
        }

        const data = await response.json();
        setCategoriesData(data.data ?? []);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }
        console.error("Failed to load categories", error);
        setErrorMessage(
          (error as Error).message ?? "Failed to load categories"
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadCategories();

    return () => abortController.abort();
  }, [adminToken]);

  const filteredCategories = useMemo(() => {
    return categoriesData.filter((category) => {
      const query = searchTerm.trim().toLowerCase();
      if (!query) {
        return true;
      }
      return (
        category.name.toLowerCase().includes(query) ||
        category.slug.toLowerCase().includes(query)
      );
    });
  }, [categoriesData, searchTerm]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((previous) => {
      const next = { ...previous, [name]: value };
      if (name === "name" && !editingCategory) {
        next.slug = value
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^a-z0-9-]/g, "");
      }
      return next;
    });
  };

  const resetModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: "", slug: "" });
  };

  const refreshCategories = async () => {
    if (!adminToken) {
      return;
    }
    try {
      const response = await fetch("/api/admin/categories", {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message ?? "Failed to refresh categories");
      }
      const data = await response.json();
      setCategoriesData(data.data ?? []);
    } catch (error) {
      console.error("Failed to refresh categories", error);
      setErrorMessage(
        (error as Error).message ?? "Failed to refresh categories"
      );
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.name.trim() || !formData.slug.trim()) {
      alert("Please complete all required fields");
      return;
    }

    const duplicateSlug = categoriesData.find(
      (category) =>
        category.slug === formData.slug && category.id !== editingCategory?.id
    );

    if (duplicateSlug) {
      alert("A category with this slug already exists");
      return;
    }
    if (!adminToken) {
      alert("You must be logged in as an admin to manage categories.");
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage(null);

      if (editingCategory) {
        const response = await fetch(
          `/api/admin/categories/${editingCategory.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${adminToken}`,
            },
            body: JSON.stringify({
              name: formData.name.trim(),
              slug: formData.slug.trim(),
            }),
          }
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message ?? "Failed to update category");
        }

        setCategoriesData((previous) =>
          previous.map((category) =>
            category.id === editingCategory.id ? data.data : category
          )
        );
      } else {
        const response = await fetch("/api/admin/categories", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            name: formData.name.trim(),
            slug: formData.slug.trim(),
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message ?? "Failed to create category");
        }

        setCategoriesData((previous) => [...previous, data.data]);
      }

      resetModal();
    } catch (error) {
      console.error("Category save failed", error);
      setErrorMessage((error as Error).message ?? "Failed to save category");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (category: AdminCategory) => {
    setEditingCategory(category);
    setFormData({ name: category.name, slug: category.slug });
    setShowModal(true);
  };

  const handleDelete = (categoryId: string) => {
    const target = categoriesData.find(
      (category) => category.id === categoryId
    );
    if (!target) {
      return;
    }
    if (
      window.confirm(
        `Delete "${target.name}"? This will also remove all products linked to this category.`
      )
    ) {
      if (!adminToken) {
        alert("You must be logged in as an admin to delete categories.");
        return;
      }

      fetch(`/api/admin/categories/${categoryId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${adminToken}` },
      })
        .then(async (response) => {
          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.message ?? "Failed to delete category");
          }
          setCategoriesData((previous) =>
            previous.filter((category) => category.id !== categoryId)
          );
        })
        .catch((error) => {
          console.error("Category deletion failed", error);
          alert((error as Error).message ?? "Failed to delete category");
        });
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b bg-white shadow-sm">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Categories
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Manage your product categories
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </button>
          </div>
        </header>

        <div className="border-b bg-white px-6 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search categories..."
                className="w-full rounded-md border border-gray-300 py-2 pl-10 pr-4 focus:border-black focus:outline-none focus:ring-black"
              />
            </div>
            <button
              onClick={refreshCategories}
              disabled={isLoading}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Refresh
            </button>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto bg-gray-100 p-6">
          {errorMessage && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {isLoading && categoriesData.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">
              Loading categories...
            </div>
          ) : null}

          {filteredCategories.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCategories.map((category) => (
                <div
                  key={category.id}
                  className="rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex items-center">
                      <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                        <Tag className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {category.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          /{category.slug}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="rounded-md p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                        aria-label="Edit category"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="rounded-md p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        aria-label="Delete category"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Products:</span>
                      <span className="font-medium text-gray-900">
                        {category._count?.products ?? 0}
                      </span>
                    </div>
                    <div className="mt-2">
                      <Link
                        href={`/shop/${category.slug}`}
                        target="_blank"
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        View in store →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <Tag className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {searchTerm ? "No categories found" : "No categories yet"}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm
                  ? "Try adjusting your search criteria."
                  : "Create your first category to organize products."}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-4 rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800"
                >
                  Add Category
                </button>
              )}
            </div>
          )}
        </main>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b p-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingCategory ? "Edit Category" : "Add New Category"}
              </h3>
              <button
                onClick={resetModal}
                className="text-gray-400 transition-colors hover:text-gray-600"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-6">
              <div>
                <label
                  className="mb-2 block text-sm font-medium text-gray-700"
                  htmlFor="name"
                >
                  Category Name *
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-black"
                  placeholder="e.g., T-Shirts"
                />
              </div>

              <div>
                <label
                  className="mb-2 block text-sm font-medium text-gray-700"
                  htmlFor="slug"
                >
                  URL Slug *
                </label>
                <input
                  id="slug"
                  name="slug"
                  type="text"
                  required
                  value={formData.slug}
                  onChange={handleInputChange}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-black"
                  placeholder="e.g., t-shirts"
                />
                <p className="mt-1 text-xs text-gray-500">
                  This becomes the path: /shop/{formData.slug}
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={resetModal}
                  className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving
                    ? editingCategory
                      ? "Updating..."
                      : "Creating..."
                    : editingCategory
                    ? "Update Category"
                    : "Create Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
