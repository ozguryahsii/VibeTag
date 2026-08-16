import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Profile photos are inlined as data URLs for now, so a server action can
  // carry a few hundred KB of image.
  experimental: { serverActions: { bodySizeLimit: "4mb" } },

  // Emits .next/standalone — a self-contained server with only the modules it
  // actually imports. Needed to run this in a container on a VPS; harmless on
  // platforms that build their own bundle.
  output: "standalone",
};

export default nextConfig;
