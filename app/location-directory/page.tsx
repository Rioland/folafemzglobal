import type { Metadata } from 'next';
import Link from 'next/link';
import { cities, directoryServices, locationsInCity } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Locations we cover',
  description: 'Every area and service we deliver to across Lagos, Abuja, Port Harcourt and Ibadan.',
  alternates: { canonical: '/location-directory/' },
};

export default function DirectoryPage() {
  const total = cities.reduce((n, c) => n + locationsInCity(c.slug).length, 0) * directoryServices.length;

  return (
    <>
      <section className="pageHead">
        <div className="shell">
          <div className="eyebrow">Coverage</div>
          <h1>Everywhere we deliver</h1>
          <p className="lead">
            {total.toLocaleString('en-NG')} service and area combinations across{' '}
            {cities.length} cities. Pick an area to see what we run there.
          </p>
        </div>
      </section>

      {cities.map((city) => {
        const areas = locationsInCity(city.slug);
        if (areas.length === 0) return null;

        return (
          <section className="section section--edge" key={city.slug}>
            <div className="shell">
              <div className="sectionHead">
                <div>
                  <div className="eyebrow">{city.state}</div>
                  <h2>{city.name}</h2>
                  <p className="lead">{city.tagline}</p>
                </div>
                <Link className="btn btn--ghost" href={`/car-rental-${city.slug}/`}>
                  City page
                </Link>
              </div>

              <div className="directoryGrid">
                {areas.map((area) => (
                  <div className="directoryCol" key={area.slug}>
                    <h3>{area.name}</h3>
                    <ul>
                      {directoryServices.map((s) => (
                        <li key={s.slug}>
                          <Link href={`/locations/${s.slug}-${area.slug}/`}>
                            {s.linkLabel || s.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>
        );
      })}
    </>
  );
}
