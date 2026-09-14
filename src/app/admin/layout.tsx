import type { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth/session';
import { AdminNav } from '@/components/admin/admin-nav';
import { ConsoleProvider } from '@/components/admin/console-provider';

/**
 * The back room.
 *
 * **Decided here, before anything renders:** a signed-out visitor is redirected to sign in
 * and a signed-in non-admin gets the ordinary 404 — the same answer as the API, so the
 * console is no more discoverable from the frontend than from `/api/admin`. The middleware
 * in front turns away requests with no cookie at all; this is the check that asks the API.
 *
 * **No `loading.tsx`, here or anywhere beneath.** Every page under this layout can redirect
 * or 404, and a Suspense boundary at the route lets Next commit a 200 before either
 * decision — the soft-404 lesson from Phase 4, and the third area it applies to.
 *
 * The site header stays above the console. Walking behind the counter does not take you out
 * of the shop, and the header's links are the fastest way to check what a change did to it.
 */
export const metadata: Metadata = {
  title: { default: 'Admin · Hæstore', template: '%s · Admin · Hæstore' },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin('/admin');

  return (
    <ConsoleProvider email={session.account.email} viewerId={session.account.id}>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[12.5rem_minmax(0,1fr)] lg:gap-10 lg:px-8 lg:py-10">
        <AdminNav />
        <main className="mt-4 min-w-0 lg:mt-0">{children}</main>
      </div>
    </ConsoleProvider>
  );
}
