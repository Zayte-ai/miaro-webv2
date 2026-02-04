"use client";

import React, { useEffect, useState } from "react";
import Link from 'next/link';

type ProductImage = {
  id?: string;
  url: string;
  altText?: string | null;
};

type Product = {
  id: string;
  name: string;
  price: number;
  slug?: string;
  images?: ProductImage[];
};

export default function ProductListClient({ limit = 50 }: { limit?: number }) {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ac = new AbortController();

    async function fetchProducts() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/products?limit=${encodeURIComponent(String(limit))}`, {
          signal: ac.signal,
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) {
          const txt = await res.text();
          throw new Error(`API error ${res.status}: ${txt}`);
        }

        const body = await res.json();

        if (!body || body.success === false) {
          throw new Error(body?.error || "Failed to load products");
        }

        const list: Product[] = body.data?.products ?? [];
        setProducts(list);
      } catch (err: any) {
        if (err.name === "AbortError") return;
        console.error("ProductListClient fetch error:", err);
        setError(err.message || "Failed to load products");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();

    return () => ac.abort();
  }, [limit]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-56 bg-gray-100 animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No products available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((p) => (
        <Link key={p.id} href={p.slug ? `/products/${p.slug}` : `/products/${p.id}`} className="block overflow-hidden hover:opacity-90 transition cursor-pointer">
          <div className="aspect-square">
            {p.images && p.images.length > 0 ? (
              <img src={p.images[0].url} alt={p.images[0].altText || p.name} className="object-cover w-full h-full" />
            ) : (
              <div className="w-full h-full bg-gray-100"></div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
