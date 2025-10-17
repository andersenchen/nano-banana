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

    // Cost optimization: Responsive images (used with `fill` prop in grids)
    // Covers mobile (640-828) to desktop retina (1080-1200)
    // Removed 1920: overkill for 25vw grid (max 960px @ 4K)
    deviceSizes: [640, 750, 828, 1080, 1200],

    // Cost optimization: Fixed-width images
    // 64: Tree thumbnails (48px display @ 1x-2x DPR)
    // 1080: Detail view (1024px display)
    // Others: Future flexibility for various thumbnail sizes
    imageSizes: [64, 128, 256, 384, 512, 640, 1080],
  },
  allowedDevOrigins: ["play.fullstory.com"],
};

export default nextConfig;
