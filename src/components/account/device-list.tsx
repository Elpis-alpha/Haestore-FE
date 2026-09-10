'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Device } from '@/lib/api/types';

/**
 * Every session on the account, and a way to end each one.
 *
 * The 2022 app's answer to "sign me out everywhere" was nothing at all: its JWTs had no
 * expiry and accumulated in an array on the user document that changing a password did
 * not clear. This page is the visible half of the fix — the sessions are real records
 * with real lifetimes, so they can be listed and revoked one at a time.
 *
 * The `id` on each row is a SHA-256 digest of the session id, not the session id. It is
 * safe to render, safe to put in a URL, and useless as a credential.
 */
export function DeviceList({ devices }: { devices: Device[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function revoke(device: Device) {
    setBusy(device.id);
    try {
      await fetch(`/api/auth/devices/${device.id}`, { method: 'DELETE' });
      router.refresh();
      // Ending the session you are sitting in is a sign-out, and the page you are on
      // needs you gone from it rather than refreshed into a redirect.
      if (device.current) router.push('/');
    } finally {
      setBusy(null);
    }
  }

  if (devices.length === 0) {
    return (
      <p className="text-sm text-[var(--ink-muted)]">
        No other sessions. This is the only device signed in.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {devices.map((device) => (
        <li
          key={device.id}
          className="surface-paper flex flex-wrap items-start justify-between gap-4 rounded-md border border-[var(--edge)] p-4"
        >
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-[var(--ink)]">
              {describe(device.userAgent)}
              {device.current && <Badge tone="note">This device</Badge>}
            </p>
            <p className="mt-1 text-xs text-[var(--ink-faint)]">
              Last used {relative(device.lastSeenAt)}
              {device.ip ? ` · ${device.ip}` : ''}
            </p>
            <p className="text-xs text-[var(--ink-faint)]">
              Signed in {longDate(device.createdAt)}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={busy === device.id}
            onClick={() => void revoke(device)}
          >
            {device.current ? 'Sign out' : 'Revoke'}
          </Button>
        </li>
      ))}
    </ul>
  );
}

/**
 * A user agent, in words a person recognises.
 *
 * Deliberately coarse. A full UA string is unreadable and a precise parse of one is a
 * dependency that needs updating forever; what this row has to answer is "was that me,
 * on my phone, last Tuesday" — and browser plus platform answers it.
 */
const BROWSERS: [RegExp, string][] = [
  // Order matters: Edge and Opera both claim to be Chrome, and Chrome claims to be
  // Safari. Most specific first, or every Edge session is labelled Chrome.
  [/\bEdg\//, 'Edge'],
  [/\bOPR\//, 'Opera'],
  [/\bFirefox\//, 'Firefox'],
  [/\bChrome\//, 'Chrome'],
  [/\bSafari\//, 'Safari'],
];

const PLATFORMS: [RegExp, string][] = [
  [/\biPhone\b/, 'iPhone'],
  [/\biPad\b/, 'iPad'],
  [/\bAndroid\b/, 'Android'],
  [/\bMac OS X\b/, 'Mac'],
  [/\bWindows\b/, 'Windows'],
  [/\bLinux\b/, 'Linux'],
];

function describe(userAgent: string): string {
  if (!userAgent) return 'Unknown device';

  const browser = BROWSERS.find(([pattern]) => pattern.test(userAgent))?.[1] ?? 'Browser';
  const platform = PLATFORMS.find(([pattern]) => pattern.test(userAgent))?.[1];

  return platform ? `${browser} on ${platform}` : browser;
}

/** The same long form the account page uses, so two screens do not disagree. */
function longDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function relative(iso: string): string {
  const then = new Date(iso).getTime();
  const minutes = Math.round((Date.now() - then) / 60_000);
  if (minutes < 2) return 'just now';
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return longDate(iso);
}
