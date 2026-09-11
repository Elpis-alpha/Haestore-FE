'use client';

import Link from 'next/link';
import { Dialog, DialogClose, DrawerContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Price } from '@/components/ui/price';
import { SlabRule } from '@/components/motifs/rule';
import { Skeleton } from '@/components/ui/skeleton';
import { useCart } from './cart-provider';
import { CartLineRow } from './cart-line-row';

/**
 * The bag, in the header.
 *
 * The trigger and the drawer are one component because they are one piece of state, and
 * because the header is a server component — this is the client island inside it. It
 * reads its count from the provider, which reads it from a cookie until a real cart has
 * been fetched, so the badge is correct on a statically rendered page without making
 * that page dynamic.
 */
export function BagButton() {
  const { cart, itemCount, open, setOpen, loading, error } = useCart();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        className="relative shrink-0 text-[var(--ink-muted)] hover:text-[var(--ink)]"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        <BagGlyph />
        {itemCount > 0 && (
          <span
            aria-hidden
            className="tabular absolute top-1 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-[var(--ink)] px-1 text-[10px] leading-none font-medium text-[var(--surface)]"
          >
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
        <span className="sr-only">
          {itemCount === 0 ? 'Your bag is empty' : `Your bag — ${itemCount} items`}
        </span>
      </Button>

      <DrawerContent aria-describedby={undefined}>
        <header className="flex items-center justify-between gap-3 px-5 pt-5 pb-3">
          <h2 className="font-display text-xl [--opsz:24] [--wght:600]">Your bag</h2>
        </header>
        <SlabRule className="mx-5" />

        <div className="grow overflow-y-auto px-5">
          {error && (
            <p className="mt-4 rounded-sm border border-[var(--bad)]/40 p-3 text-sm text-[var(--bad)]">
              {error}
            </p>
          )}

          {loading && cart.lines.length === 0 ? (
            <div className="flex flex-col gap-4 py-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          ) : cart.lines.length === 0 ? (
            <Empty />
          ) : (
            <ul className="divide-y divide-[var(--rule)]">
              {cart.lines.map((line) => (
                <CartLineRow key={line.lineKey} line={line} compact />
              ))}
            </ul>
          )}

          {cart.savedForLater.length > 0 && (
            <section className="pb-4">
              <h3 className="pt-4 pb-1 text-sm font-medium text-[var(--ink-muted)]">
                Saved for later
              </h3>
              <ul className="divide-y divide-[var(--rule)]">
                {cart.savedForLater.map((line) => (
                  <CartLineRow key={line.lineKey} line={line} saved compact />
                ))}
              </ul>
            </section>
          )}
        </div>

        {cart.lines.length > 0 && (
          <footer className="flex flex-col gap-3 px-5 pt-3 pb-5">
            <SlabRule />
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-[var(--ink-muted)]">Subtotal</span>
              <Price value={cart.subtotal} />
            </div>
            <p className="text-xs text-[var(--ink-faint)]">
              Shipping and tax are worked out at checkout.
            </p>
            {/*
              A link to the cart page, not a Pay button. Checkout is Phase 7, and the
              2022 app's checkout rendered a Pay button before it had a payment intent —
              a control that looks ready and is not is the specific mistake this repo
              keeps declining to repeat.
            */}
            <DialogClose asChild>
              <Button asChild size="lg">
                <Link href="/cart">Review your bag</Link>
              </Button>
            </DialogClose>
          </footer>
        )}
      </DrawerContent>
    </Dialog>
  );
}

function Empty() {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-center">
      <BagGlyph className="size-8 text-[var(--ink-faint)]" />
      <p className="text-sm text-[var(--ink-muted)]">Your bag is empty.</p>
      <DialogClose asChild>
        <Button variant="outline" size="sm" asChild>
          <Link href="/shop">Go to the shop</Link>
        </Button>
      </DialogClose>
    </div>
  );
}

/**
 * Drawn rather than imported, matching the account glyph beside it: one more icon does
 * not justify a dependency, and the handle arch is the logo's own shape.
 */
function BagGlyph({ className = 'size-5' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className={className} fill="none">
      <path
        d="M3.75 6.75h12.5l-1 9.5a1 1 0 0 1-1 .9H5.75a1 1 0 0 1-1-.9l-1-9.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M7.25 8.5v-2a2.75 2.75 0 0 1 5.5 0v2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
