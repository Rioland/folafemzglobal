import raw from '@/data/content.json';

/* --------------------------------------------------------------------------
   Types
   --------------------------------------------------------------------------
   The shapes below mirror the Laravel schema exactly. content.json is generated
   from the seeded database by scripts/export-content.php, so re-running that
   script after editing the Laravel dashboard refreshes this whole site.
   -------------------------------------------------------------------------- */

export type Vehicle = {
  name: string;
  slug: string;
  category: string;
  categorySlug: string;
  dailyRate: number | null;
  dailyLabel: string | null;
  secondaryRate: number | null;
  secondaryLabel: string | null;
  rateNote: string | null;
  seats: string | null;
  description: string | null;
  image: string | null;
  isFeatured: boolean;
};

export type Category = { name: string; slug: string };

export type City = {
  name: string;
  slug: string;
  state: string | null;
  tagline: string | null;
  rating: string | null;
  areasSummary: string | null;
  intro: string | null;
  highlights: string[];
  officeAddress: string | null;
  airportBranch: string | null;
  heroImage: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
};

export type Location = {
  name: string;
  slug: string;
  city: string;
  citySlug: string;
  landmarks: string | null;
  blurb: string | null;
};

export type Service = {
  name: string;
  slug: string;
  linkLabel: string | null;
  headlineTemplate: string | null;
  summary: string | null;
  body: string | null;
  image: string | null;
  showInDirectory: boolean;
  hasLandingPage: boolean;
};

export type Post = {
  title: string;
  slug: string;
  category: string | null;
  excerpt: string | null;
  body: string | null;
  coverImage: string | null;
  readMinutes: number;
  author: string | null;
  publishedAt: string | null;
  isFeatured: boolean;
};

export type Faq = { question: string; answer: string };
export type Page = { title: string; slug: string; body: string | null; showInFooter: boolean };
export type Testimonial = {
  name: string; role: string | null; quote: string;
  rating: number; service: string | null; reviewedOn: string | null;
};

export type Settings = {
  siteName: string; tagline: string; logo: string | null;
  phone: string; phoneAlt: string[]; whatsapp: string; email: string;
  addressPrimary: string; addressSecondary: string; businessHours: string;
  heroEyebrow: string; heroHeading: string; heroSubheading: string; heroImage: string | null;
  fleetNote: string; aboutHeading: string; aboutBody: string; trustPoints: string[];
  statYears: string; statClients: string; statVehicles: string; statRating: string;
  metaTitle: string; metaDescription: string; metaKeywords: string; ogImage: string | null;
  facebookUrl: string; instagramUrl: string; twitterUrl: string; tiktokUrl: string;
};

type Content = {
  settings: Settings;
  categories: Category[];
  vehicles: Vehicle[];
  cities: City[];
  locations: Location[];
  services: Service[];
  posts: Post[];
  faqs: Faq[];
  pages: Page[];
  testimonials: Testimonial[];
};

const content = raw as Content;

export const settings = content.settings;
export const categories = content.categories;
export const vehicles = content.vehicles;
export const cities = content.cities;
export const locations = content.locations;
export const services = content.services;
export const posts = content.posts;
export const faqs = content.faqs;
export const pages = content.pages;
export const testimonials = content.testimonials;

/* --------------------------------------------------------------------------
   Lookups
   -------------------------------------------------------------------------- */

export const directoryServices = services.filter((s) => s.showInDirectory);
export const landingServices = services.filter((s) => s.hasLandingPage);

export const getCity = (slug: string) => cities.find((c) => c.slug === slug);
export const getService = (slug: string) => services.find((s) => s.slug === slug);
export const getLocation = (slug: string) => locations.find((l) => l.slug === slug);
export const getPost = (slug: string) => posts.find((p) => p.slug === slug);
export const getPage = (slug: string) => pages.find((p) => p.slug === slug);

export const locationsInCity = (citySlug: string) =>
  locations.filter((l) => l.citySlug === citySlug);

export const postCategories = Array.from(
  new Set(posts.map((p) => p.category).filter(Boolean) as string[])
);

/**
 * Every area × every directory service. This is the SEO engine carried over
 * from the Laravel build: 29 areas × 10 services = 290 generated pages.
 */
export function locationServicePairs() {
  const pairs: { service: Service; location: Location; slug: string }[] = [];
  for (const service of directoryServices) {
    for (const location of locations) {
      pairs.push({ service, location, slug: `${service.slug}-${location.slug}` });
    }
  }
  return pairs;
}

/**
 * Resolve `/locations/moving-truck-lekki-phase-1` back to its service and area.
 * Longest service slug first, so `moving-truck` cannot be shadowed by a shorter
 * slug that happens to be a prefix of it.
 */
export function resolveLocationService(slug: string) {
  const ordered = [...directoryServices].sort((a, b) => b.slug.length - a.slug.length);

  for (const service of ordered) {
    const prefix = `${service.slug}-`;
    if (!slug.startsWith(prefix)) continue;

    const location = getLocation(slug.slice(prefix.length));
    if (location) return { service, location };
  }

  return null;
}

/** "{service} in {location}, {city}" with the tokens filled in. */
export function headline(service: Service, location: Location) {
  const template = service.headlineTemplate || '{service} in {location}, {city}';
  return template
    .replace('{service}', service.name)
    .replace('{location}', location.name)
    .replace('{city}', location.city);
}

/* --------------------------------------------------------------------------
   Money
   -------------------------------------------------------------------------- */

export const naira = (amount: number) => `NGN${amount.toLocaleString('en-NG')}`;

export function priceLabel(vehicle: Vehicle) {
  if (!vehicle.dailyRate) return vehicle.rateNote || 'Contact us';
  return naira(vehicle.dailyRate);
}

export function secondaryPriceLabel(vehicle: Vehicle) {
  if (!vehicle.secondaryRate) return null;
  return naira(vehicle.secondaryRate);
}
