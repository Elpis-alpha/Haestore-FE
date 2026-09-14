import type { Metadata, Viewport } from 'next';
import { Fraunces, Karla } from 'next/font/google';
import { SiteFooter } from '@/components/site/footer';
import { SiteHeader } from '@/components/site/header';
import { CartProvider } from '@/components/cart/cart-provider';
import './globals.css';

/**
 * Fraunces carries the display voice — an old-style serif with SOFT and WONK axes that
 * read as hand-cut rather than machined, which is the register the logo sets. Karla
 * keeps the interface plain and warm underneath it.
 *
 * next/font self-hosts both at build time, so there is no request to Google and no
 * layout shift. The 2022 app shipped a 1.79 MB cambria.ttf to every visitor, plus two
 * @font-face declarations that were never referenced and one whose file did not exist.
 */
const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-fraunces',
  axes: ['SOFT', 'WONK', 'opsz'],
});

const karla = Karla({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-karla',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Hæstore — an artisanal general store',
    template: '%s · Hæstore',
  },
  description:
    'Coffee and tea, ceramics, botanicals, textiles, pantry and hand tools — gathered slowly, kept honestly.',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'Hæstore',
    title: 'Hæstore — an artisanal general store',
    description: 'Coffee and tea, ceramics, botanicals, textiles, pantry and hand tools.',
    // A static file in public/, not an `opengraph-image.tsx`. Generating one at request time
    // means shipping an image renderer in the Worker bundle for a picture that never changes.
    images: [
      {
        url: '/og/haestore.png',
        width: 1200,
        height: 630,
        alt: 'Hæstore — an artisanal general store',
      },
    ],
  },
  twitter: { card: 'summary_large_image' },
};

export const viewport: Viewport = {
  themeColor: '#523523',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${karla.variable}`}>
      <body className="grain flex min-h-screen flex-col antialiased">
        {/* Before the header, so the first Tab on any page reaches it. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-sm focus:bg-[var(--ink)] focus:px-4 focus:py-2 focus:text-sm focus:text-[var(--surface)]"
        >
          Skip to content
        </a>
        {/*
          The bag's state wraps the whole site because the header shows it and every page
          can add to it. It is a client component and it reads **no cookies on the
          server** — `cookies()` in a layout opts every route beneath it into dynamic
          rendering, and this layout wraps `/`, which the Phase 5 verification confirmed
          is still `○ Static`. The badge count comes from a readable cookie in the
          browser instead. See lib/cart/client.ts.
        */}
        <CartProvider>
          <SiteHeader />
          <div id="main" className="grow">
            {children}
          </div>
          <SiteFooter />
        </CartProvider>
      </body>
    </html>
  );
}
