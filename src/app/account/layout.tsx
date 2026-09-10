import type { Metadata } from 'next';
import { AccountTabs } from '@/components/account/account-tabs';

/**
 * The account area's frame.
 *
 * **There is no `loading.tsx` here, and there must not be one.** A Suspense boundary
 * lets Next flush the shell and commit a 200 before the page has decided anything —
 * which in this area means before it has decided whether the session is valid. The
 * `redirect()` to sign-in would then arrive after the status and degrade to a meta
 * refresh in the body: a signed-out person watching the account page render, and then
 * bounce. Phase 4 learned this on `notFound()`; it is the same mechanism.
 *
 * `noindex` across the whole subtree. There is nothing here for anyone but its owner,
 * and a crawler reaching it would only ever be shown the sign-in page anyway.
 */
export const metadata: Metadata = {
  title: { default: 'Your account', template: '%s · Your account' },
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12 sm:py-16">
      <h1 className="font-display text-3xl [--opsz:48] [--wght:600]">Your account</h1>
      <AccountTabs />
      <div className="pt-8">{children}</div>
    </main>
  );
}
