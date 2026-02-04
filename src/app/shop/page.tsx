import { Suspense } from "react";
import ProductListClient from '@/components/ProductListClient';

export default function ShopPage() {
  return (
    <div className="min-h-screen bg-white">
      <section>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Suspense
            fallback={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-96 bg-gray-100 animate-pulse" />
                ))}
              </div>
            }
          >
            <ProductListClient limit={50} />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
