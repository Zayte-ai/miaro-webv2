"use client";

import { useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductById } from "@/lib/data";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import Product3DViewer from "@/components/Product3DViewer";
import ProductImageSlider from "@/components/ProductImageSlider";
import { Toast } from "@/components/Toast";
import { Size, Color } from "@/types";
import { Heart, Share2, ShoppingBag, ArrowLeft } from "lucide-react";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default function ProductPage({ params }: ProductPageProps) {
  const { id } = use(params);
  const product = getProductById(id);

  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [selectedColor, setSelectedColor] = useState<Color | null>(null);
  const [showDescription, setShowDescription] = useState(true);
  const [show3DViewer, setShow3DViewer] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const addItem = useCartStore((state) => state.addItem);

  if (!product) {
    notFound();
  }

  const handleAddToCart = () => {
    if (!selectedSize || !selectedColor) {
      setToast({ message: "Please select a size and color", type: "error" });
      return;
    }

    addItem(product, selectedSize, selectedColor);
    setToast({ message: `${product.name} added to cart!`, type: "success" });
  };

  return (
    <div className="min-h-screen bg-white">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/shop"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Shop
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Product Images & 3D Viewer */}
          <div className="space-y-4">
            {/* Main Image/3D Viewer/Image Slider */}
            <div className="relative">
              {show3DViewer ? (
                <Product3DViewer modelPath={product.model3d} />
              ) : (
                <ProductImageSlider
                  productName={product.name}
                  baseImagePath={`/images/products/${product.id}`}
                  totalFrames={product.imageFrames || 35}
                />
              )}

              {/* 3D Toggle Button */}
              {product.model3d && (
                <button
                  onClick={() => setShow3DViewer(!show3DViewer)}
                  className="absolute top-4 right-4 bg-white bg-opacity-90 px-3 py-2 rounded-md text-sm font-medium hover:bg-opacity-100 transition-all"
                >
                  {show3DViewer ? "View Photos" : "View 3D"}
                </button>
              )}
            </div>
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              <p className="text-2xl font-semibold text-gray-900">
                {formatPrice(product.price)}
              </p>
            </div>

            {/* Stock Status */}
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  product.inStock ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-sm text-gray-600">
                {product.inStock ? "In Stock" : "Out of Stock"}
              </span>
            </div>

            {/* Size Selection */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Size</h3>
              <div className="grid grid-cols-6 gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size.id}
                    onClick={() => setSelectedSize(size)}
                    className={`py-2 text-sm font-medium border rounded-md transition-colors ${
                      selectedSize?.id === size.id
                        ? "border-gray-900 bg-gray-900 text-white"
                        : "border-gray-300 text-gray-700 hover:border-gray-400"
                    }`}
                  >
                    {size.value}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-3">Color</h3>
              <div className="flex space-x-3">
                {product.colors.map((color) => (
                  <button
                    key={color.id}
                    onClick={() => setSelectedColor(color)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      selectedColor?.id === color.id
                        ? "border-gray-900 scale-110"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
              {selectedColor && (
                <p className="text-sm text-gray-600 mt-2">
                  Selected: {selectedColor.name}
                </p>
              )}
            </div>

            {/* Add to Cart Button */}
            <div className="space-y-3">
              <button
                onClick={handleAddToCart}
                disabled={!product.inStock || !selectedSize || !selectedColor}
                className="w-full bg-gray-900 text-white py-3 px-6 rounded-md font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                Add to Cart
              </button>

              <div className="flex space-x-3">
                <button className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md font-medium hover:bg-gray-50 transition-colors flex items-center justify-center">
                  <Heart className="h-4 w-4 mr-2" />
                  Wishlist
                </button>
                <button className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-md font-medium hover:bg-gray-50 transition-colors flex items-center justify-center">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </button>
              </div>
            </div>

            {/* Product Details */}
            <div className="border-t pt-6">
              <div className="space-y-4">
                <button
                  onClick={() => setShowDescription(!showDescription)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h3 className="text-lg font-medium text-gray-900">
                    Description
                  </h3>
                  <span className="text-gray-500">
                    {showDescription ? "−" : "+"}
                  </span>
                </button>

                {showDescription && (
                  <div className="text-gray-600 space-y-3">
                    <p>{product.description}</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Premium quality materials</li>
                      <li>Sustainable production methods</li>
                      <li>Expert craftsmanship</li>
                      <li>Timeless design</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
