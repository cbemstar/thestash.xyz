import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  experimental: {
    optimizePackageImports: ["radix-ui", "@radix-ui/react-icons"],
  },
  async rewrites() {
    return [{ source: "/ads.txt", destination: "/api/ads-txt" }];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.sanity.io",
        pathname: "/images/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
