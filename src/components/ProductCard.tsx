"use client";

import Link from "next/link";
import Image from "next/image";
import { Product } from "@/types";
import { formatPrice } from "@/lib/utils";
import { Heart } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="block bg-white border border-gray-100"
    >
      {/* Image (square) */}
      <div className="relative aspect-square bg-white">
        <Image
          src={product.images?.[0] || "/images/placeholder.svg"}
          alt={product.name}
          fill
          className="object-contain"
          priority
        />

        {/* wishlist icon top-right */}
        <button className="absolute top-3 right-3 p-2" aria-label="Add to wishlist">
          <Heart className="h-5 w-5 text-black" />
        </button>
      </div>

      {/* pagination dots removed as requested */}

      {/* Text block centered */}
      <div className="py-4 text-center px-4">
        <h3 className="text-sm font-medium uppercase tracking-wider text-black" style={{ fontFamily: 'League Spartan, sans-serif' }}>
          {product.name}
        </h3>

        {/* secondary line (styled, dynamic if available) */}
        {product.featured ? (
          <p className="mt-2 text-sm text-blue-600">Featured</p>
        ) : (
          <p className="mt-2 text-sm text-gray-500">{product.colors?.length ?? 0} colors</p>
        )}

        {/* price */}
        <p className="mt-3 text-sm text-black">{formatPrice(product.price)}</p>
      </div>
    </Link>
  );
}
