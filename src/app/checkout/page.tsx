import type { Metadata } from 'next';
import { CheckoutForm } from '@/components/checkout/checkout-form';

/**
 * Checkout.
 *
 * Renders nothing on the server: the bag is per-shopper behind a `__Host-` cookie, so a
 * server render would either be wrong for everyone or make this route dynamic for a
 * shell the client replaces immediately.
 *
 * **No `loading.tsx`, here or under it.** The Phase 4 rule — a Suspense boundary at the
 * route lets Next flush the shell and commit a 200 before the page has decided anything.
 * Nothing here calls `notFound()`, but the return page beneath it does, and the rule is
 * cheaper to keep than to re-learn.
 */
export const metadata: Metadata = {
  title: 'Checkout',
  // One person's, mid-transaction, and holding a reserved stock hold. There is nothing
  // here for a crawler and following a link to it should cost the shop nothing.
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl [--opsz:48] [--wght:600]">Checkout</h1>
      <CheckoutForm />
    </main>
  );
}
