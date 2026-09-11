import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Price } from '@/components/ui/price';
import { Leaf } from '@/components/motifs/leaf';
import { getWishlist, requireSession } from '@/lib/auth/session';
import { WishlistActions } from '@/components/cart/wishlist-actions';

export const metadata: Metadata = { title: 'Wishlist' };

/**
 * Things kept for later, across devices and across months.
 *
 * That promise is why the wishlist needs an account: a guest cookie is one browser, it
 * expires in thirty days, and clearing site data destroys it silently. The signed-out
 * shape of the same need is the bag's own "saved for later", which is honest about its
 * lifetime because it sits beside things that are plainly temporary.
 *
 * Price and stock are read live on every render rather than snapshotted. A wishlist is
 * looked at weeks after it is written, and "is it back in stock, is it cheaper now" is
 * the only question anybody brings to it.
 */
export default async function WishlistPage() {
  await requireSession('/account/wishlist');
  const entries = await getWishlist();

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-[var(--ink-muted)]">You have not saved anything yet.</p>
        <Link href="/shop" className="text-sm underline underline-offset-4">
          Go to the shop
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
      {entries.map((entry) => (
        <li key={`${entry.productId}:${entry.variantId ?? 'any'}`} className="flex gap-4 py-5">
          <Link
            href={`/product/${entry.slug}`}
            className="relative size-24 shrink-0 overflow-hidden rounded-t-[999px] rounded-b-sm bg-[var(--groove)]"
          >
            {entry.imagePublicId ? (
              <Image
                src={entry.imagePublicId}
                alt={entry.title}
                fill
                sizes="6rem"
                className="object-cover"
              />
            ) : (
              <span className="grid h-full place-items-center text-[var(--ink-faint)]">
                <Leaf aria-hidden className="size-6" />
              </span>
            )}
          </Link>

          <div className="flex min-w-0 grow flex-col gap-2">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <Link href={`/product/${entry.slug}`} className="font-medium hover:underline">
                {entry.title}
              </Link>
              {entry.price && (
                <Price
                  value={entry.price}
                  {...(entry.priceTo && entry.priceTo.amount !== entry.price.amount
                    ? { to: entry.priceTo }
                    : {})}
                  className="text-sm"
                />
              )}
            </div>

            {!entry.available ? (
              <Badge tone="neutral" className="self-start">
                No longer sold
              </Badge>
            ) : entry.inStock ? (
              <Badge tone="good" className="self-start">
                In stock
              </Badge>
            ) : (
              // Out of stock is not gone, and the difference is the whole reason
              // somebody keeps a wishlist.
              <Badge tone="note" className="self-start">
                Out of stock for now
              </Badge>
            )}

            <WishlistActions
              productId={entry.productId}
              variantId={entry.variantId}
              lineKey={entry.lineKey}
              slug={entry.slug}
              canAdd={entry.available && entry.inStock}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
