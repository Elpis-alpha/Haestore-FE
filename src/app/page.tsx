import { getStorefront, softly } from '@/lib/api/client';
import { StorefrontSections, type ResolvedSection } from '@/components/storefront/sections';

/**
 * The front of the shop, as composed in the admin console.
 *
 * Until Phase 8 this page was written in code. It is now whatever version an admin last
 * published — or, on a shop that has never published one, the built-in default, which is
 * this page's Phase 4 content expressed as data. Every product and shelf in it is resolved
 * on the server as it stands now, so a composed page never shows a stale price.
 *
 * Still `revalidate = 300` and still statically prerendered: the layout is one request, and
 * publishing revalidates the tag so the new version does not wait out the five minutes.
 *
 * If the API cannot be reached the doorway still renders — a front page with a heading and a
 * way into the shop is better than an error on the first page anyone sees.
 */

export const revalidate = 300;

const FALLBACK: ResolvedSection[] = [
  {
    id: 'hero-doorway',
    kind: 'hero',
    heading: 'A general store, kept the old way',
    body: 'Coffee and tea, ceramics, botanicals, textiles, pantry and hand tools. We keep a small range and know where each of it comes from.',
    primary: { label: 'Browse the shelves', href: '/shop' },
  },
];

export default async function HomePage() {
  const home = await softly(getStorefront('home'), null);

  return (
    <main>
      <StorefrontSections sections={home?.sections ?? FALLBACK} />
    </main>
  );
}
