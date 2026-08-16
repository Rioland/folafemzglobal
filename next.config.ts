import type { NextConfig } from 'next';

const config: NextConfig = {
  /*
   * Not a static export any more.
   *
   * The site was `output: 'export'` while it was destined for Hostinger's
   * public_html. It now runs on Vercel, and /api/enquiry needs a Node runtime to
   * open an SMTP connection — something a static export has no way to do.
   *
   * Every page is still prerendered at build time; only the enquiry endpoint is
   * dynamic. If you ever need the static export back, delete app/api/ and put
   * `output: 'export'` here again.
   */

  // Vercel runs the image optimiser, so local photos get resized and served as
  // AVIF/WebP automatically.
  images: {
    formats: ['image/avif', 'image/webp'],
  },

  // Keeps every existing URL ending in a slash, matching the Laravel routes and
  // the URLs already in sitemap.xml.
  trailingSlash: true,

  poweredByHeader: false,
};

export default config;
