'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Arch } from '@/components/motifs/arch';

/**
 * The catalogue did not answer.
 *
 * Distinct from not-found on purpose: nothing is missing, something is broken, and the
 * useful action is to try again rather than to go somewhere else. The `digest` is the
 * server-side error id — it is the only thing here that lets a report be matched to a
 * log line, so it is shown rather than swallowed.
 */
export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[storefront]', error);
  }, [error]);

  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-5 px-6 py-28 text-center">
      <Arch className="h-10 w-20 text-[var(--rule)]" />
      <h1 className="font-display text-3xl [--opsz:48] [--wght:600]">The shop is not answering</h1>
      <p className="text-sm text-[var(--ink-muted)]">
        Something went wrong loading this page. It is usually brief — try again in a moment.
      </p>
      <Button onClick={reset} className="mt-2">
        Try again
      </Button>
      {error.digest && (
        <p className="tabular text-2xs text-[var(--ink-faint)]">Reference {error.digest}</p>
      )}
    </main>
  );
}
