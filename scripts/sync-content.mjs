#!/usr/bin/env node
/**
 * Pulls the whole site's content out of Supabase and writes data/content.json.
 *
 * This is what links the staff dashboard to this website. The dashboard edits
 * Supabase; this script turns that into the JSON file lib/content.ts imports,
 * and it runs automatically before every build (see the `prebuild` script), so
 * a deploy always ships the current content.
 *
 * It is the successor to scripts/export-content.php from the Laravel build.
 *
 * Run by hand with:  npm run sync
 *
 * If the Supabase credentials are absent it leaves the committed content.json
 * alone and exits successfully. A contributor without database access can still
 * build the site, and a credential problem in CI does not publish an empty one.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const target = resolve(here, '..', 'data', 'content.json');

/* Read .env.local when running locally; on Vercel the vars are already set. */
function loadEnv() {
  for (const name of ['.env.local', '.env']) {
    const file = resolve(here, '..', name);
    if (!existsSync(file)) continue;

    for (const line of readFileSync(file, 'utf8').split('\n')) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const value = match[2].replace(/^["']|["']$/g, '');
      if (value && !process.env[match[1]]) process.env[match[1]] = value;
    }
  }
}

loadEnv();

/*
 * The anon key is enough: the content tables carry a "public can read" policy,
 * because every column in them is already published on this website. That keeps
 * the service-role key — which grants full write access to the whole database —
 * out of this project's deployment environment entirely.
 *
 * SUPABASE_SERVICE_ROLE_KEY is still honoured if someone sets it, so a private
 * fork with tighter policies keeps working.
 */
const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL_ || !KEY) {
  console.warn(
    '\n  content sync skipped — NEXT_PUBLIC_SUPABASE_URL or ' +
    'NEXT_PUBLIC_SUPABASE_ANON_KEY is not set.\n' +
    '  Building from the committed data/content.json instead.\n'
  );
  process.exit(0);
}

const db = createClient(URL_, KEY, { auth: { persistSession: false } });

/* -------------------------------------------------------------------------
   Read everything. The key names below are the ones lib/content.ts expects,
   so this output drops straight in with no reshaping.
   ------------------------------------------------------------------------- */

const [
  settingRows, categories, vehicles, cities, locations,
  services, posts, faqs, pages, testimonials, tripTables, gallery, videos,
] = await Promise.all([
  db.from('settings').select('key, value'),
  db.from('categories').select('*').order('position'),
  db.from('vehicles').select('*, categories(name, slug)').order('position').order('name'),
  db.from('cities').select('*').order('position'),
  db.from('locations').select('*, cities(name, slug)').order('position'),
  db.from('services').select('*').order('position'),
  db.from('posts').select('*').order('published_at', { ascending: false }),
  db.from('faqs').select('*').order('position'),
  db.from('pages').select('*').order('position'),
  db.from('testimonials').select('*').order('position'),
  db.from('trip_rate_tables').select('*').eq('is_active', true).limit(1),
  db.from('gallery').select('*').order('position'),
  db.from('videos').select('*').order('position'),
]);

const results = { settingRows, categories, vehicles, cities, locations, services,
  posts, faqs, pages, testimonials, tripTables, gallery, videos };

for (const [name, result] of Object.entries(results)) {
  if (result.error) {
    console.error(`\n  content sync FAILED reading ${name}: ${result.error.message}\n`);
    process.exit(1);
  }
}

/* Refuse to publish an empty site. An empty fleet almost certainly means the
   database is not seeded rather than that the client sold every vehicle. */
if ((vehicles.data ?? []).length === 0) {
  console.error(
    '\n  content sync FAILED — the database returned no vehicles.\n' +
    '  Keeping the existing data/content.json rather than publishing an empty site.\n'
  );
  process.exit(1);
}

const settings = {};
for (const row of settingRows.data ?? []) settings[row.key] = row.value;

/* Trip rates: the active table plus its priced rows. */
let tripRates = null;
const table = tripTables.data?.[0];

if (table) {
  const { data: rows, error } = await db
    .from('trip_rates').select('*, vehicles(slug)')
    .eq('table_id', table.id).order('position');

  if (error) {
    console.error(`\n  content sync FAILED reading trip rates: ${error.message}\n`);
    process.exit(1);
  }

  tripRates = {
    base: table.base,
    destination: table.destination,
    note: table.note,
    rows: (rows ?? []).map((r) => ({
      vehicle: r.vehicle_label,
      vehicleSlug: r.vehicles?.slug ?? null,
      oneWay: r.one_way,
      oneWayMax: r.one_way_max,
      returnTrip: r.return_trip,
      note: r.note,
    })),
    escort: {
      label: table.escort_label,
      rate: table.escort_rate,
      unit: table.escort_unit,
      note: table.escort_note,
    },
  };
}

const content = {
  settings,
  categories: (categories.data ?? []).map((c) => ({ name: c.name, slug: c.slug })),
  vehicles: (vehicles.data ?? []).map((v) => ({
    name: v.name,
    slug: v.slug,
    category: v.categories?.name ?? '',
    categorySlug: v.categories?.slug ?? '',
    dailyRate: v.daily_rate,
    dailyLabel: v.daily_label,
    secondaryRate: v.secondary_rate,
    secondaryLabel: v.secondary_label,
    rateNote: v.rate_note,
    seats: v.seats,
    description: v.description,
    image: v.image,
    isFeatured: v.is_featured,
    dailyRateMax: v.daily_rate_max,
  })),
  cities: (cities.data ?? []).map((c) => ({
    name: c.name, slug: c.slug, state: c.state, tagline: c.tagline,
    rating: c.rating, areasSummary: c.areas_summary, intro: c.intro,
    highlights: c.highlights ?? [],
    officeAddress: c.office_address, airportBranch: c.airport_branch,
    heroImage: c.hero_image, metaTitle: c.meta_title, metaDescription: c.meta_description,
  })),
  locations: (locations.data ?? []).map((l) => ({
    name: l.name, slug: l.slug,
    city: l.cities?.name ?? '', citySlug: l.cities?.slug ?? '',
    landmarks: l.landmarks, blurb: l.blurb,
  })),
  services: (services.data ?? []).map((s) => ({
    name: s.name, slug: s.slug, linkLabel: s.link_label,
    headlineTemplate: s.headline_template, summary: s.summary, body: s.body,
    image: s.image, showInDirectory: s.show_in_directory, hasLandingPage: s.has_landing_page,
  })),
  posts: (posts.data ?? []).map((p) => ({
    title: p.title, slug: p.slug, category: p.category, excerpt: p.excerpt,
    body: p.body, coverImage: p.cover_image, readMinutes: p.read_minutes,
    author: p.author, publishedAt: p.published_at, isFeatured: p.is_featured,
  })),
  faqs: (faqs.data ?? []).map((f) => ({ question: f.question, answer: f.answer })),
  pages: (pages.data ?? []).map((p) => ({
    title: p.title, slug: p.slug, body: p.body, showInFooter: p.show_in_footer,
  })),
  testimonials: (testimonials.data ?? []).map((t) => ({
    name: t.name, role: t.role, quote: t.quote,
    rating: t.rating, service: t.service, reviewedOn: t.reviewed_on,
  })),
  tripRates,
  gallery: (gallery.data ?? []).map((g) => ({ src: g.src, caption: g.caption })),
  videos: (videos.data ?? []).map((v) => ({
    src: v.src, orientation: v.orientation, caption: v.caption,
  })),
};

/* Match the existing file's formatting so a no-op sync is a no-op diff. */
const json = JSON.stringify(content, null, 4) + '\n';
const before = existsSync(target) ? readFileSync(target, 'utf8') : '';

writeFileSync(target, json, 'utf8');

const counts = Object.entries(content)
  .filter(([, v]) => Array.isArray(v))
  .map(([k, v]) => `${v.length} ${k}`)
  .join(', ');

console.log(
  `\n  content sync ${before === json ? 'complete — already up to date' : 'complete — content.json updated'}\n` +
  `  ${counts}\n`
);
