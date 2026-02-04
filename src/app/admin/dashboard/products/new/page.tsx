"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, X, Plus } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { useAdminStore } from "@/store/admin";

interface AdminCategory {
  id: string;
  name: string;
  slug: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const { adminToken } = useAdminStore();
  const [isLoading, setIsLoading] = useState(false);
  const [imageInput, setImageInput] = useState("");
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    categoryId: "",
    sku: "",
    comparePrice: "",
    costPrice: "",
    isActive: true,
    featured: false,
    images: [] as string[],
    model3d: "",
    imageFrames: "35",
    trackInventory: true,
    stock: "0",
    lowStockThreshold: "10",
  });

  useEffect(() => {
    if (!adminToken) {
      return;
    }

    let cancelled = false;

    async function loadCategories() {
      try {
        const response = await fetch("/api/admin/categories", {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message ?? "Failed to load categories");
        }
        const data = await response.json();
        if (!cancelled) {
          setCategories(data.data ?? []);
        }
      } catch (error) {
        console.error("Failed to load categories", error);
        if (!cancelled) {
          setErrorMessage(
            (error as Error).message ?? "Failed to load categories"
          );
        }
      }
    }

    loadCategories();

    return () => {
      cancelled = true;
    };
  }, [adminToken]);

  const handleInputChange = (
    event: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = event.target;
    if (type === "checkbox") {
      const checked = (event.target as HTMLInputElement).checked;
      setFormData((previous) => ({
        ...previous,
        [name]: checked,
      }));
      return;
    }

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleAddImage = () => {
    const trimmed = imageInput.trim();
    if (trimmed) {
      setFormData((previous) => ({
        ...previous,
        images: [...previous.images, trimmed],
      }));
      setImageInput("");
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData((previous) => ({
      ...previous,
      images: previous.images.filter((_, idx) => idx !== index),
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!adminToken) {
      alert("You must be logged in as an admin to create products.");
      return;
    }

    if (
      !formData.name.trim() ||
      !formData.description.trim() ||
      !formData.price ||
      !formData.categoryId
    ) {
      alert("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    try {
      const priceValue = parseFloat(formData.price);
      if (Number.isNaN(priceValue) || priceValue < 0) {
        alert("Please enter a valid price");
        return;
      }

      const comparePriceValue = formData.comparePrice
        ? parseFloat(formData.comparePrice)
        : undefined;
      if (
        comparePriceValue !== undefined &&
        (Number.isNaN(comparePriceValue) || comparePriceValue < 0)
      ) {
        alert("Compare-at price must be a positive number");
        return;
      }

      const costPriceValue = formData.costPrice
        ? parseFloat(formData.costPrice)
        : undefined;
      if (
        costPriceValue !== undefined &&
        (Number.isNaN(costPriceValue) || costPriceValue < 0)
      ) {
        alert("Cost price must be a positive number");
        return;
      }

      const initialStockValue = formData.trackInventory
        ? parseInt(formData.stock || "0", 10)
        : 0;
      if (Number.isNaN(initialStockValue) || initialStockValue < 0) {
        alert("Inventory must be a non-negative integer");
        return;
      }

      const lowStockThresholdValue = formData.trackInventory
        ? parseInt(formData.lowStockThreshold || "10", 10)
        : undefined;
      if (
        lowStockThresholdValue !== undefined &&
        (Number.isNaN(lowStockThresholdValue) || lowStockThresholdValue < 0)
      ) {
        alert("Low stock threshold must be a non-negative integer");
        return;
      }

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: priceValue,
        categoryId: formData.categoryId,
        sku: formData.sku.trim() || undefined,
        comparePrice: comparePriceValue,
        costPrice: costPriceValue,
        isActive: formData.isActive,
        isFeatured: formData.featured,
        trackInventory: formData.trackInventory,
        initialStock: formData.trackInventory ? initialStockValue : 0,
        lowStockThreshold: formData.trackInventory
          ? lowStockThresholdValue
          : undefined,
        images: formData.images.map((url, index) => ({
          url,
          sortOrder: index,
        })),
        model3d: formData.model3d.trim() || undefined,
        imageFrames: formData.imageFrames
          ? parseInt(formData.imageFrames, 10)
          : undefined,
      };

      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message ?? "Failed to create product");
      }

      router.push("/admin/dashboard/products");
    } catch (error) {
      console.error("Error creating product", error);
      alert("An error occurred while creating the product. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="border-b bg-white shadow-sm">
          <div className="flex items-center px-6 py-4">
            <Link
              href="/admin/dashboard/products"
              className="mr-4 flex items-center text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="mr-1 h-5 w-5" />
              Back to Products
            </Link>
            <h2 className="text-2xl font-semibold text-gray-900">
              Add New Product
            </h2>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-white p-6">
          <form onSubmit={handleSubmit} className="mx-auto max-w-4xl">
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Product Name *
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-black"
                    placeholder="Enter product name"
                  />
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Description *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    required
                    rows={4}
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-black"
                    placeholder="Enter product description"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="price"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Price ($) *
                    </label>
                    <input
                      id="price"
                      name="price"
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-black"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="comparePrice"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Compare-at Price ($)
                    </label>
                    <input
                      id="comparePrice"
                      name="comparePrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.comparePrice}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-black"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="categoryId"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Category *
                    </label>
                    <select
                      id="categoryId"
                      name="categoryId"
                      required
                      value={formData.categoryId}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-black"
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="sku"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      SKU
                    </label>
                    <input
                      id="sku"
                      name="sku"
                      type="text"
                      value={formData.sku}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-black"
                      placeholder="Optional SKU"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="costPrice"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Cost Price ($)
                  </label>
                  <input
                    id="costPrice"
                    name="costPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={handleInputChange}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-black"
                    placeholder="Optional"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="imageFrames"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      360° Image Frames
                    </label>
                    <input
                      id="imageFrames"
                      name="imageFrames"
                      type="number"
                      min="1"
                      step="1"
                      value={formData.imageFrames}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-black"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="model3d"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      3D Model URL
                    </label>
                    <input
                      id="model3d"
                      name="model3d"
                      type="url"
                      value={formData.model3d}
                      onChange={handleInputChange}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-black"
                      placeholder="Enter 3D model URL (.glb file)"
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-medium text-gray-700">
                    Product Status
                  </label>
                  <div className="flex items-center">
                    <input
                      id="isActive"
                      name="isActive"
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                      className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                    />
                    <label
                      htmlFor="isActive"
                      className="ml-2 text-sm text-gray-700"
                    >
                      Active (visible in storefront)
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      id="featured"
                      name="featured"
                      type="checkbox"
                      checked={formData.featured}
                      onChange={handleInputChange}
                      className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                    />
                    <label
                      htmlFor="featured"
                      className="ml-2 text-sm text-gray-700"
                    >
                      Featured Product
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    Product Images
                  </label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={imageInput}
                        onChange={(event) => setImageInput(event.target.value)}
                        placeholder="Enter image URL"
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-black"
                      />
                      <button
                        type="button"
                        onClick={handleAddImage}
                        className="rounded-md bg-gray-100 p-2 text-gray-700 hover:bg-gray-200"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    {formData.images.length > 0 && (
                      <div className="space-y-2">
                        {formData.images.map((image, index) => (
                          <div
                            key={image}
                            className="flex items-center justify-between rounded-md bg-gray-50 p-2"
                          >
                            <span className="truncate text-sm text-gray-600">
                              {image}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-medium text-gray-700">
                    Inventory Management
                  </label>
                  <div className="flex items-center">
                    <input
                      id="trackInventory"
                      name="trackInventory"
                      type="checkbox"
                      checked={formData.trackInventory}
                      onChange={handleInputChange}
                      className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black"
                    />
                    <label
                      htmlFor="trackInventory"
                      className="ml-2 text-sm text-gray-700"
                    >
                      Track inventory for this product
                    </label>
                  </div>

                  {formData.trackInventory && (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label
                          htmlFor="stock"
                          className="mb-2 block text-sm font-medium text-gray-700"
                        >
                          Initial Stock Quantity
                        </label>
                        <input
                          id="stock"
                          name="stock"
                          type="number"
                          min="0"
                          step="1"
                          value={formData.stock}
                          onChange={handleInputChange}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-black"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="lowStockThreshold"
                          className="mb-2 block text-sm font-medium text-gray-700"
                        >
                          Low Stock Threshold
                        </label>
                        <input
                          id="lowStockThreshold"
                          name="lowStockThreshold"
                          type="number"
                          min="0"
                          step="1"
                          value={formData.lowStockThreshold}
                          onChange={handleInputChange}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-black focus:outline-none focus:ring-black"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {errorMessage && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {errorMessage}
                  </div>
                )}

                <div className="flex gap-4 pt-6">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800 focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading ? "Creating..." : "Create Product"}
                  </button>
                  <Link
                    href="/admin/dashboard/products"
                    className="flex-1 rounded-md bg-gray-100 px-4 py-2 text-center text-gray-700 hover:bg-gray-200"
                  >
                    Cancel
                  </Link>
                </div>
              </div>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
