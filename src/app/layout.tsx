import type { Metadata, Viewport } from 'next';
import { Fraunces, Karla } from 'next/font/google';
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
  },
};

export const viewport: Viewport = {
  themeColor: '#523523',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fraunces.variable} ${karla.variable}`}>
      <body className="grain min-h-screen antialiased">{children}</body>
    </html>
  );
}
