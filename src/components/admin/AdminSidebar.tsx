"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminStore } from "@/store/admin";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Tag,
} from "lucide-react";

interface AdminSidebarProps {
  className?: string;
}

export default function AdminSidebar({ className = "" }: AdminSidebarProps) {
  const pathname = usePathname();
  const { adminUser, logoutAdmin } = useAdminStore();

  const displayName = adminUser
    ? `${adminUser.firstName ?? ""} ${adminUser.lastName ?? ""}`.trim() ||
      adminUser.email
    : "Admin";

  const sidebarItems = [
    {
      icon: LayoutDashboard,
      label: "Dashboard",
      href: "/admin/dashboard",
      active: pathname === "/admin/dashboard",
    },
    {
      icon: Package,
      label: "Products",
      href: "/admin/dashboard/products",
      active: pathname.startsWith("/admin/dashboard/products"),
    },
    {
      icon: Tag,
      label: "Categories",
      href: "/admin/dashboard/categories",
      active: pathname.startsWith("/admin/dashboard/categories"),
    },
    {
      icon: ShoppingCart,
      label: "Orders",
      href: "/admin/dashboard/orders",
      active: pathname.startsWith("/admin/dashboard/orders"),
    },
    {
      icon: Users,
      label: "Customers",
      href: "/admin/dashboard/customers",
      active: pathname.startsWith("/admin/dashboard/customers"),
    },
    {
      icon: BarChart3,
      label: "Analytics",
      href: "/admin/dashboard/analytics",
      active: pathname.startsWith("/admin/dashboard/analytics"),
    },
    {
      icon: Settings,
      label: "Settings",
      href: "/admin/dashboard/settings",
      active: pathname.startsWith("/admin/dashboard/settings"),
    },
  ];

  const handleLogout = () => {
    logoutAdmin();
    window.location.href = "/admin";
  };

  return (
    <div className={`w-64 bg-white shadow-lg flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-center h-16 border-b">
        <h1 className="text-xl font-bold text-gray-900">MaisonMiaro Admin</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-6">
        {sidebarItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-6 py-3 text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors ${
              item.active
                ? "bg-gray-100 text-gray-900 border-r-2 border-black"
                : ""
            }`}
          >
            <item.icon className="h-5 w-5 mr-3" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t p-6">
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-900">{displayName}</p>
          <p className="text-xs text-gray-500">{adminUser?.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
          <LogOut className="h-5 w-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
}
