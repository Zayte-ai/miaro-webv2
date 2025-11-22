import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard | MaisonMiaro",
  description:
    "Admin dashboard for managing MaisonMiaro products, inventory, and orders.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-gray-50">{children}</div>;
}
