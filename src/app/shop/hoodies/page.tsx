import { Metadata } from "next";
import { products } from "@/lib/data";
import ProductCard from "@/components/ProductCard";

export const metadata: Metadata = {
  title: "Hoodies | MaisonMiaro",
  description:
    "Explore our premium hoodie collection. Cozy, stylish, and crafted for comfort with modern designs.",
};

export default function HoodiesPage() {
  // Filter products for hoodies category
  const hoodieProducts = products.filter(
    (product) => product.category.slug === "hoodies"
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Hoodies</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Premium hoodies designed for comfort and style. Perfect for
              layering or wearing solo, crafted with attention to detail.
            </p>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            All Hoodies ({hoodieProducts.length})
          </h2>

          {/* Sort dropdown */}
          <select className="border border-gray-300 rounded-md px-4 py-2 text-sm">
            <option>Sort by: Featured</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Newest First</option>
          </select>
        </div>

        {hoodieProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {hoodieProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hoodies available
            </h3>
            <p className="text-gray-600">Check back soon for new arrivals!</p>
          </div>
        )}

        {/* Category Info */}
        <div className="mt-16 bg-gray-50 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Our Hoodie Collection
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Comfort First
              </h4>
              <p className="text-gray-600">
                Soft fleece interior and durable exterior fabric for all-day
                comfort.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Modern Fits</h4>
              <p className="text-gray-600">
                Contemporary silhouettes that work for casual outings and
                athletic activities.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Quality Details
              </h4>
              <p className="text-gray-600">
                Reinforced seams, quality zippers, and drawstrings built to
                last.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Seasonal Versatility
              </h4>
              <p className="text-gray-600">
                Perfect for layering in winter or wearing solo during cool
                evenings.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
