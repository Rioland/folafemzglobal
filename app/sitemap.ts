import type { MetadataRoute } from 'next';
import { cities, landingServices, locationServicePairs, pages, posts } from '@/lib/content';

import { SITE_URL } from '@/lib/site';

const BASE = SITE_URL;

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: `${BASE}/`, priority: 1.0, changeFrequency: 'weekly', lastModified: now },
    { url: `${BASE}/blog/`, priority: 0.7, changeFrequency: 'weekly', lastModified: now },
    { url: `${BASE}/location-directory/`, priority: 0.8, changeFrequency: 'monthly', lastModified: now },
    { url: `${BASE}/contact/`, priority: 0.6, changeFrequency: 'yearly', lastModified: now },

    ...cities.map((c) => ({
      url: `${BASE}/car-rental-${c.slug}/`, priority: 0.9,
      changeFrequency: 'monthly' as const, lastModified: now,
    })),
    ...landingServices.map((s) => ({
      url: `${BASE}/services/${s.slug}/`, priority: 0.8,
      changeFrequency: 'monthly' as const, lastModified: now,
    })),
    ...locationServicePairs().map(({ slug }) => ({
      url: `${BASE}/locations/${slug}/`, priority: 0.6,
      changeFrequency: 'monthly' as const, lastModified: now,
    })),
    ...posts.map((p) => ({
      url: `${BASE}/articles/${p.slug}/`, priority: 0.6,
      changeFrequency: 'yearly' as const,
      lastModified: p.publishedAt ? new Date(p.publishedAt) : now,
    })),
    ...pages.map((p) => ({
      url: `${BASE}/${p.slug}/`, priority: 0.3,
      changeFrequency: 'yearly' as const, lastModified: now,
    })),
  ];
}
