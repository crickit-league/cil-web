import type { NextConfig } from "next";

// next/image only optimizes hosts it's told about. The photo bucket's public
// origin comes from env (docs/service-setup.md §Cloudflare R2), so parse it here.
function photoHostPattern() {
  const base = process.env.R2_PUBLIC_BASE_URL;
  if (!base) return [];
  try {
    const url = new URL(base);
    return [
      {
        protocol: url.protocol.replace(":", "") as "http" | "https",
        hostname: url.hostname,
        port: url.port,
        pathname: "/**",
      },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: photoHostPattern(),
  },
  experimental: {
    // Photos are resized in the browser to a few hundred KB before upload
    // (admin/photos/resize-image.ts); the 1 MB default is too tight.
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
