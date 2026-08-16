import {
  cities, faqs, locations, naira, services, settings, vehicles,
} from './content';

/* --------------------------------------------------------------------------
   Assistant grounding
   --------------------------------------------------------------------------
   The assistant answers only from the same content.json the rest of the site
   renders, so a rate quoted in chat is the rate on the fleet card. Nothing here
   is fetched at request time — the whole knowledge base is baked in at build,
   which also makes it a stable prompt prefix that caches cleanly.

   The one rule that matters: it must never invent a price, a vehicle or an
   availability promise. A wrong quote in a chat window is a quote the business
   has to honour or walk back in front of the customer.
   -------------------------------------------------------------------------- */

function fleetLines() {
  return vehicles.map((v) => {
    const parts = [`- ${v.name} (${v.category}`];
    parts.push(v.seats ? `, ${v.seats})` : ')');

    if (v.dailyRate) {
      parts.push(` — ${naira(v.dailyRate)}${v.dailyLabel ? ` ${v.dailyLabel}` : ' per day'}`);
      if (v.secondaryRate) {
        parts.push(`; ${naira(v.secondaryRate)}${v.secondaryLabel ? ` ${v.secondaryLabel}` : ''}`);
      }
    } else {
      parts.push(` — ${v.rateNote || 'price on request'}`);
    }

    return parts.join('');
  }).join('\n');
}

function serviceLines() {
  return services
    .map((s) => `- ${s.name}: ${s.summary ?? 'Details on request.'}`)
    .join('\n');
}

function cityLines() {
  return cities.map((c) => {
    const areas = locations.filter((l) => l.citySlug === c.slug).map((l) => l.name);
    return `- ${c.name}${c.state ? ` (${c.state})` : ''}: ${areas.join(', ') || 'city-wide'}`;
  }).join('\n');
}

function faqLines() {
  return faqs.map((f) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
}

/**
 * The full knowledge base. Stable across every request, so it sits ahead of the
 * conversation and is marked cacheable by the route.
 */
export function systemPrompt(): string {
  return `You are the dispatch assistant for ${settings.siteName}, a Nigerian vehicle hire and logistics company. You answer questions from visitors on the company website.

# How to answer

Keep replies short — two or three sentences for most questions. This is a chat widget, not a brochure. No headings, no bullet lists unless you are genuinely listing vehicles or areas. Write plainly, the way someone on the dispatch desk would talk.

Answer only from the facts below. You do not have access to a live booking system, a calendar, or stock levels.

- Never invent a price, a vehicle, a discount, or a location that is not listed here. If a rate is not listed, say it is quoted on request.
- Never confirm that a specific vehicle is available on a specific date — you cannot see availability. Say the dispatch desk confirms availability when they call back.
- Never agree to a price the customer proposes, and never negotiate. Quoting is the desk's job.
- If you do not know something, say so and point them to the desk. That is always a correct answer.

When someone is ready to book, or wants a firm quote, point them at the WhatsApp button on the page or the phone number ${settings.phone}. They can also use the "Request a vehicle" button.

Write phone numbers exactly as they appear below. Never recite the WhatsApp ID as a string of digits — say "the WhatsApp button" or "message us on WhatsApp" instead.

# The business

Name: ${settings.siteName}
What we do: ${settings.tagline}
Phone: ${[settings.phone, ...settings.phoneAlt].join(', ')}
WhatsApp: ${settings.whatsapp}
Email: ${settings.email}
Offices: ${settings.addressPrimary}; ${settings.addressSecondary}
Hours: ${settings.businessHours}

What the rates include: ${settings.fleetNote}

# Fleet and rates

${fleetLines()}

# Services

${serviceLines()}

# Cities and areas we cover

${cityLines()}

We do not operate outside the cities listed above. Interstate trips between them are quoted on request.

# Common questions already answered

${faqLines()}`;
}

/** Shown in the widget before the visitor types anything. */
export const OPENING_LINE =
  `Hello — ask me anything about our vehicles, rates or the areas we cover.`;

export const SUGGESTIONS = [
  'What does an SUV cost per day?',
  'Do you cover Lekki?',
  'Can I hire a bus for a wedding?',
];
