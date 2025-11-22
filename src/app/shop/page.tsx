import ProductCard from "@/components/ProductCard";
import { products, categories } from "@/lib/data";
import { Suspense } from "react";

export default function ShopPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Filter Section */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-4 items-center justify-center">
            <Suspense
              fallback={
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-gray-200 rounded-lg h-96 animate-pulse"
                    />
                  ))}
                </div>
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    showQuickAdd={true}
                  />
                ))}
              </div>
            </Suspense>
          </div>
        </div>
      </section>
    </div>
  );
}
