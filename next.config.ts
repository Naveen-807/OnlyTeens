import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Avoid Next.js picking an incorrect monorepo root when multiple lockfiles exist.
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
};

export default nextConfig;
