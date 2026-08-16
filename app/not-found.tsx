import Link from 'next/link';

export default function NotFound() {
  return (
    <section className="section">
      <div className="shell shell--narrow" style={{ textAlign: 'center', padding: '4rem 0' }}>
        <div className="eyebrow" style={{ justifyContent: 'center' }}>404</div>
        <h1>That page has moved on</h1>
        <p className="lead" style={{ margin: '0 auto 2rem' }}>
          The link may be old, or the area you are looking for is listed under a
          different name.
        </p>
        <div className="hero__actions" style={{ justifyContent: 'center' }}>
          <Link className="btn btn--primary" href="/">Back to the homepage</Link>
          <Link className="btn btn--ghost" href="/location-directory/">Browse locations</Link>
        </div>
      </div>
    </section>
  );
}
