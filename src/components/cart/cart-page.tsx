'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Price } from '@/components/ui/price';
import { Skeleton } from '@/components/ui/skeleton';
import { SlabRule } from '@/components/motifs/rule';
import { isBlocking } from '@/lib/cart/types';
import { useCart } from './cart-provider';
import { CartLineRow } from './cart-line-row';
import { MergeReportPanel } from './merge-report';

/**
 * The bag, in full.
 *
 * Fetched on mount rather than trusted from the drawer's copy: this is the last screen
 * before money, and a stale price here is the exact failure the whole re-pricing design
 * exists to prevent. It is one request, on a page nobody reaches by accident.
 */
export function CartPage() {
  const { cart, loading, error, refresh } = useCart();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const settling = loading && cart.lines.length === 0 && cart.savedForLater.length === 0;
  const empty = cart.lines.length === 0;

  /**
   * A line the checkout transaction would refuse. Phase 6 shipped `isBlocking` with
   * nothing consuming it and left a note saying so; this and the checkout form are the
   * two consumers.
   */
  const blocked = cart.lines.some((line) => line.changes.some(isBlocking));

  /**
   * The report sits outside the loading branch on purpose.
   *
   * An early return for the skeleton unmounts everything below it, so the panel mounted
   * twice — once before the cart read settled and once after — and fetched twice. Its
   * own effect runs on mount, so "render it in both states" is the fix rather than a
   * guard inside the effect.
   */
  return (
    <div className="mt-8 flex flex-col gap-8">
      <MergeReportPanel />

      {settling && (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      )}

      {error && (
        <p className="rounded-sm border border-[var(--bad)]/40 p-3 text-sm text-[var(--bad)]">
          {error}
        </p>
      )}

      {settling ? null : empty ? (
        <div className="flex flex-col items-start gap-4">
          <p className="text-[var(--ink-muted)]">There is nothing in your bag yet.</p>
          <Button asChild>
            <Link href="/shop">Go to the shop</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section>
            <h2 className="sr-only">Items</h2>
            <ul className="divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
              {cart.lines.map((line) => (
                <CartLineRow key={line.lineKey} line={line} />
              ))}
            </ul>
          </section>

          <aside className="surface-raised h-fit rounded-md p-5 lg:sticky lg:top-24">
            <h2 className="font-display text-lg [--opsz:24] [--wght:600]">Summary</h2>
            <SlabRule className="my-3" />

            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-[var(--ink-muted)]">
                  Subtotal ({cart.itemCount} {cart.itemCount === 1 ? 'item' : 'items'})
                </dt>
                <dd>
                  <Price value={cart.subtotal} />
                </dd>
              </div>
              {/*
                Stated as a fact, not deferred. This shop charges neither, and "worked
                out at checkout" — which stood here while checkout did not exist — reads
                as a number about to be added.
              */}
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-[var(--ink-muted)]">Delivery and tax</dt>
                <dd className="text-[var(--ink-faint)]">None on this order</dd>
              </div>
            </dl>

            {cart.needsAttention && (
              <p className="mt-4 rounded-sm border border-[var(--note)]/40 p-3 text-xs text-[var(--note)]">
                Some items changed since you added them. The notes beside each one say what — have a
                look before you pay.
              </p>
            )}

            {/*
              The button that was deliberately absent through Phase 6, now that there is
              something behind it. It is disabled only when the server would refuse the
              checkout anyway — a line that has sold out or been clamped — so a shopper
              is told here rather than after filling in an address.
            */}
            <Button asChild={!blocked} size="lg" className="mt-5 w-full" disabled={blocked}>
              {blocked ? (
                <span>Fix your bag to continue</span>
              ) : (
                <Link href="/checkout">Checkout</Link>
              )}
            </Button>
          </aside>
        </div>
      )}

      {cart.savedForLater.length > 0 && (
        <section>
          <h2 className="font-display text-xl [--opsz:24] [--wght:600]">Saved for later</h2>
          <ul className="mt-2 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
            {cart.savedForLater.map((line) => (
              <CartLineRow key={line.lineKey} line={line} saved />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
