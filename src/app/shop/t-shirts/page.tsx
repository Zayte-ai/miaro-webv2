import { Metadata } from "next";
import { products } from "@/lib/data";
import ProductCard from "@/components/ProductCard";

export const metadata: Metadata = {
  title: "T-Shirts | MaisonMiaro",
  description:
    "Discover our collection of premium t-shirts. From classic basics to statement pieces, find the perfect tee for your wardrobe.",
};

export default function TShirtsPage() {
  // Filter products for t-shirts category
  const tshirtProducts = products.filter(
    (product) => product.category.slug === "t-shirts"
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">T-Shirts</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Premium quality t-shirts crafted from the finest materials.
              Discover our range of classic basics and contemporary designs.
            </p>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            All T-Shirts ({tshirtProducts.length})
          </h2>

          {/* Sort dropdown */}
          <select className="border border-gray-300 rounded-md px-4 py-2 text-sm">
            <option>Sort by: Featured</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Newest First</option>
          </select>
        </div>

        {tshirtProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {tshirtProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No t-shirts available
            </h3>
            <p className="text-gray-600">Check back soon for new arrivals!</p>
          </div>
        )}

        {/* Category Info */}
        <div className="mt-16 bg-gray-50 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Why Choose Our T-Shirts?
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Premium Materials
              </h4>
              <p className="text-gray-600">
                Made from 100% organic cotton and sustainable blends for comfort
                and durability.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Perfect Fit</h4>
              <p className="text-gray-600">
                Carefully designed cuts that flatter every body type with sizes
                from XS to XXL.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Versatile Styles
              </h4>
              <p className="text-gray-600">
                From minimalist basics to statement pieces that work for any
                occasion.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Easy Care</h4>
              <p className="text-gray-600">
                Machine washable with colorfast dyes that maintain their
                vibrancy wash after wash.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
