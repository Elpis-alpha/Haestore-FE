import type { Metadata } from 'next';
import { DeviceList } from '@/components/account/device-list';
import { SignOutEverywhere } from '@/components/account/sign-out-everywhere';
import { getDevices, requireSession } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Signed-in devices' };

/**
 * Every session on this account, with a way to end each one.
 *
 * This page is the answer to the 2022 app's worst defect: it signed JWTs with no expiry
 * and kept them in an unbounded array on the user document, which changing a password
 * did not clear. A token issued on a laptop sold three years ago still worked. Sessions
 * here are records with a thirty-day sliding lifetime, and every one of them is listed
 * on this page and revocable from it.
 */
export default async function DevicesPage() {
  await requireSession('/account/devices');
  const devices = await getDevices();
  const others = devices.filter((device) => !device.current).length;

  return (
    <div className="flex flex-col gap-8">
      <p className="max-w-prose text-sm text-[var(--ink-muted)]">
        A session is created each time you sign in, and lasts thirty days from its last use.
        Revoking one takes effect immediately — the device is signed out on its very next request,
        not whenever it next happens to check.
      </p>

      <DeviceList devices={devices} />

      {others > 0 && (
        <section className="border-t border-[var(--rule)] pt-6">
          <h2 className="font-display text-xl [--wght:600]">Sign out everywhere else</h2>
          <p className="mt-2 max-w-prose text-sm text-[var(--ink-muted)]">
            Ends every session except this one. Worth doing if you have signed in on a device you no
            longer have.
          </p>
          <div className="mt-4">
            <SignOutEverywhere count={others} />
          </div>
        </section>
      )}
    </div>
  );
}
