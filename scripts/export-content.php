<?php
/**
 * Export the seeded Laravel content into a single JSON file for the Next.js
 * front-end. Reads the SQLite dev database directly so the static site carries
 * exactly the content the Laravel site serves — same copy, same rates, same slugs.
 */
$db = new PDO('sqlite:' . dirname(__DIR__, 2) . '/database/database.sqlite');
$db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$all = fn(string $sql) => $db->query($sql)->fetchAll(PDO::FETCH_ASSOC);

// Settings collapse from key/value rows into one object.
$settings = [];
foreach ($all('SELECT key, value FROM settings') as $row) {
    $settings[$row['key']] = $row['value'];
}

$img = fn(?string $p) => $p ? '/images/' . basename($p) : null;

$categories = $all('SELECT id, name, slug, sort_order FROM vehicle_categories ORDER BY sort_order');
$catById = [];
foreach ($categories as $c) { $catById[$c['id']] = $c; }

$vehicles = array_map(function ($v) use ($catById, $img) {
    $cat = $catById[$v['vehicle_category_id']] ?? null;
    return [
        'name' => $v['name'],
        'slug' => $v['slug'],
        'category' => $cat['name'] ?? 'Other',
        'categorySlug' => $cat['slug'] ?? 'other',
        'dailyRate' => $v['daily_rate'] !== null ? (int) $v['daily_rate'] : null,
        'dailyLabel' => $v['daily_label'],
        'secondaryRate' => $v['secondary_rate'] !== null ? (int) $v['secondary_rate'] : null,
        'secondaryLabel' => $v['secondary_label'],
        'rateNote' => $v['rate_note'],
        'seats' => $v['seats'],
        'description' => $v['description'],
        'image' => $img($v['image']),
        'isFeatured' => (bool) $v['is_featured'],
    ];
}, $all('SELECT * FROM vehicles WHERE is_active = 1 ORDER BY sort_order'));

$cities = $all('SELECT * FROM cities WHERE is_active = 1 ORDER BY sort_order');
$locations = $all('SELECT * FROM locations WHERE is_active = 1 ORDER BY sort_order');

$cityById = [];
foreach ($cities as $c) { $cityById[$c['id']] = $c; }

$citiesOut = array_map(fn($c) => [
    'name' => $c['name'],
    'slug' => $c['slug'],
    'state' => $c['state'],
    'tagline' => $c['tagline'],
    'rating' => $c['rating'],
    'areasSummary' => $c['areas_summary'],
    'intro' => $c['intro'],
    'highlights' => array_values(array_filter(array_map('trim', explode("\n", (string) $c['highlights'])))),
    'officeAddress' => $c['office_address'],
    'airportBranch' => $c['airport_branch'],
    'heroImage' => $img($c['hero_image']),
    'metaTitle' => $c['meta_title'],
    'metaDescription' => $c['meta_description'],
], $cities);

$locationsOut = array_map(fn($l) => [
    'name' => $l['name'],
    'slug' => $l['slug'],
    'city' => $cityById[$l['city_id']]['name'] ?? '',
    'citySlug' => $cityById[$l['city_id']]['slug'] ?? '',
    'landmarks' => $l['landmarks'],
    'blurb' => $l['blurb'],
], $locations);

$services = array_map(fn($s) => [
    'name' => $s['name'],
    'slug' => $s['slug'],
    'linkLabel' => $s['link_label'],
    'headlineTemplate' => $s['headline_template'],
    'summary' => $s['summary'],
    'body' => $s['body'],
    'image' => $img($s['image']),
    'showInDirectory' => (bool) $s['show_in_directory'],
    'hasLandingPage' => (bool) $s['has_landing_page'],
], $all('SELECT * FROM service_types WHERE is_active = 1 ORDER BY sort_order'));

$posts = array_map(fn($p) => [
    'title' => $p['title'],
    'slug' => $p['slug'],
    'category' => $p['category'],
    'excerpt' => $p['excerpt'],
    'body' => $p['body'],
    'coverImage' => $img($p['cover_image']),
    'readMinutes' => (int) $p['read_minutes'],
    'author' => $p['author'],
    'publishedAt' => $p['published_at'],
    'isFeatured' => (bool) $p['is_featured'],
], $all('SELECT * FROM posts WHERE is_published = 1 ORDER BY published_at DESC'));

$faqs = array_map(fn($f) => ['question' => $f['question'], 'answer' => $f['answer']],
    $all('SELECT * FROM faqs WHERE is_active = 1 ORDER BY sort_order'));

$pages = array_map(fn($p) => [
    'title' => $p['title'],
    'slug' => $p['slug'],
    'body' => $p['body'],
    'showInFooter' => (bool) $p['show_in_footer'],
], $all('SELECT * FROM pages WHERE is_active = 1 ORDER BY title'));

// Reviews are exported only if genuinely published. The Laravel seed keeps the
// placeholders inactive on purpose, so this is normally an empty array.
$testimonials = array_map(fn($t) => [
    'name' => $t['name'], 'role' => $t['role'], 'quote' => $t['quote'],
    'rating' => (int) $t['rating'], 'service' => $t['service'], 'reviewedOn' => $t['reviewed_on'],
], $all('SELECT * FROM testimonials WHERE is_active = 1 ORDER BY sort_order'));

$out = [
    'settings' => [
        'siteName' => $settings['site_name'] ?? '',
        'tagline' => $settings['tagline'] ?? '',
        'logo' => $img($settings['logo'] ?? null),
        'phone' => $settings['phone'] ?? '',
        'phoneAlt' => array_values(array_filter(array_map('trim', explode("\n", (string) ($settings['phone_alt'] ?? ''))))),
        'whatsapp' => preg_replace('/\D+/', '', $settings['whatsapp_number'] ?? ''),
        'email' => $settings['email'] ?? '',
        'addressPrimary' => $settings['address_primary'] ?? '',
        'addressSecondary' => $settings['address_secondary'] ?? '',
        'businessHours' => $settings['business_hours'] ?? '',
        'heroEyebrow' => $settings['hero_eyebrow'] ?? '',
        'heroHeading' => $settings['hero_heading'] ?? '',
        'heroSubheading' => $settings['hero_subheading'] ?? '',
        'heroImage' => $img($settings['hero_image'] ?? null),
        'fleetNote' => $settings['fleet_note'] ?? '',
        'aboutHeading' => $settings['about_heading'] ?? '',
        'aboutBody' => $settings['about_body'] ?? '',
        'trustPoints' => array_values(array_filter(array_map('trim', explode("\n", (string) ($settings['trust_points'] ?? ''))))),
        'statYears' => $settings['stat_years'] ?? '',
        'statClients' => $settings['stat_clients'] ?? '',
        'statVehicles' => $settings['stat_vehicles'] ?? '',
        'statRating' => $settings['stat_rating'] ?? '',
        'metaTitle' => $settings['meta_title'] ?? '',
        'metaDescription' => $settings['meta_description'] ?? '',
        'metaKeywords' => $settings['meta_keywords'] ?? '',
        'ogImage' => $img($settings['og_image'] ?? null),
        'facebookUrl' => $settings['facebook_url'] ?? '',
        'instagramUrl' => $settings['instagram_url'] ?? '',
        'twitterUrl' => $settings['twitter_url'] ?? '',
        'tiktokUrl' => $settings['tiktok_url'] ?? '',
    ],
    'categories' => array_map(fn($c) => ['name' => $c['name'], 'slug' => $c['slug']], $categories),
    'vehicles' => $vehicles,
    'cities' => $citiesOut,
    'locations' => $locationsOut,
    'services' => $services,
    'posts' => $posts,
    'faqs' => $faqs,
    'pages' => $pages,
    'testimonials' => $testimonials,
];

$dest = dirname(__DIR__) . '/data/content.json';
@mkdir(dirname($dest), 0775, true);
file_put_contents($dest, json_encode($out, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));

printf("wrote %s (%.1f KB)\n", $dest, filesize($dest) / 1024);
foreach (['vehicles','cities','locations','services','posts','faqs','pages','testimonials'] as $k) {
    printf("  %-14s %d\n", $k, count($out[$k]));
}
printf("  landing pages  %d\n", count($locationsOut) * count(array_filter($services, fn($s) => $s['showInDirectory'])));

// Keep public/images in step with the Laravel seed media.
$mediaDir = dirname(__DIR__, 2) . '/database/seeders/media';
$imageDir = dirname(__DIR__) . '/public/images';
@mkdir($imageDir, 0775, true);
$copied = 0;
foreach (glob($mediaDir . '/*.jpg') as $file) {
    if (copy($file, $imageDir . '/' . basename($file))) $copied++;
}
printf("  images synced  %d\n", $copied);
