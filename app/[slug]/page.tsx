import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  cities, directoryServices, getCity, getPage, locationsInCity, pages, settings, vehicles,
} from '@/lib/content';
import { telHref, whatsappDirect } from '@/lib/enquiry';
import BookingForm from '@/components/BookingForm';
import { VehicleCard } from '@/components/FleetGrid';

type Props = { params: Promise<{ slug: string }> };

/**
 * One dynamic segment serves two URL shapes inherited from the Laravel routes:
 *   /car-rental-lagos   → city page
 *   /privacy-policy     → editable page
 * Next resolves static segments (/blog, /contact) before this, so there is no
 * collision with the named routes.
 */
export function generateStaticParams() {
  return [
    ...cities.map((c) => ({ slug: `car-rental-${c.slug}` })),
    ...pages.map((p) => ({ slug: p.slug })),
  ];
}

const cityFromSlug = (slug: string) =>
  slug.startsWith('car-rental-') ? getCity(slug.replace('car-rental-', '')) : undefined;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const city = cityFromSlug(slug);
  if (city) {
    return {
      title: city.metaTitle || `Car hire in ${city.name}`,
      description: city.metaDescription ?? undefined,
      alternates: { canonical: `/${slug}/` },
    };
  }

  const page = getPage(slug);
  if (page) {
    return { title: page.title, alternates: { canonical: `/${slug}/` } };
  }

  return {};
}

export default async function CatchAllPage({ params }: Props) {
  const { slug } = await params;

  const city = cityFromSlug(slug);
  if (city) return <CityPage citySlug={city.slug} />;

  const page = getPage(slug);
  if (page) {
    return (
      <>
        <section className="pageHead">
          <div className="shell">
            <nav className="crumbs"><Link href="/">Home</Link> / {page.title}</nav>
            <h1>{page.title}</h1>
          </div>
        </section>
        <section className="section">
          <div className="shell shell--narrow">
            {page.body && <div className="prose" dangerouslySetInnerHTML={{ __html: page.body }} />}
          </div>
        </section>
      </>
    );
  }

  notFound();
}

function CityPage({ citySlug }: { citySlug: string }) {
  const city = getCity(citySlug)!;
  const areas = locationsInCity(citySlug);
  const priced = vehicles.filter((v) => v.dailyRate).slice(0, 6);
  const source = `Car hire in ${city.name}`;

  return (
    <>
      <section className="pageHead pageHead--image">
        {city.heroImage && (
          <div className="pageHead__media"><img src={city.heroImage} alt="" /></div>
        )}
        <div className="shell">
          <nav className="crumbs"><Link href="/">Home</Link> / {city.name}</nav>
          <div className="eyebrow">{city.state}{city.rating ? ` · ${city.rating}` : ''}</div>
          <h1>Car hire in {city.name}</h1>
          <p className="lead">{city.tagline}</p>
          <div className="hero__actions">
            <a
              className="btn btn--amber"
              href={whatsappDirect(`Hello ${settings.siteName}, I need a vehicle in ${city.name}.`)}
              target="_blank"
              rel="noopener"
            >
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
              {city.intro && <p className="lead">{city.intro}</p>}

              {city.highlights.length > 0 && (
                <>
                  <h2>What we run in {city.name}</h2>
                  <ul className="ticks">
                    {city.highlights.map((h) => <li key={h}>{h}</li>)}
                  </ul>
                </>
              )}

              <div className="infoRow">
                {city.officeAddress && (
                  <span className="plate">
                    <span className="plate__tab">OFFICE</span>
                    <span className="plate__value">{city.officeAddress}</span>
                  </span>
                )}
                {city.airportBranch && (
                  <span className="plate">
                    <span className="plate__tab">AIRPORT</span>
                    <span className="plate__value">{city.airportBranch}</span>
                  </span>
                )}
              </div>
            </div>

            <aside className="sticky">
              <div className="dispatch">
                <div className="dispatch__head">
                  <h2>Book in {city.name}</h2>
                  <span>Replies in minutes</span>
                </div>
                <BookingForm source={source} compact />
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="section section--edge">
        <div className="shell">
          <div className="sectionHead">
            <div>
              <div className="eyebrow">Fleet</div>
              <h2>Popular vehicles in {city.name}</h2>
            </div>
          </div>
          <div className="grid grid--3">
            {priced.map((v) => <VehicleCard key={v.slug} vehicle={v} source={source} />)}
          </div>
        </div>
      </section>

      {areas.length > 0 && (
        <section className="section section--dark">
          <div className="shell">
            <div className="eyebrow">Areas we deliver to</div>
            <h2>{city.name} coverage</h2>
            <div className="chipRow">
              {areas.map((a) => (
                <Link className="chip" key={a.slug} href={`/locations/${directoryServices[0].slug}-${a.slug}/`}>
                  {a.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
