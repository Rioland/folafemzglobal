import type { NextConfig } from 'next';

const config: NextConfig = {
  // Static HTML export — the whole site is files, no Node server to run.
  // Drops straight into Hostinger's public_html, Vercel, Netlify or S3.
  output: 'export',

  // next/image's optimiser needs a server; a static export has none.
  images: { unoptimized: true },

  // Emit /fleet/index.html rather than /fleet.html so Apache serves clean URLs
  // without any rewrite rules.
  trailingSlash: true,
};

export default config;
