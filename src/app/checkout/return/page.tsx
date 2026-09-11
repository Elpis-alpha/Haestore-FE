import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ReturnView } from '@/components/checkout/return-view';

export const metadata: Metadata = {
  title: 'Your order',
  robots: { index: false, follow: false },
};

/**
 * Where a provider sends the shopper back to.
 *
 * The order number is read from the query and handed to a client component, because the
 * *authorisation* to read that order is a guest claim token in `sessionStorage` — which
 * only the browser has. A server component could not read it, and putting the token in
 * the URL instead would write it into browser history, referer headers and any analytics
 * the page ever grows.
 */
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order } = await searchParams;
  // The decision happens here, above any boundary — a route that can 404 must not sit
  // under a Suspense shell that has already committed a 200. See Phase 4.
  if (!order) notFound();

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl [--opsz:48] [--wght:600]">Your order</h1>
      <ReturnView orderNumber={order} />
    </main>
  );
}
