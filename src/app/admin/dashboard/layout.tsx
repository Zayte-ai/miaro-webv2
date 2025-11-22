"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "@/store/admin";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAdminAuthenticated } = useAdminStore();
  const router = useRouter();

  useEffect(() => {
    if (!isAdminAuthenticated) {
      router.replace("/admin");
    }
  }, [isAdminAuthenticated, router]);

  if (!isAdminAuthenticated) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-black" />
        <p className="mt-4 text-sm text-gray-600">Checking authentication…</p>
      </div>
    );
  }

  return <>{children}</>;
}
