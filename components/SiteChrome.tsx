'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cities, landingServices, pages, settings } from '@/lib/content';
import { allPhones, telHref, whatsappDirect } from '@/lib/enquiry';
import { BookButton } from './BookingModal';

/* --------------------------------------------------------------------------
   Header
   -------------------------------------------------------------------------- */

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 12);

      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? y / max : 0);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navRef = useRef<HTMLElement | null>(null);
  const pathname = usePathname();

  /**
   * Close on a click outside the nav.
   *
   * This deliberately tests the click target rather than calling
   * stopPropagation() in the toggle. The App Router hydrates the whole
   * document, so React's delegated listener sits on `document` — the same node
   * this listener is attached to. stopPropagation() only stops ancestors, not
   * siblings on the same node, so the toggle's own click would reach this
   * handler and close the menu in the same tick it opened.
   */
  useEffect(() => {
    const onDocumentClick = (e: MouseEvent) => {
      if (navRef.current?.contains(e.target as Node)) return;
      setOpenMenu(null);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };

    document.addEventListener('click', onDocumentClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocumentClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Navigating away closes whatever is open, including the mobile sheet.
  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [pathname]);

  const toggle = (name: string) => () =>
    setOpenMenu((current) => (current === name ? null : name));

  return (
    <header className={`header${scrolled ? ' is-scrolled' : ''}`}>
      <div className="shell">
        <div className="header__bar">
          <Link className="brand" href="/">
            {settings.logo ? (
              <>
                <img src={settings.logo} alt="" className="brand__logo" />
                <span>{settings.siteName}</span>
              </>
            ) : (
              <>
                <span className="brand__mark">{settings.siteName.slice(0, 2)}</span>
                <span>{settings.siteName}</span>
              </>
            )}
          </Link>

          <nav className="nav" ref={navRef}>
            <Link href="/">Home</Link>

            <div className="nav__group" data-dropdown data-open={openMenu === 'services'}>
              <button className="nav__toggle" onClick={toggle('services')} aria-expanded={openMenu === 'services'}>
                Services ▾
              </button>
              <div className="nav__menu">
                {landingServices.map((s) => (
                  <Link key={s.slug} href={`/services/${s.slug}/`} onClick={() => setOpenMenu(null)}>
                    {s.name}
                  </Link>
                ))}
              </div>
            </div>

            <div className="nav__group" data-dropdown data-open={openMenu === 'cities'}>
              <button className="nav__toggle" onClick={toggle('cities')} aria-expanded={openMenu === 'cities'}>
                Cities ▾
              </button>
              <div className="nav__menu">
                {cities.map((c) => (
                  <Link key={c.slug} href={`/car-rental-${c.slug}/`} onClick={() => setOpenMenu(null)}>
                    Car hire in {c.name}
                  </Link>
                ))}
                <Link href="/location-directory/" onClick={() => setOpenMenu(null)}>
                  All locations
                </Link>
              </div>
            </div>

            <Link href="/blog/">Blog</Link>
            <Link href="/contact/">Contact</Link>
          </nav>

          <div className="header__cta">
            <a className="btn btn--onDark btn--sm" href={whatsappDirect()} target="_blank" rel="noopener">
              WhatsApp
            </a>
            <BookButton className="btn btn--amber btn--sm" source="Header">Request a vehicle</BookButton>
          </div>

          <button
            className="burger"
            onClick={() => setMobileOpen((v) => !v)}
            aria-expanded={mobileOpen}
            aria-label="Menu"
          >
            <span /><span /><span />
          </button>
        </div>

        <div className="mobileNav" data-open={mobileOpen}>
          <Link href="/" onClick={() => setMobileOpen(false)}>Home</Link>
          {landingServices.slice(0, 6).map((s) => (
            <Link key={s.slug} href={`/services/${s.slug}/`} onClick={() => setMobileOpen(false)}>{s.name}</Link>
          ))}
          {cities.map((c) => (
            <Link key={c.slug} href={`/car-rental-${c.slug}/`} onClick={() => setMobileOpen(false)}>
              Car hire in {c.name}
            </Link>
          ))}
          <Link href="/location-directory/" onClick={() => setMobileOpen(false)}>All locations</Link>
          <Link href="/blog/" onClick={() => setMobileOpen(false)}>Blog</Link>
          <Link href="/contact/" onClick={() => setMobileOpen(false)}>Contact</Link>
          <a className="btn btn--amber btn--block" href={whatsappDirect()} target="_blank" rel="noopener">
            Message us on WhatsApp
          </a>
        </div>
      </div>

      <div className="progress" style={{ ['--progress' as string]: progress }} />
    </header>
  );
}

/* --------------------------------------------------------------------------
   Footer
   -------------------------------------------------------------------------- */

export function Footer() {
  const year = new Date().getFullYear();
  const socials = [
    ['Facebook', settings.facebookUrl],
    ['Instagram', settings.instagramUrl],
    ['X', settings.twitterUrl],
    ['TikTok', settings.tiktokUrl],
  ].filter(([, url]) => url) as [string, string][];

  return (
    <footer className="footer">
      <div className="shell">
        <div className="footer__grid">
          <div>
            <div className="brand brand--footer">
              {settings.logo && <img src={settings.logo} alt="" className="brand__logo" />}
              <span>{settings.siteName}</span>
            </div>
            <p className="footer__blurb">{settings.tagline}</p>
            <p className="footer__blurb">{settings.businessHours}</p>
          </div>

          <div>
            <h4>Services</h4>
            {landingServices.slice(0, 6).map((s) => (
              <Link key={s.slug} href={`/services/${s.slug}/`}>{s.name}</Link>
            ))}
          </div>

          <div>
            <h4>Cities</h4>
            {cities.map((c) => (
              <Link key={c.slug} href={`/car-rental-${c.slug}/`}>{c.name}</Link>
            ))}
            <Link href="/location-directory/">All locations</Link>
          </div>

          <div>
            <h4>Contact</h4>
            {allPhones.map((n) => (
              <a key={n} href={telHref(n)}>{n}</a>
            ))}
            <a href={`mailto:${settings.email}`}>{settings.email}</a>
            <p className="footer__blurb">{settings.addressPrimary}</p>
            <p className="footer__blurb">{settings.addressSecondary}</p>
          </div>
        </div>

        <div className="footer__bar">
          <span>© {year} {settings.siteName}. All rights reserved.</span>
          <div className="footer__links">
            {pages.filter((p) => p.showInFooter).map((p) => (
              <Link key={p.slug} href={`/${p.slug}/`}>{p.title}</Link>
            ))}
            {socials.map(([label, url]) => (
              <a key={label} href={url} target="_blank" rel="noopener">{label}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* --------------------------------------------------------------------------
   Floating actions + scroll reveal
   -------------------------------------------------------------------------- */

export function FloatingActions() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <a className="floatChat" href={whatsappDirect()} target="_blank" rel="noopener">
        ✆ <span>WhatsApp us</span>
      </a>
      <button
        className={`toTop${showTop ? ' is-visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
      >
        ↑
      </button>
    </>
  );
}

/**
 * Drives every scroll entrance on the site. Re-runs on route change so
 * client-navigated pages animate too.
 *
 * Two vocabularies, both handled here:
 *
 *   .reveal / .stagger      the hand-written system in globals.css — gets
 *                           .is-visible and transitions to its resting state.
 *   data-animate="fadeInUp" any Animate.css animation, applied at the moment
 *                           the element enters the viewport.
 *
 * The second exists because Animate.css runs on page load, not on scroll: a
 * class written straight into the markup plays through while the element is
 * still below the fold and is over before anyone sees it. Applying it here is
 * what makes the library usable outside the first screen.
 *
 * `data-animate-delay="200"` adds a delay in milliseconds.
 */
function play(el: Element) {
  const name = el.getAttribute('data-animate');

  if (!name) {
    el.classList.add('is-visible');
    return;
  }

  const delay = el.getAttribute('data-animate-delay');
  if (delay) (el as HTMLElement).style.animationDelay = `${delay}ms`;

  el.classList.add('animate__animated', `animate__${name}`);
}

const SELECTOR = '.reveal, .stagger, [data-animate]';

/** Already played — do not re-observe. */
const shown = (el: Element) =>
  el.classList.contains('is-visible') || el.classList.contains('animate__animated');

export function RevealOnScroll() {
  /*
   * The pathname dependency is load-bearing, not decoration.
   *
   * This component is a sibling of {children} in a server layout, so a
   * client-side navigation swaps the children and leaves this element
   * untouched — React bails out and the effect never re-runs. Without a
   * re-run, the incoming page's .reveal elements are never observed and CSS
   * holds them at opacity 0: the page looks blank until a full reload.
   *
   * usePathname subscribes to router context, and context propagates through
   * that bailout, so this re-renders on every navigation.
   */
  const pathname = usePathname();

  useEffect(() => {
    // No observer, or the visitor asked for less motion: show everything at
    // once rather than leaving it stuck at opacity 0.
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduced || !('IntersectionObserver' in window)) {
      document
        .querySelectorAll(SELECTOR)
        .forEach((el) => el.classList.add('is-visible', 'animate__animated'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          play(entry.target);
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -60px 0px' }
    );

    const watch = (root: ParentNode) => {
      root.querySelectorAll(SELECTOR).forEach((el) => {
        if (!shown(el)) observer.observe(el);
      });
    };

    watch(document);

    /*
     * Anything that arrives after this effect — a streamed section, a late
     * Suspense boundary — would otherwise never be observed and would sit
     * invisible for the life of the page. Watching <main> rather than <body>
     * keeps the chat widget's streaming text out of the callback.
     */
    const root = document.querySelector('main') ?? document.body;

    const mutations = new MutationObserver((records) => {
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          const el = node as Element;
          if (el.matches(SELECTOR) && !shown(el)) observer.observe(el);
          watch(el);
        });
      });
    });

    mutations.observe(root, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutations.disconnect();
    };
  }, [pathname]);

  return null;
}

/** Counts a stat up when it scrolls into view. */
export function CountUp({ value, label }: { value: string; label: string }) {
  const [shown, setShown] = useState(value);
  const [ref, setRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref) return;

    // Only animate a plain number; leave "4.8" or "5,000+" style values alone
    // if they carry punctuation we would mangle.
    const numeric = Number(value.replace(/[^\d.]/g, ''));
    const suffix = value.replace(/[\d.,]/g, '');
    if (!Number.isFinite(numeric) || numeric === 0) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const observer = new IntersectionObserver((entries) => {
      if (!entries[0].isIntersecting) return;
      observer.disconnect();

      const decimals = value.includes('.') ? 1 : 0;
      const start = performance.now();
      const duration = 1100;

      const tick = (now: number) => {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        const current = numeric * eased;
        setShown(
          (decimals ? current.toFixed(1) : Math.round(current).toLocaleString('en-NG')) + suffix
        );
        if (t < 1) requestAnimationFrame(tick);
        else setShown(value);
      };

      requestAnimationFrame(tick);
    });

    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, value]);

  return (
    <div className="stat" ref={setRef}>
      <div className="stat__value">{shown}</div>
      <div className="stat__label">{label}</div>
    </div>
  );
}
