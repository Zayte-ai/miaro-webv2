"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import ProductVariantsForm, {
  ProductVariant,
} from "@/components/admin/ProductVariantsForm";
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
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [productForm, setProductForm] = useState({
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
    if (!adminToken) return;

    let cancelled = false;

    async function loadCategories() {
      try {
        const res = await fetch("/api/admin/categories", {
          headers: { Authorization: `Bearer ${adminToken}` },
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message ?? "Failed to load categories");
        }

        const data = await res.json();
        if (!cancelled) setCategories(data.data ?? []);
      } catch (err) {
        if (!cancelled) setErrorMessage((err as Error).message);
      }
    }

    loadCategories();
    return () => {
      cancelled = true;
    };
  }, [adminToken]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setProductForm((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    setProductForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddImage = () => {
    const trimmed = imageInput.trim();
    if (!trimmed) return;

    setProductForm((prev) => ({
      ...prev,
      images: [...prev.images, trimmed],
    }));
    setImageInput("");
  };

  const handleRemoveImage = (index: number) => {
    setProductForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!adminToken) return;

    setIsLoading(true);

    try {
      const payload = {
        name: productForm.name.trim(),
        description: productForm.description.trim(),
        price: parseFloat(productForm.price),
        categoryId: productForm.categoryId,
        sku: productForm.sku || undefined,
        comparePrice: productForm.comparePrice
          ? parseFloat(productForm.comparePrice)
          : undefined,
        costPrice: productForm.costPrice
          ? parseFloat(productForm.costPrice)
          : undefined,
        isActive: productForm.isActive,
        isFeatured: productForm.featured,
        trackInventory: productForm.trackInventory,
        initialStock: parseInt(productForm.stock, 10),
        lowStockThreshold: parseInt(productForm.lowStockThreshold, 10),
        images: productForm.images.map((url, index) => ({
          url,
          sortOrder: index,
        })),
        model3d: productForm.model3d || undefined,
        imageFrames: parseInt(productForm.imageFrames, 10),
        variants: variants.length ? variants : undefined,
      };

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message ?? "Failed to create product");
      }

      router.push("/admin/dashboard/products");
    } catch (err) {
      // alert((err as Error).message);
      console.error("Failed to create product:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <AdminSidebar />

      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/admin/dashboard/products"
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Link>
          <h1 className="text-2xl font-semibold">New Product</h1>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-700">
            {errorMessage}
          </div>
        )}

        {/* ✅ FORM CORRECT — PAS DE action={} */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            name="name"
            placeholder="Product name"
            value={productForm.name}
            onChange={handleInputChange}
            className="w-full rounded border px-3 py-2"
            required
          />

          <textarea
            name="description"
            placeholder="Description"
            value={productForm.description}
            onChange={handleInputChange}
            className="w-full rounded border px-3 py-2"
          />

          <input
            name="price"
            type="number"
            step="0.01"
            placeholder="Price"
            value={productForm.price}
            onChange={handleInputChange}
            className="w-full rounded border px-3 py-2"
            required
          />

          <select
            name="categoryId"
            value={productForm.categoryId}
            onChange={handleInputChange}
            className="w-full rounded border px-3 py-2"
            required
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <input
            name="sku"
            placeholder="SKU (optional)"
            value={productForm.sku}
            onChange={handleInputChange}
            className="w-full rounded border px-3 py-2"
          />

          <input
            name="comparePrice"
            type="number"
            step="0.01"
            placeholder="Compare Price (optional)"
            value={productForm.comparePrice}
            onChange={handleInputChange}
            className="w-full rounded border px-3 py-2"
          />

          <input
            name="costPrice"
            type="number"
            step="0.01"
            placeholder="Cost Price (optional)"
            value={productForm.costPrice}
            onChange={handleInputChange}
            className="w-full rounded border px-3 py-2"
          />

          <input
            name="model3d"
            placeholder="3D Model URL (optional)"
            value={productForm.model3d}
            onChange={handleInputChange}
            className="w-full rounded border px-3 py-2"
          />

          <input
            name="imageFrames"
            type="number"
            placeholder="Image Frames (default: 35)"
            value={productForm.imageFrames}
            onChange={handleInputChange}
            className="w-full rounded border px-3 py-2"
          />

          <input
            name="stock"
            type="number"
            placeholder="Initial Stock"
            value={productForm.stock}
            onChange={handleInputChange}
            className="w-full rounded border px-3 py-2"
            required
          />

          <input
            name="lowStockThreshold"
            type="number"
            placeholder="Low Stock Threshold (default: 10)"
            value={productForm.lowStockThreshold}
            onChange={handleInputChange}
            className="w-full rounded border px-3 py-2"
          />

          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input
                name="trackInventory"
                type="checkbox"
                checked={productForm.trackInventory}
                onChange={handleInputChange}
                className="rounded border"
              />
              <span className="text-sm">Track Inventory</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                name="featured"
                type="checkbox"
                checked={productForm.featured}
                onChange={handleInputChange}
                className="rounded border"
              />
              <span className="text-sm">Featured</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                name="isActive"
                type="checkbox"
                checked={productForm.isActive}
                onChange={handleInputChange}
                className="rounded border"
              />
              <span className="text-sm">Active</span>
            </label>
          </div>

          <div>
            <div className="mb-2 flex gap-2">
              <input
                value={imageInput}
                onChange={(e) => setImageInput(e.target.value)}
                placeholder="Image URL"
                className="flex-1 rounded border px-3 py-2"
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="rounded bg-blue-600 px-3 py-2 text-white"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {productForm.images.map((img, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded bg-gray-200 px-2 py-1 text-sm"
                >
                  {img}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(i)}
                  >
                    <X className="h-4 w-4 text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <ProductVariantsForm
            variants={variants}
            onChange={setVariants}
          />

          <button
            type="submit"
            disabled={isLoading}
            className="rounded bg-green-600 px-6 py-2 font-medium text-white disabled:opacity-50"
          >
            {isLoading ? "Creating..." : "Create product"}
          </button>
        </form>
      </main>
    </div>
  );
}
