import Link from 'next/link';
import {
  cities, faqs, landingServices, posts, settings, testimonials, vehicles,
} from '@/lib/content';
import { whatsappDirect } from '@/lib/enquiry';
import BookingForm from '@/components/BookingForm';
import FleetGrid from '@/components/FleetGrid';
import FaqList from '@/components/Faq';
import { BookButton } from '@/components/BookingModal';
import { CountUp } from '@/components/SiteChrome';

const SOURCE = 'Homepage';

export default function HomePage() {
  const featured = posts.slice(0, 3);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: { '@type': 'Answer', text: f.answer },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* ============================ Hero ============================ */}
      <section className="hero">
        <div className="hero__media">
          {settings.heroImage && <img src={settings.heroImage} alt="" />}
        </div>

        <div className="shell">
          <div className="hero__inner">
            <div>
              <div className="eyebrow">{settings.heroEyebrow}</div>
              <h1>{settings.heroHeading}</h1>
              <p className="hero__sub">{settings.heroSubheading}</p>

              <div className="hero__actions">
                <BookButton source={SOURCE}>Request a vehicle</BookButton>
                <a className="btn btn--onDark" href={whatsappDirect()} target="_blank" rel="noopener">
                  Message on WhatsApp
                </a>
              </div>

              <div className="hero__plates">
                {landingServices.slice(0, 4).map((s) => (
                  <span className="plate plate--dark" key={s.slug}>
                    <span className="plate__tab">SVC</span>
                    <span className="plate__value">{s.name}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="dispatch">
              <div className="dispatch__head">
                <h2>Dispatch desk</h2>
                <span>Replies in minutes</span>
              </div>
              <BookingForm compact source={SOURCE} />
            </div>
          </div>
        </div>
      </section>

      {/* ============================ Fleet ============================ */}
      <section className="section" id="fleet">
        <div className="shell">
          <div className="sectionHead reveal">
            <div>
              <div className="eyebrow">The fleet</div>
              <h2>Pick the vehicle, we handle the rest</h2>
              <p className="lead">{settings.fleetNote}</p>
            </div>
            <a className="btn btn--ghost" href={whatsappDirect()} target="_blank" rel="noopener">
              Ask about a vehicle
            </a>
          </div>

          <FleetGrid source={SOURCE} />
        </div>
      </section>

      {/* ============================ Services ============================ */}
      <section className="section section--dark">
        <div className="shell">
          <div className="sectionHead reveal">
            <div>
              <div className="eyebrow">What we do</div>
              <h2>Ten services, one dispatch desk</h2>
            </div>
          </div>

          <div className="grid grid--3 stagger">
            {landingServices.map((s) => (
              <Link className="serviceCard" key={s.slug} href={`/services/${s.slug}/`}>
                <h3>{s.name}</h3>
                <p>{s.summary}</p>
                <span className="serviceCard__go">{s.linkLabel || 'Learn more'} →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ About + stats ============================ */}
      <section className="section">
        <div className="shell">
          <div className="split">
            <div className="reveal reveal--left">
              <div className="eyebrow">Why us</div>
              <h2>{settings.aboutHeading}</h2>
              <p className="lead">{settings.aboutBody}</p>

              <ul className="ticks">
                {settings.trustPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </div>

            <div className="reveal reveal--right">
              <img className="aboutImage" src="/images/chauffeur-service.jpg" alt="" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      <section className="section section--tight section--dark">
        <div className="shell">
          <div className="stats">
            <CountUp value={settings.statYears} label="Years operating" />
            <CountUp value={settings.statClients} label="Clients served" />
            <CountUp value={settings.statVehicles} label="Vehicles in fleet" />
            <CountUp value={settings.statRating} label="Average rating" />
          </div>
        </div>
      </section>

      {/* ============================ Cities ============================ */}
      <section className="section">
        <div className="shell">
          <div className="sectionHead reveal">
            <div>
              <div className="eyebrow">Where we operate</div>
              <h2>Four cities, delivered to your door</h2>
            </div>
            <Link className="btn btn--ghost" href="/location-directory/">All locations</Link>
          </div>

          <div className="grid grid--2 stagger">
            {cities.map((city) => (
              <article className="cityCard" key={city.slug}>
                {city.heroImage && (
                  <div className="cityCard__media">
                    <img src={city.heroImage} alt="" loading="lazy" />
                  </div>
                )}
                <div className="cityCard__body">
                  <div className="cityCard__state">{city.state}</div>
                  <h3>{city.name}</h3>
                  <p>{city.tagline}</p>
                  {city.areasSummary && <p className="cityCard__areas">{city.areasSummary}</p>}
                  <ul className="ticks ticks--sm">
                    {city.highlights.slice(0, 3).map((h) => <li key={h}>{h}</li>)}
                  </ul>
                  <Link className="btn btn--primary btn--sm" href={`/car-rental-${city.slug}/`}>
                    Car hire in {city.name}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== Reviews — hidden until real ones exist ==================== */}
      {testimonials.length > 0 && (
        <section className="section section--dark">
          <div className="shell">
            <div className="sectionHead reveal">
              <div>
                <div className="eyebrow">{settings.statRating} average</div>
                <h2>What clients say afterwards</h2>
              </div>
            </div>
            <div className="reviews">
              {testimonials.map((t) => (
                <article className="review" key={t.name}>
                  <div className="review__stars">{'★'.repeat(t.rating)}</div>
                  <p className="review__quote">{t.quote}</p>
                  <div className="review__who">
                    <div className="review__avatar">
                      {t.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <strong>{t.name}</strong>
                      <span>{t.role}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============================ FAQ ============================ */}
      <section className="section">
        <div className="shell">
          <div className="split split--faq">
            <div className="reveal">
              <div className="eyebrow">Questions</div>
              <h2>The things people ask before booking</h2>
              <p className="lead">
                Anything not covered here, message the dispatch desk and you will get a
                straight answer.
              </p>
              <a className="btn btn--primary" href={whatsappDirect()} target="_blank" rel="noopener">
                Ask a question
              </a>
            </div>

            <FaqList items={faqs} />
          </div>
        </div>
      </section>

      {/* ============================ Blog ============================ */}
      <section className="section section--edge">
        <div className="shell">
          <div className="sectionHead reveal">
            <div>
              <div className="eyebrow">Resources</div>
              <h2>Guides worth reading before you book</h2>
            </div>
            <Link className="btn btn--ghost" href="/blog/">All articles</Link>
          </div>

          <div className="grid grid--3 stagger">
            {featured.map((post) => (
              <Link className="postCard" key={post.slug} href={`/articles/${post.slug}/`}>
                {post.coverImage && (
                  <div className="postCard__media">
                    <img src={post.coverImage} alt="" loading="lazy" />
                  </div>
                )}
                <div className="postCard__body">
                  <div className="postCard__cat">{post.category}</div>
                  <h3>{post.title}</h3>
                  <p>{post.excerpt}</p>
                  <div className="postCard__meta">{post.readMinutes} min read</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ Contact ============================ */}
      <section className="section section--dark" id="contact">
        <div className="shell">
          <div className="split">
            <div className="reveal reveal--left">
              <div className="eyebrow">Get in touch</div>
              <h2>Tell us what you need moving</h2>
              <p className="lead">
                Send the details and you will get a price back, usually within minutes.
                No account, no deposit to get a quote.
              </p>

              <div className="contactList">
                <a href={`tel:${settings.phone.replace(/[^\d+]/g, '')}`}>
                  <span className="plate plate--dark">
                    <span className="plate__tab">CALL</span>
                    <span className="plate__value">{settings.phone}</span>
                  </span>
                </a>
                <a href={`mailto:${settings.email}`}>
                  <span className="plate plate--dark">
                    <span className="plate__tab">MAIL</span>
                    <span className="plate__value">{settings.email}</span>
                  </span>
                </a>
              </div>
            </div>

            <div className="dispatch reveal reveal--right">
              <div className="dispatch__head">
                <h2>Request a quote</h2>
                <span>WhatsApp or email</span>
              </div>
              <BookingForm source={SOURCE} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
