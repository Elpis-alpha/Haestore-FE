'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, type ButtonProps } from '@/components/ui/button';

/**
 * Ends the session from the browser, so the `Set-Cookie` that clears the cookie lands
 * on the origin holding it — the same reason signing in posts from here.
 *
 * It is a button in a form-less `<form>`-shaped role rather than a link, because it
 * changes state. A GET that signs you out can be triggered by an `<img src>` on any
 * page on the internet.
 */
export function SignOutButton({
  children = 'Sign out',
  variant = 'outline',
  size = 'sm',
  redirectTo = '/',
}: {
  children?: React.ReactNode;
  variant?: ButtonProps['variant'];
  size?: ButtonProps['size'];
  redirectTo?: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={pending}
      onClick={() => {
        setPending(true);
        void fetch('/api/auth/sign-out', { method: 'POST' })
          .catch(() => undefined)
          .then(() => {
            // Refresh first: every server component still holds the signed-in tree,
            // and navigating without discarding it shows the account page for a
            // person who no longer has a session.
            router.refresh();
            router.push(redirectTo);
          });
      }}
    >
      {pending ? 'Signing out…' : children}
    </Button>
  );
}
