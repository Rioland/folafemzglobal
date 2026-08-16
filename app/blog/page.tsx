import type { Metadata } from 'next';
import BlogList from '@/components/BlogList';

export const metadata: Metadata = {
  title: 'Blog — car hire guides and pricing',
  description: 'Practical guides on hiring vehicles in Nigeria: what things cost, which vehicle to pick, and how to plan transport that runs on time.',
  alternates: { canonical: '/blog/' },
};

export default function BlogPage() {
  return (
    <>
      <section className="pageHead">
        <div className="shell">
          <div className="eyebrow">Resources</div>
          <h1>Guides worth reading before you book</h1>
          <p className="lead">
            Straight answers on pricing, vehicle choice and planning — written from the
            dispatch desk, not from a brochure.
          </p>
        </div>
      </section>

      <section className="section">
        <div className="shell"><BlogList /></div>
      </section>
    </>
  );
}
