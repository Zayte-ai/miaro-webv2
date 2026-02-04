import Link from "next/link";
import HeroVideo from "@/components/HeroVideo";
import ProductCard from "@/components/ProductCard";
import { getFeaturedProducts } from "@/lib/data";

export default function Home() {
  const featuredProducts = getFeaturedProducts();
  return (
    <main className="min-h-screen select-none" style={{ userSelect: "none" }}>
      {/* Hero Section */}
      <section className="relative min-h-[100vh] h-screen flex items-center justify-center overflow-hidden">
        {/* Video Background test */}
        <HeroVideo />
        <div className="relative z-10 text-center max-w-4xl px-4 flex flex-col justify-center items-center h-full">
          <h1
            className="font-bold text-white mb-6 leading-tight"
            style={{
              fontFamily: "Instrument Serif, serif",
              maxWidth: "100vw",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            <span className="block text-xl md:text-4xl font-normal max-w-full whitespace-nowrap overflow-hidden text-ellipsis">
              <span className="text-black">MAISON</span>
            </span>
            <span
              className="block text-[7rem] md:text-[10rem] leading-none max-w-full whitespace-nowrap overflow-hidden text-ellipsis"
              style={{ maxWidth: "100vw" }}
            >
              <span className="text-black">MIARO</span>
            </span>
          </h1>
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/shop"
              className="explore-collection-btn border border-black text-black px-8 py-4 rounded-full font-light text-lg tracking-wide transition-all group inline-flex items-center hover:text-[#222] hover:border-[#222] flex-shrink-0 whitespace-nowrap min-w-[220px] justify-center"
              style={{
                fontFamily: "League Spartan, sans-serif",
                fontWeight: 400,
                backgroundColor: "transparent",
              }}
            >
              <span className="relative flex flex-row items-center transition-all duration-300 text-black">
                <span>Explore collection</span>
                <span className="w-0 group-hover:w-6 flex items-center justify-center overflow-hidden transition-all duration-300">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-2xl pointer-events-none select-none ml-1 text-black">
                    →
                  </span>
                </span>
              </span>
            </Link>


          </div>
        </div>
      </section>

      {/* Featured Products (désactivé temporairement) */}
      {/*
      <section className="bg-white p-0 m-0">
        <div className="min-h-screen p-0 m-0">
          <div className="min-h-screen flex flex-col gap-0 p-0 m-0">
            {featuredProducts.map((product) => (
              <div key={product.id} className="w-screen max-w-full h-screen max-h-screen overflow-hidden relative">
                <ProductCard
                  product={product}
                  imageOnly
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                  <span className="text-4xl md:text-6xl font-bold text-white drop-shadow-lg bg-black/40 px-8 py-4 rounded-lg uppercase tracking-wide">
                    {product.category?.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      */}
    </main>
  );
}