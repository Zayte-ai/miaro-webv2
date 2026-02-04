"use client";

import { useState, use, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useCartStore } from "@/store/cart";
import { formatPrice } from "@/lib/utils";
import Product3DViewer from "@/components/Product3DViewer";
import ProductImageSlider from "@/components/ProductImageSlider";
import Product360Viewer from "@/components/Product360Viewer";
import { Toast } from "@/components/Toast";
import { Size, Color } from "@/types";
import { Share2, ShoppingBag, ArrowLeft, Loader, RotateCw } from "lucide-react";

// Import dynamique pour éviter l'hydratation mismatch
const ImageGallerySlider = dynamic(
  () => import("@/components/ImageGallerySlider"),
  { ssr: false }
);

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default function ProductPage({ params }: ProductPageProps) {
  const { id } = use(params);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSize, setSelectedSize] = useState<any | null>(null);
  const [selectedColor, setSelectedColor] = useState<any | null>(null);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        console.log('Fetching product with id:', id);
        const response = await fetch(`/api/products/${id}`);
        
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch {
            errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
          }
          console.error('Error response:', errorData);
          throw new Error(errorData.error || errorData.message || 'Product not found');
        }

        const data = await response.json();
        console.log('Product data received:', {
          success: data.success,
          hasData: !!data.data,
          hasProduct: !!data.data?.product,
        });
        
        // Vérifier si les données sont valides
        if (!data || !data.success || !data.data || !data.data.product) {
          console.error('Invalid product structure:', data);
          throw new Error('Invalid product data received');
        }
        
        setProduct(data.data.product);
        setError(null);
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    // Vérifier uniquement les options disponibles
    const hasSizes = (product.sizes || []).length > 0;
    const hasColors = (product.colors || []).length > 0;

    if (hasSizes && !selectedSize) {
      setToast({ message: 'Please select a size', type: 'error' });
      return;
    }

    // Ne demander une couleur que si le produit a des couleurs disponibles
    if (hasColors && !selectedColor) {
      setToast({ message: 'Please select a color', type: 'error' });
      return;
    }

    // Si le produit a des variants, trouver le variant correspondant
    if (product.variants && product.variants.length > 0) {
      const matching = product.variants.find((v: any) => {
        // Un variant correspond si:
        // - La taille correspond (si une taille est sélectionnée) OU il n'y a pas de tailles
        // - La couleur correspond (si une couleur est sélectionnée) OU il n'y a pas de couleurs
        const sizeMatch = !selectedSize || v.size?.id === selectedSize.id;
        const colorMatch = !selectedColor || v.color?.id === selectedColor.id;
        return sizeMatch && colorMatch;
      });

      if (!matching) {
        setToast({ message: 'Selected combination is not available', type: 'error' });
        return;
      }

      if (matching.stock <= 0) {
        setToast({ message: 'Selected variant is out of stock', type: 'error' });
        return;
      }

      // Use variant price if present
      const productForCart = { ...product, price: matching.price };
      const result = await addItem(productForCart, selectedSize, selectedColor);
      
      if (!result.success) {
        setToast({ message: result.error || 'Failed to add to cart', type: 'error' });
        return;
      }
    } else {
      // Pas de variants - ajouter directement
      const result = await addItem(product, selectedSize, selectedColor);
      
      if (!result.success) {
        setToast({ message: result.error || 'Failed to add to cart', type: 'error' });
        return;
      }
    }

    setToast({ message: `${product.name} added to cart!`, type: 'success' });
  };

  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: `Check out ${product.name} - ${formatPrice(product.price)}`,
      url: window.location.href,
    };

    try {
      // Vérifier si l'API Web Share est disponible
      if (navigator.share) {
        await navigator.share(shareData);
        setToast({ message: 'Shared successfully!', type: 'success' });
      } else {
        // Fallback: copier le lien dans le presse-papier
        await navigator.clipboard.writeText(window.location.href);
        setToast({ message: 'Link copied to clipboard!', type: 'success' });
      }
    } catch (err) {
      // L'utilisateur a annulé le partage ou erreur
      if (err instanceof Error && err.name !== 'AbortError') {
        console.error('Error sharing:', err);
        setToast({ message: 'Failed to share', type: 'error' });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader className="h-8 w-8 animate-spin mx-auto text-gray-600" />
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-red-600">{error || 'Product not found'}</p>
          <Link href="/shop" className="text-blue-600 hover:underline">
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

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
          {/* Product Images */}
          <div className="space-y-4">
            {/* Image Slider */}
            <div className="w-full">
              <ImageGallerySlider
                totalImages={36}
                width={600}
                height={600}
                alt={product.name}
                className="w-full max-w-full rounded-lg"
              />
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

            {/* Description */}
            {product.shortDescription && (
              <p className="text-gray-700">{product.shortDescription}</p>
            )}

            {/* Stock Status */}
            <div className="flex items-center space-x-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  product.inventory?.quantity > 0 ? "bg-green-500" : "bg-red-500"
                }`}
              />
              <span className="text-sm text-gray-600">
                {product.inventory?.quantity > 0 ? "In Stock" : "Out of Stock"}
              </span>
            </div>

            {/* Size & Color Selection */}
            <div className="border-t border-gray-200 pt-6">
              {(product.sizes || []).length > 0 && (
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-gray-700">Size</label>
                  <div className="flex flex-wrap gap-2">
                    {(product.sizes || []).map((s: any) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setSelectedSize(s)}
                        className={`rounded px-3 py-2 text-sm font-medium transition ${
                          selectedSize?.id === s.id ? 'bg-black text-white' : 'border border-gray-300 text-gray-700 hover:border-gray-400'
                        }`}
                      >
                        {s.value}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {(product.colors || []).length > 0 && (
                <div className="mb-4">
                  <label className="mb-2 block text-sm font-medium text-gray-700">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {(product.colors || []).map((c: any) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedColor(c)}
                        className={`flex items-center gap-2 rounded px-3 py-2 text-sm font-medium transition ${
                          selectedColor?.id === c.id ? 'border-2 border-black' : 'border border-gray-300'
                        }`}
                      >
                      <span className="h-4 w-4 rounded-full border" style={{ backgroundColor: c.hex || '#000' }} />
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
              )}
            </div>

            {/* Add to Cart Button */}
            <div className="space-y-3">
              <button
                onClick={handleAddToCart}
                disabled={!product.inventory || product.inventory.quantity <= 0}
                className="w-full bg-gray-900 text-white py-3 px-6 rounded-md font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <ShoppingBag className="h-5 w-5 mr-2" />
                Add to Cart
              </button>

              <button 
                onClick={handleShare}
                className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md font-medium hover:bg-gray-50 transition-colors flex items-center justify-center"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
