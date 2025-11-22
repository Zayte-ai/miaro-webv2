import { Metadata } from "next";
import { products } from "@/lib/data";
import ProductCard from "@/components/ProductCard";

export const metadata: Metadata = {
  title: "Jeans | MaisonMiaro",
  description:
    "Discover our premium denim collection. Classic and contemporary jeans crafted for style and durability.",
};

export default function JeansPage() {
  // Filter products for jeans category
  const jeansProducts = products.filter(
    (product) => product.category.slug === "jeans"
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Jeans</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Premium denim crafted with precision. From classic cuts to modern
              fits, find the perfect pair that combines style, comfort, and
              durability.
            </p>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            All Jeans ({jeansProducts.length})
          </h2>

          {/* Sort dropdown */}
          <select className="border border-gray-300 rounded-md px-4 py-2 text-sm">
            <option>Sort by: Featured</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Newest First</option>
          </select>
        </div>

        {jeansProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {jeansProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No jeans available
            </h3>
            <p className="text-gray-600">Check back soon for new arrivals!</p>
          </div>
        )}

        {/* Category Info */}
        <div className="mt-16 bg-gray-50 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Premium Denim Collection
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Quality Denim
              </h4>
              <p className="text-gray-600">
                Made from premium cotton denim with the perfect blend of
                durability and comfort.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Perfect Fit</h4>
              <p className="text-gray-600">
                Multiple cuts and sizes to ensure the perfect fit for every body
                type.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Timeless Style
              </h4>
              <p className="text-gray-600">
                Classic designs that never go out of style, perfect for any
                wardrobe.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Sustainable Process
              </h4>
              <p className="text-gray-600">
                Eco-friendly manufacturing processes with responsible water
                usage.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
