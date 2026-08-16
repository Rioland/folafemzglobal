import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getService, landingServices, locations, settings } from '@/lib/content';
import { whatsappDirect } from '@/lib/enquiry';
import BookingForm from '@/components/BookingForm';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return landingServices.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = getService(slug);
  if (!service) return {};

  return {
    title: `${service.name} in Nigeria`,
    description: service.summary ?? undefined,
    alternates: { canonical: `/services/${slug}/` },
  };
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const service = getService(slug);
  if (!service || !service.hasLandingPage) notFound();

  return (
    <>
      <section className="pageHead">
        <div className="shell">
          <nav className="crumbs">
            <Link href="/">Home</Link> / {service.name}
          </nav>
          <div className="eyebrow">Service</div>
          <h1>{service.name}</h1>
          <p className="lead">{service.summary}</p>
          <div className="hero__actions">
            <a
              className="btn btn--amber"
              href={whatsappDirect(`Hello ${settings.siteName}, I am interested in ${service.name}.`)}
              target="_blank"
              rel="noopener"
            >
              Get a quote on WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="split">
            <div>
              {service.image && (
                <img className="aboutImage" src={service.image} alt="" loading="lazy" />
              )}
              {service.body && (
                <div className="prose" dangerouslySetInnerHTML={{ __html: service.body }} />
              )}
            </div>

            <aside className="sticky">
              <div className="dispatch">
                <div className="dispatch__head">
                  <h2>Request {service.name}</h2>
                  <span>Replies in minutes</span>
                </div>
                <BookingForm service={service.name} source={service.name} compact />
              </div>
            </aside>
          </div>
        </div>
      </section>

      <section className="section section--dark section--tight">
        <div className="shell">
          <div className="eyebrow">{service.name} by area</div>
          <div className="chipRow">
            {locations.map((l) => (
              <Link className="chip" key={l.slug} href={`/locations/${service.slug}-${l.slug}/`}>
                {l.name}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
