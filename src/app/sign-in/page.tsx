import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { Arch } from '@/components/motifs/arch';
import { SignInForm } from '@/components/account/sign-in-form';
import { Surface } from '@/components/ui/surface';
import { safeNextPath } from '@/lib/auth/next-path';
import { getSession } from '@/lib/auth/session';

/**
 * One door, for people who have been here and people who have not.
 *
 * There is no "create an account" tab and no link to one, because there is no such
 * operation to link to — the first correct code for an address makes the account. The
 * copy has to carry that, or a returning shopper hunts for a "sign in" they are already
 * looking at.
 *
 * `noindex`: a sign-in page has nothing to rank for, and every `?next=` variant would
 * be a separate URL of the same page.
 */
export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to Hæstore with a code sent to your email. No password required.',
  robots: { index: false, follow: false },
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = params.next;
  const next = safeNextPath(typeof raw === 'string' ? raw : undefined);

  // Already signed in: go where they were headed rather than showing a form that would
  // only mint a second session for the same person.
  if (await getSession()) redirect(next);

  return (
    <main className="mx-auto w-full max-w-md px-4 py-16 sm:px-6 sm:py-24">
      <div className="flex flex-col items-center gap-3 text-center">
        <Arch className="h-9 w-16 text-[var(--rule)]" />
        <h1 className="font-display text-3xl [--opsz:48] [--wght:600]">Sign in</h1>
        <p className="max-w-xs text-sm text-[var(--ink-muted)]">
          Give us your email and we will send a six-digit code. If you have not shopped here before,
          that code makes your account.
        </p>
      </div>

      <Surface
        as="section"
        tone="paper"
        className="mt-8 rounded-md border border-[var(--edge)] p-5 sm:p-8"
      >
        <SignInForm next={next} />
      </Surface>

      <p className="mt-6 text-center text-xs text-[var(--ink-faint)]">
        We only use your address to sign you in and to send order updates.
      </p>
    </main>
  );
}
