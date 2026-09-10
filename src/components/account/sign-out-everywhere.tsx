'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

/**
 * Ends every session but this one.
 *
 * Keeping the current session is what the person pressing this button means: they are
 * on the device they trust, revoking the ones they are not sure about. Signing
 * themselves out too would make the button self-defeating — they would have to sign
 * back in, creating exactly the kind of session they were trying to reduce.
 *
 * Confirmed inline rather than in a dialog. The action is reversible by signing in
 * again, so a modal would be ceremony; but it affects devices that are not in front of
 * the person, so it should not happen on one click either.
 */
export function SignOutEverywhere({ count }: { count: number }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);

  if (!confirming) {
    return (
      <Button variant="outline" size="sm" onClick={() => setConfirming(true)}>
        Sign out {count} other {count === 1 ? 'device' : 'devices'}
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="danger"
        size="sm"
        disabled={pending}
        onClick={() => {
          setPending(true);
          void fetch('/api/auth/sign-out-everywhere', { method: 'POST' })
            .catch(() => undefined)
            .then(() => {
              setPending(false);
              setConfirming(false);
              router.refresh();
            });
        }}
      >
        {pending ? 'Signing out…' : 'Yes, sign them out'}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)} disabled={pending}>
        Cancel
      </Button>
    </div>
  );
}
