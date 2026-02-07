"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, X } from "lucide-react";
import AdminSidebar from "@/components/admin/AdminSidebar";
import ProductVariantsForm, {
  ProductVariant,
} from "@/components/admin/ProductVariantsForm";
import Image360SliderUploader from "@/components/admin/Image360SliderUploader";
import { useAdminStore } from "@/store/admin";

interface AdminCategory {
  id: string;
  name: string;
  slug: string;
}

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const { adminToken } = useAdminStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
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
    stripePriceId: "",
    isActive: true,
    featured: false,
    images: [] as string[],
    model3d: "",
    imageFrames: "35",
    trackInventory: true,
    stock: "0",
    lowStockThreshold: "10",
    rotationImage360Url: null as string | null,
  });

  // Fetch product details
  useEffect(() => {
    if (!adminToken || !id) return;

    let cancelled = false;

    async function loadProduct() {
      try {
        setIsFetching(true);
        const res = await fetch(`/api/admin/products/${id}`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message ?? "Failed to load product");
        }

        const data = await res.json();
        const product = data.data;

        if (!cancelled) {
          setProductForm({
            name: product.name || "",
            description: product.description || "",
            price: String(product.price || ""),
            categoryId: product.categoryId || "",
            sku: product.sku || "",
            comparePrice: String(product.comparePrice || ""),
            costPrice: String(product.costPrice || ""),
            stripePriceId: product.stripePriceId || "",
            isActive: product.isActive ?? true,
            featured: product.isFeatured ?? false,
            images: product.images?.map((img: any) => img.url) || [],
            model3d: product.model3d || "",
            imageFrames: String(product.imageFrames || 35),
            trackInventory: product.trackInventory ?? true,
            stock: String(product.inventory?.quantity || 0),
            lowStockThreshold: String(product.inventory?.lowStockThreshold || 10),
            rotationImage360Url: product.rotationImage360Url || null,
          });

          // Load variants if any
          if (product.variants && product.variants.length > 0) {
            const transformedVariants = product.variants.map((v: any) => ({
              id: v.id,
              name: v.name,
              sku: v.sku || "",
              price: v.price || undefined,
              comparePrice: v.comparePrice || undefined,
              stock: v.inventory?.quantity || 0,
              isActive: v.isActive ?? true,
              options: v.options || {},
            }));
            setVariants(transformedVariants);
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Error loading product:", err);
          setErrorMessage((err as Error).message);
        }
      } finally {
        if (!cancelled) setIsFetching(false);
      }
    }

    loadProduct();
    return () => {
      cancelled = true;
    };
  }, [adminToken, id]);

  // Fetch categories
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminToken) return;

    setIsLoading(true);
    setErrorMessage(null);

    const body = {
      name: productForm.name,
      description: productForm.description,
      price: parseFloat(productForm.price),
      categoryId: productForm.categoryId,
      sku: productForm.sku || undefined,
      comparePrice: productForm.comparePrice
        ? parseFloat(productForm.comparePrice)
        : undefined,
      costPrice: productForm.costPrice
        ? parseFloat(productForm.costPrice)
        : undefined,
      stripePriceId: productForm.stripePriceId || undefined,
      isActive: productForm.isActive,
      isFeatured: productForm.featured,
      images: productForm.images.map((url, index) => ({
        url,
        altText: null,
        sortOrder: index,
      })),
      model3d: productForm.model3d || undefined,
      imageFrames: parseInt(productForm.imageFrames) || 35,
      trackInventory: productForm.trackInventory,
      inventory: {
        quantity: parseInt(productForm.stock) || 0,
        lowStockThreshold: parseInt(productForm.lowStockThreshold) || 10,
      },
      variants,
    };

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message ?? "Failed to update product");
      }

      // alert("Product updated successfully!");
      console.log("Product updated successfully!");
      router.push("/admin/dashboard/products");
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!adminToken) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Please log in</p>
      </div>
    );
  }

  if (isFetching) {
    return (
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 p-8">
          <p>Loading product...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <main className="flex-1 p-8">
        <div className="mb-6 flex items-center gap-4">
          <Link
            href="/admin/dashboard/products"
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">Edit Product</h1>
        </div>

        {errorMessage && (
          <div className="mb-4 rounded bg-red-100 p-4 text-red-700">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 rounded bg-white p-6">
          <input
            name="name"
            placeholder="Product Name"
            value={productForm.name}
            onChange={handleInputChange}
            className="w-full rounded border px-3 py-2"
            required
          />

          <textarea
            name="description"
            rows={4}
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

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <label className="mb-2 block text-sm font-medium text-blue-900">
              Stripe Price ID 💳
            </label>
            <input
              name="stripePriceId"
              placeholder="price_1xxxxxxxxxxxxx (from Stripe Dashboard)"
              value={productForm.stripePriceId}
              onChange={handleInputChange}
              className="w-full rounded border border-blue-300 px-3 py-2"
            />
            <p className="mt-2 text-xs text-blue-700">
              📋 Create a price in{" "}
              <a
                href="https://dashboard.stripe.com/products"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-blue-900"
              >
                Stripe Dashboard
              </a>{" "}
              and paste the Price ID here (e.g., price_1SwrmnC73ocS8esoPWpYgiHD)
            </p>
          </div>

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

          {/* Images 360° avec Slider */}
          <div className="border-t pt-4">
            <Image360SliderUploader
              productId={id}
              existingFrames={productForm.imageFrames || 37}
            />
          </div>

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

          <ProductVariantsForm variants={variants} onChange={setVariants} />

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className="rounded bg-blue-600 px-6 py-2 font-medium text-white disabled:opacity-50"
            >
              {isLoading ? "Updating..." : "Update Product"}
            </button>

            <Link
              href="/admin/dashboard/products"
              className="rounded bg-gray-200 px-6 py-2 font-medium text-gray-700 hover:bg-gray-300"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
