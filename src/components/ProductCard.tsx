"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/store/cart";
import { ShoppingBag, Heart } from "lucide-react";

interface ProductCardProps {
  product: Product;
  showQuickAdd?: boolean;
}

export default function ProductCard({
  product,
  showQuickAdd = false,
}: ProductCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Add to cart with default size and color
    if (product.sizes.length > 0 && product.colors.length > 0) {
      addItem(product, product.sizes[0], product.colors[0]);A
    }
  };

  const handleImageHover = () => {
    if (product.images.length > 1) {
      setCurrentImageIndex(1);
    }
  };

  const handleImageLeave = () => {
    setCurrentImageIndex(0);
  };

  return (
    <div
      className="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/products/${product.id}`}>
        <div className="aspect-square relative overflow-hidden bg-gray-100">
          <Image
            src={product.images[currentImageIndex] || "/images/placeholder.svg"}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            onMouseEnter={handleImageHover}
            onMouseLeave={handleImageLeave}
          />

          {!product.inStock && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <span className="text-white font-medium">Out of Stock</span>
            </div>
          )}

          {product.featured && (
            <div className="absolute top-2 left-2">
              <span className="bg-gray-900 text-white text-xs px-2 py-1 rounded">
                Featured
              </span>
            </div>
          )}
        </div>

        <div className="p-4">
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            {product.name}
          </h3>
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            {product.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-900">
              {formatPrice(product.price)}
            </span>

            {/* Color options */}
            <div className="flex space-x-1">
              {product.colors.slice(0, 3).map((color) => (
                <div
                  key={color.id}
                  className="w-4 h-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
              {product.colors.length > 3 && (
                <span className="text-xs text-gray-500 ml-1">
                  +{product.colors.length - 3}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>

      {/* Quick actions */}
      {isHovered && (
        <div className="absolute top-2 right-2 flex flex-col space-y-2">
          <button
            className="p-2 bg-white rounded-full shadow-md hover:bg-gray-50 transition-colors"
            title="Add to Wishlist"
          >
            <Heart className="h-4 w-4 text-gray-600" />
          </button>

          {showQuickAdd && product.inStock && (
            <button
              onClick={handleQuickAdd}
              className="p-2 bg-gray-900 text-white rounded-full shadow-md hover:bg-gray-800 transition-colors"
              title="Quick Add to Cart"
            >
              <ShoppingBag className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
