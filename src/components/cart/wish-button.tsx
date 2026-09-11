'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import * as api from '@/lib/cart/client';
import { CartError } from '@/lib/cart/client';

/**
 * Save to wishlist.
 *
 * A wishlist needs an account — see the backend's wishlist.model.ts for why that is a
 * decision rather than a gap. A signed-out shopper pressing this gets sent to sign in
 * and brought straight back, which is one click and honest; the alternative, hiding the
 * control until you sign in, hides the reason to.
 *
 * There is no session read here and there must not be: this component renders on the
 * product page, which is cached, and asking who is looking would make it dynamic. The
 * 401 is the answer, and it arrives only for somebody who actually pressed the button.
 */
export function WishButton({
  productId,
  variantId,
  initiallySaved = false,
  returnTo,
}: {
  productId: string;
  variantId?: string | null;
  initiallySaved?: boolean;
  returnTo: string;
}) {
  const [saved, setSaved] = useState(initiallySaved);
  const [pending, setPending] = useState(false);

  async function toggle() {
    setPending(true);
    const next = !saved;
    try {
      if (next) await api.addWish(productId, variantId);
      else await api.removeWish(productId, variantId);
      setSaved(next);
    } catch (error) {
      if (error instanceof CartError && error.status === 401) {
        window.location.href = `/sign-in?next=${encodeURIComponent(returnTo)}`;
        return;
      }
      // Anything else leaves the control as it was rather than claiming a save that did
      // not happen — a heart that fills on a failed request is a lie that survives a
      // reload.
      setSaved(saved);
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="lg"
      type="button"
      aria-pressed={saved}
      disabled={pending}
      onClick={() => void toggle()}
      className="shrink-0"
    >
      <HeartGlyph filled={saved} />
      {saved ? 'Saved' : 'Save'}
    </Button>
  );
}

function HeartGlyph({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className="size-5">
      <path
        d="M10 16.5S3.75 12.6 3.75 8.25a3.25 3.25 0 0 1 6.25-1.2 3.25 3.25 0 0 1 6.25 1.2C16.25 12.6 10 16.5 10 16.5Z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
