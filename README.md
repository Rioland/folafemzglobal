# Folafemz — static front-end (Next.js)

A public-facing rebuild of the Laravel site as a **static export**: 319 prerendered
HTML pages, no server, no database, no dashboard. Every enquiry opens the visitor's
own WhatsApp or mail client with the message already written.

The Laravel application in the parent directory is untouched and still runs
independently. This is an alternative front-end, not a replacement.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # writes ./out — plain HTML, CSS, JS and images
```

---

## The one thing to understand before going live

**Nothing is recorded on your side.**

The Laravel build wrote a booking row to the database *first* and handed off to
WhatsApp *second*, so an enquiry reached your dashboard even if the customer never
pressed send. This build has nowhere to write to. If a visitor fills in the form,
taps "Send on WhatsApp" and then abandons the chat, **that enquiry is gone** — you
will never know it existed.

That is inherent to a static site, not a bug. Two ways to get capture back if you
want it, in order of effort:

1. **Add a form service.** Formspree, Web3Forms and Basin all take a plain HTML
   POST from a static page and email you the submission. Roughly ten minutes and a
   free tier covers a site this size.
2. **Deploy to Vercel or Netlify instead of static hosting** and add a serverless
   route that stores the enquiry or emails it via Resend. Keeps the whole thing in
   this codebase.

Until you do one of those, treat WhatsApp itself as your inbox.

---

## Where the content comes from

`data/content.json` is generated from the Laravel database — the same 18 vehicles,
4 cities, 29 areas, 10 services, 5 articles, 10 FAQs and 2 policy pages, with the
same slugs, rates and copy.

To refresh it after editing content in the Laravel dashboard:

```bash
php scripts/export-content.php   # rewrites data/content.json, syncs public/images
npm run build
```

The script reads `../database/database.sqlite`. To pull from **production** MySQL
instead, change the PDO line at the top of the script to your live credentials.

> Because content is baked in at build time, a dashboard edit does **not** appear on
> this site until you re-export and redeploy. That is the trade for having no
> database in front of visitors.

---

## Routes

Every URL matches the Laravel site, so nothing that is already indexed breaks.

| Route | Count | Source |
|---|---|---|
| `/` | 1 | homepage |
| `/locations/{service}-{area}/` | **290** | every area × every directory service |
| `/services/{slug}/` | 10 | service landing pages |
| `/car-rental-{city}/` | 4 | city pages |
| `/articles/{slug}/` | 5 | blog posts |
| `/blog/`, `/location-directory/`, `/contact/` | 3 | index pages |
| `/privacy-policy/`, `/terms-of-service/` | 2 | editable pages |
| `/sitemap.xml`, `/robots.txt`, `/404` | 3 | generated |

The 290 location pages are the SEO engine carried over intact. `lib/content.ts`
resolves `/locations/moving-truck-lekki-phase-1/` by matching the longest service
slug first, so a short slug can never shadow a longer one that starts with it.

---

## Deploying

### Hostinger (or any plain web host)

`npm run build` produces `out/`. Upload its **contents** to `public_html`. That is
the whole deployment — no PHP, no Composer, no database, so none of the problems
the Laravel build ran into on this host apply.

`trailingSlash: true` is set in `next.config.ts` so Apache serves
`/blog/index.html` for `/blog/` without any rewrite rules.

**Note:** this and the Laravel app cannot both own `public_html`. Pick one, or put
this on a subdomain.

### Vercel / Netlify

Point it at the `nextjs` directory. Both detect Next.js automatically. Remove
`output: 'export'` first if you want to add serverless routes for form capture.

---

## Structure

```
app/
  layout.tsx              header, footer, fonts, schema.org, booking provider
  page.tsx                homepage
  [slug]/                 city pages + policy pages (one catch-all)
  locations/[slug]/       the 290 generated landing pages
  services/[slug]/        service pages
  articles/[slug]/        blog posts
  blog/  contact/  location-directory/
  sitemap.ts  robots.ts  not-found.tsx
  globals.css             ported from the Laravel build, brand palette intact

components/
  BookingForm.tsx         the dual WhatsApp/email enquiry form
  BookingModal.tsx        modal + context, so any button can open the form
  FleetGrid.tsx           filterable fleet, vehicle card
  BlogList.tsx            category filter and search
  Faq.tsx                 accordion
  SiteChrome.tsx          header, footer, scroll reveal, animated counters

lib/
  content.ts              typed access to content.json, slug resolution, pricing
  enquiry.ts              composes the WhatsApp and mailto messages

scripts/export-content.php   regenerates content.json from the Laravel database
data/content.json            generated — do not edit by hand
public/images/               synced from database/seeders/media
```

## Design

The navy `#0C1627` and gold palette is sampled from the company logo and carried
over unchanged, along with the full motion system — hero cascade, scroll reveals,
stat counters, card hovers, the FAQ accordion. Every animation collapses under
`prefers-reduced-motion`.

## Carried over deliberately

- **Reviews stay hidden.** `testimonials` exports only records marked live in
  Laravel, and the seeded placeholders are not. The section appears once you have
  real reviews.
- **No `aggregateRating` in the structured data** unless real reviews back it.
  Claiming a star rating you cannot evidence is grounds for a Google penalty.
- **The statistics are still placeholders.** 6 years / 1,500 clients / 40 vehicles
  are invented. Fix them in Laravel and re-export, or edit `data/content.json`.
