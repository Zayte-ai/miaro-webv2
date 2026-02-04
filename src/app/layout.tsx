import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ClientInit from "@/components/ClientInit";
import "@/lib/env"; // Validate environment variables on startup

export const metadata: Metadata = {
  title: "MaisonMiaro - Premium Clothing",
  description:
    "Discover timeless clothing pieces crafted with attention to detail and quality. Modern elegance meets sustainable fashion.",
  keywords: "fashion, clothing, premium, sustainable, modern, elegant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="font-sans antialiased min-h-screen flex flex-col"
      >
        <ClientInit />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
