import { Metadata } from "next";
import { products } from "@/lib/data";
import ProductCard from "@/components/ProductCard";

export const metadata: Metadata = {
  title: "Accessories | MaisonMiaro",
  description:
    "Complete your look with our premium accessories. From bags to jewelry, find the perfect finishing touches.",
};

export default function AccessoriesPage() {
  // Filter products for accessories category
  const accessoryProducts = products.filter(
    (product) => product.category.slug === "accessories"
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Accessories
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Complete your outfit with our curated collection of premium
              accessories. From bags and belts to jewelry and hats, find the
              perfect finishing touches.
            </p>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            All Accessories ({accessoryProducts.length})
          </h2>

          {/* Sort dropdown */}
          <select className="border border-gray-300 rounded-md px-4 py-2 text-sm">
            <option>Sort by: Featured</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Newest First</option>
          </select>
        </div>

        {accessoryProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {accessoryProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No accessories available
            </h3>
            <p className="text-gray-600">Check back soon for new arrivals!</p>
          </div>
        )}

        {/* Category Info */}
        <div className="mt-16 bg-gray-50 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Accessory Collection
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Statement Pieces
              </h4>
              <p className="text-gray-600">
                Carefully selected accessories that add personality to any
                outfit.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Quality Craftsmanship
              </h4>
              <p className="text-gray-600">
                Made with attention to detail using premium materials and
                techniques.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Versatile Styling
              </h4>
              <p className="text-gray-600">
                Pieces that work across seasons and can be styled multiple ways.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Functional Design
              </h4>
              <p className="text-gray-600">
                Beautiful accessories that are as functional as they are
                stylish.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
