import { Metadata } from "next";
import { products } from "@/lib/data";
import ProductCard from "@/components/ProductCard";

export const metadata: Metadata = {
  title: "Jackets | MaisonMiaro",
  description:
    "Explore our jacket collection. From lightweight layers to statement outerwear, crafted for style and functionality.",
};

export default function JacketsPage() {
  // Filter products for jackets category
  const jacketProducts = products.filter(
    (product) => product.category.slug === "jackets"
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Jackets</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Premium outerwear designed for style and function. From
              lightweight layers to statement pieces, find the perfect jacket
              for every season.
            </p>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            All Jackets ({jacketProducts.length})
          </h2>

          {/* Sort dropdown */}
          <select className="border border-gray-300 rounded-md px-4 py-2 text-sm">
            <option>Sort by: Featured</option>
            <option>Price: Low to High</option>
            <option>Price: High to Low</option>
            <option>Newest First</option>
          </select>
        </div>

        {jacketProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {jacketProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No jackets available
            </h3>
            <p className="text-gray-600">Check back soon for new arrivals!</p>
          </div>
        )}

        {/* Category Info */}
        <div className="mt-16 bg-gray-50 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Outerwear Excellence
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Weather Protection
              </h4>
              <p className="text-gray-600">
                Designed to protect against the elements while maintaining
                breathability.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Versatile Styles
              </h4>
              <p className="text-gray-600">
                From casual bombers to sophisticated blazers, perfect for any
                occasion.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Premium Materials
              </h4>
              <p className="text-gray-600">
                High-quality fabrics and technical materials for durability and
                comfort.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Thoughtful Design
              </h4>
              <p className="text-gray-600">
                Functional pockets, quality zippers, and details that matter.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
