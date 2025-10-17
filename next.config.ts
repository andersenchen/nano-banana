import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "rkfjktuwdwktjobigjti.supabase.co",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
      },
    ],
    // Cost optimization: Use only WebP format instead of AVIF+WebP
    // This halves the number of image transformations
    formats: ["image/webp"],

    // Cost optimization: Set 31-day cache for user-generated content
    // Reduces transformations and cache writes since images don't change
    minimumCacheTTL: 2678400, // 31 days

    // Cost optimization: Limit quality options to reduce transformations
    // Grid thumbnails use 75, detail views use 90
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [256, 384, 640, 750, 828, 1080],
  },
  allowedDevOrigins: ["play.fullstory.com"],
};

export default nextConfig;
