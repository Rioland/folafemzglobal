import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  directoryServices, getCity, headline, locationServicePairs,
  resolveLocationService, settings, vehicles,
} from '@/lib/content';
import { telHref, whatsappDirect } from '@/lib/enquiry';
import BookingForm from '@/components/BookingForm';
import { VehicleCard } from '@/components/FleetGrid';

type Props = { params: Promise<{ slug: string }> };

/**
 * Every directory service × every area. This is the whole SEO engine from the
 * Laravel build, reproduced as static HTML: 29 areas × 10 services = 290 pages,
 * each one prerendered at build time.
 */
export function generateStaticParams() {
  return locationServicePairs().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const match = resolveLocationService(slug);
  if (!match) return {};

  const { service, location } = match;
  const title = headline(service, location);

  return {
    title,
    description:
      `${service.name} in ${location.name}, ${location.city}. ` +
      `${service.summary ?? ''} Delivered to your address, quoted on WhatsApp in minutes.`,
    alternates: { canonical: `/locations/${slug}/` },
  };
}

export default async function LocationServicePage({ params }: Props) {
  const { slug } = await params;
  const match = resolveLocationService(slug);
  if (!match) notFound();

  const { service, location } = match;
  const city = getCity(location.citySlug);
  const source = `${service.name} — ${location.name}`;

  const related = directoryServices.filter((s) => s.slug !== service.slug).slice(0, 6);
  const suggested = vehicles.filter((v) => v.dailyRate).slice(0, 3);

  return (
    <>
      <section className="pageHead">
        <div className="shell">
          <nav className="crumbs">
            <Link href="/">Home</Link> / <Link href="/location-directory/">Locations</Link> /{' '}
            {city && <><Link href={`/car-rental-${city.slug}/`}>{city.name}</Link> / </>}
            {location.name}
          </nav>

          <div className="eyebrow">{service.name}</div>
          <h1>{headline(service, location)}</h1>
          <p className="lead">
            {service.summary} We cover {location.name} and the rest of {location.city} daily
            {location.landmarks ? `, including ${location.landmarks}` : ''}.
          </p>

          <div className="hero__actions">
            <a className="btn btn--amber" href={whatsappDirect(
              `Hello ${settings.siteName}, I need ${service.name} in ${location.name}, ${location.city}.`
            )} target="_blank" rel="noopener">
              Get a price on WhatsApp
            </a>
            <a className="btn btn--onDark" href={telHref(settings.phone)}>
              Call {settings.phone}
            </a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="split">
            <div>
              {location.blurb && <p className="lead">{location.blurb}</p>}
              {service.body && (
                <div className="prose" dangerouslySetInnerHTML={{ __html: service.body }} />
              )}

              <h2>Vehicles we send to {location.name}</h2>
              <div className="grid grid--3">
                {suggested.map((v) => <VehicleCard key={v.slug} vehicle={v} source={source} />)}
              </div>
            </div>

            <aside className="sticky">
              <div className="dispatch">
                <div className="dispatch__head">
                  <h2>Request this service</h2>
                  <span>{location.name}</span>
                </div>
                <BookingForm
                  service={service.name}
                  source={source}
                  compact
                />
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="section section--dark section--tight">
        <div className="shell">
          <div className="eyebrow">Also in {location.name}</div>
          <div className="chipRow">
            {related.map((s) => (
              <Link className="chip" key={s.slug} href={`/locations/${s.slug}-${location.slug}/`}>
                {s.name}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
