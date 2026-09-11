'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { QuantityStepper } from '@/components/ui/quantity';
import { useCart } from './cart-provider';

/**
 * Add to bag, on the product page.
 *
 * Phase 4 shipped this page with no control here at all — deliberately, and with no
 * disabled placeholder, because a button that does nothing teaches people the buttons do
 * nothing. This is the control arriving with a cart behind it.
 *
 * It sends a product, a variant and a quantity. **It cannot send a price**, because
 * there is no field on the server to receive one — which is the structural version of
 * the 2022 app's worst defect being fixed rather than the careful version.
 */
export function AddToBag({
  productId,
  variantId,
  available,
  backorderable,
  maxQuantity,
}: {
  productId: string;
  /** Null when the chosen axis combination is not a variant the shop sells. */
  variantId: string | null;
  available: number;
  backorderable: boolean;
  maxQuantity: number;
}) {
  const { add } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [pending, setPending] = useState(false);

  const soldOut = !backorderable && available <= 0;
  const unavailable = variantId === null;
  const ceiling = Math.max(1, maxQuantity);

  async function submit() {
    if (!variantId) return;
    setPending(true);
    try {
      // The provider opens the drawer on success, which is the confirmation — a toast
      // saying "added" next to a drawer showing the thing added is the same sentence
      // twice.
      await add(productId, variantId, quantity);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <QuantityStepper
        value={Math.min(quantity, ceiling)}
        max={ceiling}
        onValueChange={setQuantity}
      />
      <Button
        size="lg"
        className="grow sm:grow-0"
        disabled={pending || soldOut || unavailable}
        onClick={() => void submit()}
      >
        {unavailable
          ? 'Not a combination we stock'
          : soldOut
            ? 'Sold out'
            : pending
              ? 'Adding…'
              : 'Add to bag'}
      </Button>
    </div>
  );
}
