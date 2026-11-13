import { SITE_URL } from '@/lib/site';

import type { Metadata } from 'next';

import './globals.css';
import { settings } from '@/lib/content';
import { JsonLd, businessSchema } from '@/lib/seo';
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
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Libre+Caslon+Display&family=Libre+Caslon+Text:ital@1&family=Source+Sans+3:wght@400;600&display=swap"
          rel="stylesheet"
        />
        <JsonLd data={businessSchema()} />

        {/*
          The entrance styles hide their elements until JavaScript marks them
          visible. If the script never runs — disabled, blocked, or thrown —
          that would leave the page blank rather than merely unanimated. Fail
          to visible instead.
        */}
        <noscript>
          <style>{
            '.reveal,.stagger>*{opacity:1!important;transform:none!important}'
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
