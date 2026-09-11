'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

const tabs = [
  { href: '/account', label: 'Account' },
  { href: '/account/orders', label: 'Orders' },
  { href: '/account/wishlist', label: 'Wishlist' },
  { href: '/account/devices', label: 'Signed-in devices' },
];

/**
 * Which section you are in.
 *
 * A client component only because the current path is a client fact. The alternative —
 * passing the pathname down from each page — puts the same prop on every page in the
 * area forever, and forgetting it on the next one is a tab bar with nothing selected.
 *
 * `aria-current="page"` carries the state for a screen reader; the underline carries it
 * for everyone else. Colour alone would not.
 */
export function AccountTabs() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Account sections"
      className="mt-6 flex gap-1 border-b border-[var(--rule)] pb-px"
    >
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'rounded-t-xs px-3 py-2 text-sm transition-colors',
              '-mb-px border-b-2',
              active
                ? 'border-[var(--ink)] text-[var(--ink)]'
                : 'border-transparent text-[var(--ink-muted)] hover:bg-[var(--ink)]/5 hover:text-[var(--ink)]',
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
