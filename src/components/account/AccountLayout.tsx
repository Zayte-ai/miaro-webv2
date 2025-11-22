"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserStore } from "@/store/user";
import {
  User,
  ShoppingBag,
  Heart,
  CreditCard,
  Settings,
  LogOut,
} from "lucide-react";

interface AccountLayoutProps {
  children: React.ReactNode;
}

export default function AccountLayout({ children }: AccountLayoutProps) {
  const { user, logout } = useUserStore();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    {
      name: "Account Overview",
      href: "/account",
      icon: User,
      current: pathname === "/account",
    },
    {
      name: "Orders",
      href: "/account/orders",
      icon: ShoppingBag,
      current: pathname === "/account/orders",
    },
    {
      name: "Wishlist",
      href: "/account/wishlist",
      icon: Heart,
      current: pathname === "/account/wishlist",
    },
    {
      name: "Payment Methods",
      href: "/account/payment",
      icon: CreditCard,
      current: pathname === "/account/payment",
    },
    {
      name: "Account Settings",
      href: "/account/settings",
      icon: Settings,
      current: pathname === "/account/settings",
    },
  ];

  const handleLogout = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <div className="bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Account</h1>

        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Mobile navigation toggle */}
          <div className="block lg:hidden mb-6">
            <button
              type="button"
              className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <span>Account Navigation</span>
              <svg
                className={`h-5 w-5 transform ${
                  isMobileMenuOpen ? "rotate-180" : ""
                }`}
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {/* Sidebar for desktop / Mobile dropdown menu */}
          <aside
            className={`${
              isMobileMenuOpen ? "block" : "hidden"
            } lg:block lg:col-span-3`}
          >
            <nav className="space-y-1 bg-white shadow rounded-lg overflow-hidden">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium ${
                    item.current
                      ? "bg-gray-50 text-black"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      item.current ? "text-black" : "text-gray-500"
                    }`}
                  />
                  {item.name}
                </Link>
              ))}

              <button
                onClick={handleLogout}
                className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              >
                <LogOut className="mr-3 h-5 w-5 text-gray-500" />
                Sign Out
              </button>
            </nav>
          </aside>

          {/* Main content */}
          <main className="mt-6 lg:mt-0 lg:col-span-9">{children}</main>
        </div>
      </div>
    </div>
  );
}
