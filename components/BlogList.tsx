'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { postCategories, posts } from '@/lib/content';

export default function BlogList() {
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');

  const shown = useMemo(() => posts.filter((p) => {
    const byCategory = category === 'all' || p.category === category;
    const q = query.trim().toLowerCase();
    const byQuery = !q
      || p.title.toLowerCase().includes(q)
      || (p.excerpt ?? '').toLowerCase().includes(q);
    return byCategory && byQuery;
  }), [category, query]);

  return (
    <>
      <div className="blogControls">
        <div className="filters">
          <button className="filter" aria-pressed={category === 'all'} onClick={() => setCategory('all')}>
            All
          </button>
          {postCategories.map((c) => (
            <button key={c} className="filter" aria-pressed={category === c} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>
        <input
          className="input"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles…"
          aria-label="Search articles"
        />
      </div>

      {shown.length === 0 ? (
        <div className="emptyState">No articles match that search.</div>
      ) : (
        <div className="grid grid--3 stagger is-visible">
          {shown.map((p) => (
            <Link className="postCard" key={p.slug} href={`/articles/${p.slug}/`}>
              {p.coverImage && (
                <div className="postCard__media"><img src={p.coverImage} alt="" loading="lazy" /></div>
              )}
              <div className="postCard__body">
                <div className="postCard__cat">{p.category}</div>
                <h3>{p.title}</h3>
                <p>{p.excerpt}</p>
                <div className="postCard__meta">{p.readMinutes} min read</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
