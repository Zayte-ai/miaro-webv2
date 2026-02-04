import Link from "next/link";
import { Instagram, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white text-black" style={{ fontFamily: 'League Spartan, sans-serif' }}>
      {/* Newsletter Section */}
      <div className="w-full bg-white text-black">
        {/* Divider between page and Stay Updated */}
        <div className="w-full">
          <div className="h-4 flex items-center">
            <div className="w-full border-t border-gray-200" style={{ borderTopWidth: 1 }}></div>
          </div>
        </div>
        <div className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Stay Updated</h2>
          <form className="w-full flex flex-col items-center justify-center">
            <div className="w-full max-w-md flex flex-col sm:flex-row gap-4 items-center justify-center">
              <input
                type="email"
                placeholder="e.g. you@email.com"
                className="w-full sm:w-auto px-4 py-3 rounded-md text-gray-900 border-2 border-gray-300 bg-gray-100 focus:outline-none focus:ring-2 focus:ring-black text-center sm:text-left transition-colors placeholder:text-gray-400"
              />
              <button
                type="submit"
                className="bg-black text-white px-6 py-3 rounded-md font-medium hover:bg-gray-900 transition-colors flex-shrink-0 w-full sm:w-auto"
                style={{ alignSelf: 'stretch' }}
              >
                Subscribe
              </button>
            </div>
          </form>
          {/* Divider below newsletter */}
          <div className="w-full flex justify-center mt-12">
            <div className="w-full max-w-md">
              <div className="border-t border-dashed border-gray-300" style={{ borderTopWidth: 2 }}></div>
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2 flex flex-col items-center md:items-start">
            <Link href="/" className="block mb-4 text-center" style={{ fontFamily: "Instrument Serif, serif" }}>
              <span className="block text-sm md:text-lg font-bold text-black">
                MAISON
              </span>
              <span className="block text-3xl md:text-4xl font-normal text-black leading-none">
                MIARO
              </span>
            </Link>
            <div className="flex space-x-4 mt-6">
                <a
                href="https://www.instagram.com/maison.miaro?igsh=NndkdGMweHk3Zjhs"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black hover:text-black transition-colors"
                aria-label="Instagram"
>
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="mailto:contact@maisonmiaro.com"
                className="text-black hover:text-black transition-colors"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>

          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl md:text-2xl font-bold mb-4" style={{ fontFamily: "League Spartan, sans-serif" }}>Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/shop"
                  className="text-black hover:text-black transition-colors"
                >
                  Shop All
                </Link>
              </li>
              {/* 
              <li>
                <Link
                  href="/shop/t-shirts"
                  className="text-black hover:text-black transition-colors"
                >
                  T-Shirts
                </Link>
              </li>
              <li>
                <Link
                  href="/shop/hoodies"
                  className="text-black hover:text-black transition-colors"
                >
                  Hoodies
                </Link>
              </li>
               <li>
                <Link
                  href="/shop/jackets"
                  className="text-black hover:text-black transition-colors"
                >
                  Jackets
                </Link>
              </li>
              */}
              <li>
                <Link
                  href="/shop/jeans"
                  className="text-black hover:text-black transition-colors"
                >
                  Jeans
                </Link>
              </li>
             
            </ul>
          </div>
          


          {/* Customer Care */}
          <div>
            <h3 className="text-xl md:text-2xl font-bold mb-4" style={{ fontFamily: "League Spartan, sans-serif" }}>Customer Care</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/contact"
                  className="text-black hover:text-black transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping"
                  className="text-black hover:text-black transition-colors"
                >
                  Shipping Info
                </Link>
              </li>
              <li>
                <Link
                  href="/returns"
                  className="text-black hover:text-black transition-colors"
                >
                  Returns
                </Link>
              </li>
            </ul>
          </div>
        </div>


        <div className="border-t border-gray-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 text-sm">
            © 2024 MaisonMiaro. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link
              href="/privacy"
              className="text-black hover:text-black text-sm transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-black hover:text-black text-sm transition-colors"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
