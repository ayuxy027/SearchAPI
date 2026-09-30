import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: { "/**": ["./data/*.json"] },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "media.licdn.com" },
      { protocol: "https", hostname: "**.cdninstagram.com" },
      { protocol: "https", hostname: "**.fbcdn.net" },
    ],
  },
};

export default nextConfig;
