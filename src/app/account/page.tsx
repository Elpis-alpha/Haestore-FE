import Link from 'next/link';
import { NameForm } from '@/components/account/name-form';
import { SignOutButton } from '@/components/account/sign-out-button';
import { Surface } from '@/components/ui/surface';
import { requireSession } from '@/lib/auth/session';

/**
 * What the shop knows about you, which is deliberately almost nothing.
 *
 * An email address, an optional name, and when you first verified. There is no
 * password to change, no security questions, no recovery address — the account has no
 * long-lived secret, so there is nothing here to rotate or to lose.
 *
 * Orders arrive in Phase 7 and will be the substance of this page. Until then it says
 * what is true rather than showing an empty "Your orders" panel for a shop that cannot
 * yet take one.
 */
export default async function AccountPage() {
  const { account } = await requireSession('/account');

  return (
    <div className="flex flex-col gap-10">
      <Surface tone="paper" className="rounded-md border border-[var(--edge)] p-6">
        <dl className="grid gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-[var(--ink-faint)]">Email</dt>
            <dd className="mt-0.5 text-sm break-all text-[var(--ink)]">{account.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--ink-faint)]">Shopping here since</dt>
            <dd className="mt-0.5 text-sm text-[var(--ink)]">
              {new Date(account.createdAt).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </dd>
          </div>
        </dl>

        <p className="mt-5 border-t border-[var(--rule)] pt-4 text-xs text-[var(--ink-faint)]">
          There is no password on this account. You sign in with a code sent to your address, so
          there is nothing to remember and nothing to steal.
        </p>
      </Surface>

      <section>
        <h2 className="font-display text-xl [--wght:600]">Your details</h2>
        <div className="mt-4">
          <NameForm name={account.name} />
        </div>
      </section>

      <section>
        <h2 className="font-display text-xl [--wght:600]">Signing out</h2>
        <p className="mt-2 max-w-prose text-sm text-[var(--ink-muted)]">
          Signing out ends this session only. To end one on a device you no longer have, see{' '}
          <Link href="/account/devices" className="underline underline-offset-4">
            signed-in devices
          </Link>
          .
        </p>
        <div className="mt-4">
          <SignOutButton />
        </div>
      </section>
    </div>
  );
}
