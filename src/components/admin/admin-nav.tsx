'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/cn';

/**
 * The back room's doors, grouped by what the work is.
 *
 * Three groups because an admin arrives with one of three jobs — something has been
 * ordered, something needs changing on the shelves, or someone needs help — and the
 * grouping is the only structure the list needs. The groups are headed in sentence case
 * and in the muted ink, not tracked capitals: they are there to be scanned past.
 */
const groups = [
  {
    label: 'Counter',
    links: [
      { href: '/admin', label: 'Today', exact: true },
      { href: '/admin/orders', label: 'Orders' },
      { href: '/admin/support', label: 'Support' },
      { href: '/admin/customers', label: 'Customers' },
    ],
  },
  {
    label: 'Shelves',
    links: [
      { href: '/admin/catalog/products', label: 'Products' },
      { href: '/admin/catalog/categories', label: 'Categories' },
      { href: '/admin/catalog/attributes', label: 'Attributes' },
    ],
  },
  {
    label: 'Shop front',
    links: [
      { href: '/admin/storefront', label: 'Front page' },
      { href: '/admin/reviews', label: 'Reviews' },
      { href: '/admin/audit', label: 'Audit log' },
    ],
  },
];

export function AdminNav() {
  const pathname = usePathname();
  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav aria-label="Admin console">
      {/* Below lg: one scrolling strip, contained, so the page itself never scrolls sideways. */}
      <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2 lg:hidden">
        {groups
          .flatMap((group) => group.links)
          .map((link) => (
            <li key={link.href} className="shrink-0">
              <Link
                href={link.href}
                aria-current={isActive(link.href, link.exact) ? 'page' : undefined}
                className={cn(
                  'block rounded-sm px-3 py-2 text-sm transition-colors',
                  isActive(link.href, link.exact)
                    ? 'bg-[var(--ink)] text-[var(--surface)]'
                    : 'text-[var(--ink-muted)] hover:bg-[var(--ink)]/8 hover:text-[var(--ink)]',
                )}
              >
                {link.label}
              </Link>
            </li>
          ))}
      </ul>

      <div className="surface-well hidden rounded-lg p-3 lg:sticky lg:top-24 lg:block">
        {groups.map((group) => (
          <div key={group.label} className="mb-4 last:mb-0">
            <p className="px-2.5 pb-1.5 text-xs text-[var(--ink-faint)]">{group.label}</p>
            <ul className="flex flex-col gap-0.5">
              {group.links.map((link) => {
                const active = isActive(link.href, link.exact);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'relative block rounded-sm px-2.5 py-1.5 text-sm transition-colors',
                        active
                          ? 'bg-[var(--ink)]/10 font-medium text-[var(--ink)]'
                          : 'text-[var(--ink-muted)] hover:bg-[var(--ink)]/6 hover:text-[var(--ink)]',
                      )}
                    >
                      {/* The slab tick from the H, marking where you are. */}
                      {active && (
                        <span
                          aria-hidden
                          className="absolute top-1.5 bottom-1.5 left-0 w-0.5 rounded-full bg-[var(--ink)]"
                        />
                      )}
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
