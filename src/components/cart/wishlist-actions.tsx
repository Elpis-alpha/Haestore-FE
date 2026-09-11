'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import * as api from '@/lib/cart/client';
import { useCart } from './cart-provider';

/**
 * The two things you do with a saved item: buy it, or stop saving it.
 *
 * "Add to bag" only appears when the wish named a *variant* — a wish for a product with
 * three grinds has no answer to "which one", and guessing on the shopper's behalf is how
 * the wrong coffee arrives. Those send you to the product page to choose, which is one
 * click and correct, rather than zero clicks and a coin toss.
 */
export function WishlistActions({
  productId,
  variantId,
  lineKey,
  slug,
  canAdd,
}: {
  productId: string;
  variantId: string | null;
  lineKey: string | null;
  slug: string;
  canAdd: boolean;
}) {
  const router = useRouter();
  const { add } = useCart();
  const [busy, setBusy] = useState(false);

  async function remove() {
    setBusy(true);
    try {
      await api.removeWish(productId, variantId);
      // The list is rendered on the server, so the server is what has to re-render it.
      // Filtering a local copy would leave the two disagreeing after any navigation.
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function intoBag() {
    if (!variantId) return;
    setBusy(true);
    try {
      await add(productId, variantId, 1);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {canAdd &&
        (lineKey ? (
          <Button size="sm" disabled={busy} onClick={() => void intoBag()}>
            Add to bag
          </Button>
        ) : (
          <Button size="sm" variant="outline" asChild>
            <Link href={`/product/${slug}`}>Choose an option</Link>
          </Button>
        ))}
      <Button
        variant="link"
        size="sm"
        className="text-xs"
        disabled={busy}
        onClick={() => void remove()}
      >
        Remove
      </Button>
    </div>
  );
}
