"use client";

import { useState, useEffect } from "react";
import { X, Plus } from "lucide-react";

export interface ProductVariant {
  id?: string;
  name: string;
  sku?: string;
  price?: number;
  comparePrice?: number;
  stock?: number;
  isActive?: boolean;
  options?: {
    [optionName: string]: string; // e.g., { "Size": "M", "Color": "Black" }
  };
}

const PRESET_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const PRESET_COLORS = [
  { name: "Black", hex: "#000000" },
  { name: "White", hex: "#FFFFFF" },
  { name: "Navy", hex: "#1F2937" },
  { name: "Gray", hex: "#6B7280" },
  { name: "Red", hex: "#EF4444" },
  { name: "Blue", hex: "#3B82F6" },
  { name: "Green", hex: "#10B981" },
  { name: "Brown", hex: "#92400E" },
];

interface ProductVariantsFormProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
}

export default function ProductVariantsForm({
  variants,
  onChange,
}: ProductVariantsFormProps) {
  const [showForm, setShowForm] = useState(false);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [newVariantName, setNewVariantName] = useState("");
  const [newVariantSku, setNewVariantSku] = useState("");
  const [newVariantPrice, setNewVariantPrice] = useState("");

  const generateVariantsFromSelections = () => {
    // Rendre la sélection complètement facultative
    if (selectedSizes.length === 0 && selectedColors.length === 0) {
      // Ne rien faire si aucune sélection - c'est facultatif
      setShowForm(false);
      return;
    }

    const newVariants: ProductVariant[] = [];

    if (selectedSizes.length > 0 && selectedColors.length > 0) {
      // Generate combinations of sizes and colors
      selectedColors.forEach((color) => {
        selectedSizes.forEach((size) => {
          newVariants.push({
            name: `${color} - ${size}`,
            sku: newVariantSku
              ? `${newVariantSku}-${color.substring(0, 1)}-${size}`
              : undefined,
            price: newVariantPrice ? parseFloat(newVariantPrice) : undefined,
            stock: 0,
            options: {
              Color: color,
              Size: size,
            },
          });
        });
      });
    } else if (selectedSizes.length > 0) {
      // Only sizes
      selectedSizes.forEach((size) => {
        newVariants.push({
          name: `${size}`,
          sku: newVariantSku ? `${newVariantSku}-${size}` : undefined,
          price: newVariantPrice ? parseFloat(newVariantPrice) : undefined,
          stock: 0,
          options: {
            Size: size,
          },
        });
      });
    } else if (selectedColors.length > 0) {
      // Only colors
      selectedColors.forEach((color) => {
        newVariants.push({
          name: `${color}`,
          sku: newVariantSku
            ? `${newVariantSku}-${color.substring(0, 1)}`
            : undefined,
          price: newVariantPrice ? parseFloat(newVariantPrice) : undefined,
          stock: 0,
          options: {
            Color: color,
          },
        });
      });
    }

    onChange([...variants, ...newVariants]);

    // Reset form
    setSelectedSizes([]);
    setSelectedColors([]);
    setNewVariantName("");
    setNewVariantSku("");
    setNewVariantPrice("");
    setShowForm(false);
  };

  const removeVariant = (index: number) => {
    onChange(variants.filter((_, idx) => idx !== index));
  };

  return (
    <div className="space-y-4 rounded-lg bg-gray-50 p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Product Variants (Sizes &amp; Colors)
        </h3>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 rounded bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" />
          Add Variants
        </button>
      </div>

      {showForm && (
        <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Select Sizes
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() =>
                    setSelectedSizes((prev) =>
                      prev.includes(size)
                        ? prev.filter((s) => s !== size)
                        : [...prev, size]
                    )
                  }
                  className={`rounded px-3 py-2 text-sm font-medium transition ${
                    selectedSizes.includes(size)
                      ? "bg-blue-600 text-white"
                      : "border border-gray-300 text-gray-700 hover:border-gray-400"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Select Colors
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() =>
                    setSelectedColors((prev) =>
                      prev.includes(color.name)
                        ? prev.filter((c) => c !== color.name)
                        : [...prev, color.name]
                    )
                  }
                  className={`flex items-center gap-2 rounded px-3 py-2 text-sm font-medium transition ${
                    selectedColors.includes(color.name)
                      ? "border-2 border-blue-600"
                      : "border border-gray-300"
                  }`}
                >
                  <div
                    className="h-4 w-4 rounded-full border border-gray-300"
                    style={{ backgroundColor: color.hex }}
                  />
                  {color.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label
                htmlFor="variantSku"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                SKU Prefix (Optional)
              </label>
              <input
                id="variantSku"
                type="text"
                value={newVariantSku}
                onChange={(e) => setNewVariantSku(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                placeholder="e.g., TEE-001"
              />
            </div>

            <div>
              <label
                htmlFor="variantPrice"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Price Override (Optional)
              </label>
              <input
                id="variantPrice"
                type="number"
                step="0.01"
                min="0"
                value={newVariantPrice}
                onChange={(e) => setNewVariantPrice(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none"
                placeholder="Leave empty for default price"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={generateVariantsFromSelections}
                className="flex-1 rounded bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Generate Variants
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {variants.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            Generated Variants ({variants.length})
          </h4>
          <div className="max-h-64 space-y-2 overflow-y-auto rounded border border-gray-200">
            {variants.map((variant, index) => (
              <div
                key={index}
                className="flex items-center justify-between border-b border-gray-100 bg-white p-3 last:border-b-0"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{variant.name}</p>
                  {variant.sku && (
                    <p className="text-xs text-gray-600">SKU: {variant.sku}</p>
                  )}
                  {variant.price && (
                    <p className="text-xs text-gray-600">
                      Price: ${Number(variant.price).toFixed(2)}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <label className="text-xs text-gray-600">Stock:</label>
                    <input
                      type="number"
                      min="0"
                      value={variant.stock || 0}
                      onChange={(e) => {
                        const newVariants = [...variants];
                        newVariants[index] = {
                          ...variant,
                          stock: parseInt(e.target.value) || 0,
                        };
                        onChange(newVariants);
                      }}
                      className="w-20 rounded border border-gray-300 px-2 py-1 text-xs"
                    />
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {variant.options && Object.entries(variant.options).map(([key, value]) => (
                      <span
                        key={key}
                        className="inline-block rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-700"
                      >
                        {key}: {value}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="ml-2 text-gray-400 hover:text-red-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
