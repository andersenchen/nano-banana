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
  },
  allowedDevOrigins: ["play.fullstory.com"],
};

export default nextConfig;
