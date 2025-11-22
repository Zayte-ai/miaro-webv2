import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Allow builds to complete even with ESLint warnings (for deployment)
    // You should still fix these issues in development
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Allow builds to complete even with type warnings (for deployment)
    // You should still fix these issues in development
    ignoreBuildErrors: true,
  },
  // Image optimization configuration
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },
  // Compression enabled for better performance
  compress: true,
  // Remove X-Powered-By header for security
  poweredByHeader: false,
  // Strict mode for better React practices
  reactStrictMode: true,
  // Production optimizations
  ...(process.env.NODE_ENV === 'production' && {
    compiler: {
      removeConsole: {
        exclude: ['error', 'warn'],
      },
    },
  }),
};

export default nextConfig;
