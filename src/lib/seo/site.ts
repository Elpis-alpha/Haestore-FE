/**
 * The storefront's public origin, without a trailing slash.
 *
 * The same variable the root layout's `metadataBase` reads, so a canonical link, an Open
 * Graph image, the sitemap and the structured data all agree about which host the shop is
 * on. A sitemap listing `localhost` URLs in production is the failure this exists to make
 * one variable wide.
 */
export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
}

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith('/') ? path : `/${path}`}`;
}
