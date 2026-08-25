import { cities, naira, settings, tripRates, vehicles } from './content';
import { SITE_URL } from './site';

/* --------------------------------------------------------------------------
   Structured data
   --------------------------------------------------------------------------
   Schema.org markup is how a search engine learns the things a page never says
   outright: that this is a vehicle hire business, where it operates, what it
   charges, who to ring. It does not buy rankings, but it is what rich results
   (prices, hours, contact) are built from.

   One deliberate omission: no aggregateRating. The site hides testimonials
   until real ones exist, and claiming a star rating without reviews to back it
   is a manual-action risk, not a shortcut. The same rule applies here.
   -------------------------------------------------------------------------- */

const abs = (path: string) => (path.startsWith('http') ? path : `${SITE_URL}${path}`);

/** Nigerian local numbers dial internationally as +234. */
const e164 = (n: string) => {
  const d = n.replace(/[^\d]/g, '');
  return d.startsWith('234') ? `+${d}` : `+234${d.replace(/^0/, '')}`;
};

const socials = [
  settings.facebookUrl, settings.instagramUrl,
  settings.twitterUrl, settings.tiktokUrl,
].filter((u) => u && u.trim() !== '');

/** Cheapest to dearest across everything with a published rate. */
function priceRange() {
  const rates = vehicles.map((v) => v.dailyRate).filter((r): r is number => !!r);
  if (!rates.length) return undefined;
  return `${naira(Math.min(...rates))} - ${naira(Math.max(...rates))} per day`;
}

export function businessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'AutoRental',
    '@id': `${SITE_URL}/#business`,
    name: settings.siteName,
    description: settings.metaDescription,
    url: SITE_URL,
    telephone: e164(settings.phone),
    email: settings.email,
    image: abs(settings.ogImage || settings.logo || '/images/brand-lockup.jpg'),
    logo: abs(settings.logo || '/images/brand-mark.jpg'),
    priceRange: priceRange(),
    currenciesAccepted: 'NGN',
    ...(socials.length ? { sameAs: socials } : {}),

    // The desk is staffed around the clock, which is a genuine differentiator
    // and shows in results as opening hours.
    openingHoursSpecification: [{
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '00:00',
      closes: '23:59',
    }],

    // Every city with a page, so a search engine can connect the business to
    // the places it actually operates in.
    areaServed: cities.map((c) => ({
      '@type': 'City',
      name: c.name,
      ...(c.state ? { containedInPlace: { '@type': 'State', name: c.state } } : {}),
    })),

    address: [settings.addressPrimary, settings.addressSecondary]
      .filter(Boolean)
      .map((a) => ({ '@type': 'PostalAddress', streetAddress: a, addressCountry: 'NG' })),

    contactPoint: [{
      '@type': 'ContactPoint',
      telephone: e164(settings.phone),
      contactType: 'reservations',
      availableLanguage: ['en'],
      areaServed: 'NG',
    }],
  };
}

/**
 * The fleet as an offer catalogue. This is what can surface a price directly
 * in a result, so only vehicles with a published rate are included — an
 * "on request" vehicle has no offer to make.
 */
export function fleetSchema() {
  const priced = vehicles.filter((v) => v.dailyRate);

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${settings.siteName} fleet`,
    numberOfItems: priced.length,
    itemListElement: priced.map((v, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Product',
        name: v.name,
        ...(v.description ? { description: v.description } : {}),
        ...(v.image ? { image: abs(v.image) } : {}),
        category: v.category,
        brand: { '@type': 'Brand', name: v.name.split(' ')[0] },
        offers: {
          '@type': 'Offer',
          price: v.dailyRate,
          priceCurrency: 'NGN',
          availability: 'https://schema.org/InStock',
          url: SITE_URL,
          seller: { '@id': `${SITE_URL}/#business` },
          ...(v.dailyRateMax && v.dailyRateMax > v.dailyRate!
            ? {
                priceSpecification: {
                  '@type': 'PriceSpecification',
                  minPrice: v.dailyRate,
                  maxPrice: v.dailyRateMax,
                  priceCurrency: 'NGN',
                },
              }
            : {}),
        },
      },
    })),
  };
}

/** Fixed-price routes, which is a question people search for by name. */
export function tripSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'OfferCatalog',
    name: `${tripRates.base} to ${tripRates.destination} trip rates`,
    itemListElement: tripRates.rows.map((r, i) => ({
      '@type': 'Offer',
      position: i + 1,
      name: `${r.vehicle}: ${tripRates.base} to ${tripRates.destination}`,
      price: r.oneWay,
      priceCurrency: 'NGN',
      seller: { '@id': `${SITE_URL}/#business` },
    })),
  };
}

/** Trail for a page, so results show a path rather than a bare URL. */
export function breadcrumbSchema(trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.name,
      item: abs(c.path),
    })),
  };
}

/** Single place that renders any of the above into a page. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
