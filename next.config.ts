import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: { root: process.cwd() },
  experimental: {
    optimizePackageImports: ["radix-ui", "@radix-ui/react-icons"],
  },
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "header", key: "host", value: "thestash.xyz" }],
        destination: "https://www.thestash.xyz/:path*",
        permanent: true,
      },
    ];
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
      {
        protocol: "https",
        hostname: "survey.stackoverflow.co",
        pathname: "/2025/charts/**",
      },
      {
        protocol: "https",
        hostname: "github.blog",
        pathname: "/wp-content/uploads/**",
      },
      {
        protocol: "https",
        hostname: "dora.dev",
        pathname: "/research/**",
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "/gweb-uniblog-publish-prod/images/**",
      },
    ],
  },
};

export default nextConfig;
