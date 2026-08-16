/**
 * Canonical origin for the site.
 *
 * Used by metadataBase, the sitemap and robots.txt, so canonical tags and
 * sitemap entries all agree. Override with NEXT_PUBLIC_SITE_URL in Vercel if the
 * domain ever changes; the default is the production domain.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://folafemzglobal.com'
).replace(/\/+$/, '');
