import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Loaded at runtime by the PDF export route; bundling breaks their binary lookups.
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium-min', 'pptxgenjs'],
};

export default nextConfig;