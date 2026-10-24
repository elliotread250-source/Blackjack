import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [390, 640, 750, 828, 1080, 1280, 1600, 1920, 2400],
    imageSizes: [64, 96, 128, 256, 384],
    qualities: [60, 75, 82],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  experimental: {
    optimizePackageImports: ["framer-motion", "gsap"],
  },
  async redirects() {
    // Old Squarespace URLs, so Google results and shared links keep working.
    return [
      { source: "/cluboverview", destination: "/club-overview", statusCode: 301 },
      { source: "/cart", destination: "/merch", statusCode: 301 },
      { source: "/home", destination: "/", statusCode: 301 },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/images/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },
    ];
  },
};

export default nextConfig;
