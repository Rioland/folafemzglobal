'use client';

import { useState } from 'react';
import type { Faq } from '@/lib/content';

export default function FaqList({ items }: { items: Faq[] }) {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="faq" data-faq>
      {items.map((item, i) => (
        <div className="faq__item" key={item.question} data-open={open === i}>
          <button
            className="faq__q"
            onClick={() => setOpen(open === i ? null : i)}
            aria-expanded={open === i}
          >
            {item.question}
          </button>
          <div className="faq__a">
            <div>
              <p>{item.answer}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
