import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse-new"],
  // The Playwright E2E server sets NEXT_DIST_DIR so it can run next to a normal
  // `next dev` (Next.js locks the build folder per dev server).
  distDir: process.env.NEXT_DIST_DIR || ".next",
};

export default nextConfig;
