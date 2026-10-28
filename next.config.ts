import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  // Loaded at runtime by the PDF export route; bundling breaks their binary lookups.
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium-min', 'pptxgenjs'],
  experimental: {
    serverActions: {
      allowedOrigins: [
        'presentation.getfunnels.agency',
        'www.presentation.getfunnels.agency',
        'localhost:3000',
        'localhost:3005',
        '72.61.108.216:3005',
      ],
    },
  },
};

export default nextConfig;