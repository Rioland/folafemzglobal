import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPost, posts } from '@/lib/content';

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    alternates: { canonical: `/articles/${slug}/` },
    openGraph: {
      type: 'article',
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.coverImage ? [post.coverImage] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const others = posts.filter((p) => p.slug !== post.slug).slice(0, 3);
  const published = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString('en-NG', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.excerpt,
    author: { '@type': 'Organization', name: post.author },
    datePublished: post.publishedAt,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />

      <section className="pageHead">
        <div className="shell">
          <nav className="crumbs">
            <Link href="/">Home</Link> / <Link href="/blog/">Blog</Link> / {post.category}
          </nav>
          <div className="eyebrow">{post.category}</div>
          <h1>{post.title}</h1>
          <p className="postMeta">
            {published && <>{published} · </>}{post.readMinutes} min read
          </p>
        </div>
      </section>

      <article className="section">
        <div className="shell shell--narrow">
          {post.coverImage && (
            <img className="articleCover" src={post.coverImage} alt="" />
          )}
          {post.body && <div className="prose" dangerouslySetInnerHTML={{ __html: post.body }} />}
        </div>
      </article>

      <section className="section section--edge">
        <div className="shell">
          <h2>More guides</h2>
          <div className="grid grid--3">
            {others.map((p) => (
              <Link className="postCard" key={p.slug} href={`/articles/${p.slug}/`}>
                {p.coverImage && (
                  <div className="postCard__media"><img src={p.coverImage} alt="" loading="lazy" /></div>
                )}
                <div className="postCard__body">
                  <div className="postCard__cat">{p.category}</div>
                  <h3>{p.title}</h3>
                  <div className="postCard__meta">{p.readMinutes} min read</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
