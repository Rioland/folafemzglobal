import { SITE_URL } from '@/lib/site';

import type { Metadata } from 'next';

// Animate.css first, globals.css second: the reduced-motion block at the end of
// globals.css uses !important, so importing it last lets it win over the
// library's own. v4 namespaces every class as animate__*, so nothing here
// collides with the hand-written motion system.
import 'animate.css';
import './globals.css';
import { settings } from '@/lib/content';
import { BookingProvider } from '@/components/BookingModal';
import { Footer, FloatingActions, Header, RevealOnScroll } from '@/components/SiteChrome';
import AskAi from '@/components/AskAi';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: settings.metaTitle || settings.siteName,
    template: `%s | ${settings.siteName}`,
  },
  description: settings.metaDescription,
  keywords: settings.metaKeywords,
  openGraph: {
    type: 'website',
    siteName: settings.siteName,
    title: settings.metaTitle || settings.siteName,
    description: settings.metaDescription,
    images: settings.ogImage ? [settings.ogImage] : undefined,
  },
  twitter: {
    card: settings.ogImage ? 'summary_large_image' : 'summary',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // Only claim a rating when real reviews back it — same rule as the Laravel build.
  const businessSchema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'AutoRental',
    name: settings.siteName,
    description: settings.metaDescription,
    telephone: settings.phone,
    email: settings.email,
    url: SITE_URL,
    address: [settings.addressPrimary, settings.addressSecondary]
      .filter(Boolean)
      .map((a) => ({ '@type': 'PostalAddress', streetAddress: a, addressCountry: 'NG' })),
  };

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800&family=Public+Sans:wght@400;500;600&family=Roboto+Mono:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(businessSchema) }}
        />

        {/*
          The entrance styles hide their elements until JavaScript marks them
          visible. If the script never runs — disabled, blocked, or thrown —
          that would leave the page blank rather than merely unanimated. Fail
          to visible instead.
        */}
        <noscript>
          <style>{
            '.reveal,.stagger>*,[data-animate]{opacity:1!important;transform:none!important}'
          }</style>
        </noscript>
      </head>
      <body>
        <BookingProvider>
          <Header />
          <main>{children}</main>
          <Footer />
          <FloatingActions />
          <AskAi />
          <RevealOnScroll />
        </BookingProvider>
      </body>
    </html>
  );
}
