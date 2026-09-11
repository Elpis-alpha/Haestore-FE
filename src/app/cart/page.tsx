import type { Metadata } from 'next';
import { CartPage } from '@/components/cart/cart-page';

/**
 * The bag, as a page.
 *
 * The drawer is for confirming; this is for deciding. It renders nothing on the server —
 * the cart is per-shopper and lives behind a `__Host-` cookie, so a server render would
 * either be wrong for everyone or make this route dynamic for the sake of a shell the
 * client immediately replaces.
 *
 * **There is no `loading.tsx` here and there must not be**, for the Phase 4 reason: a
 * Suspense boundary at the route lets Next commit a 200 before the page has decided
 * anything. Nothing here can 404, but the rule is cheaper to keep than to re-learn.
 */
export const metadata: Metadata = {
  title: 'Your bag',
  // A cart page is one person's and changes by the minute. Nothing here should be
  // indexed, and a crawler following a link to it should be told so rather than
  // relied upon to work it out.
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl [--opsz:48] [--wght:600]">Your bag</h1>
      <CartPage />
    </main>
  );
}
