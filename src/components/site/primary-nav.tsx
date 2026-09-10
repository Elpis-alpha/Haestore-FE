'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { Category } from '@/lib/api/types';
import { cn } from '@/lib/cn';

/**
 * The shelves, across the top.
 *
 * Top-level categories only, and no mega-menu. Sub-shelves appear on the shelf's own
 * page, where a shopper who has chosen "Coffee & tea" can see the four things inside it
 * in context rather than in a panel that vanishes when the pointer slips.
 *
 * The current shelf is marked with a rule under it rather than a colour: colour means
 * something specific in this system, and "you are here" is not one of the things it
 * means.
 */
export function PrimaryNav({ roots }: { roots: Category[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Shelves" className="hidden md:block">
      <ul className="flex items-center gap-1">
        {roots.map((root) => {
          const href = `/shop/${root.path}`;
          const current = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={root._id}>
              <Link
                href={href}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'relative block rounded-xs px-3 py-2 text-sm whitespace-nowrap',
                  'transition-colors',
                  current ? 'text-[var(--ink)]' : 'text-[var(--ink-muted)] hover:text-[var(--ink)]',
                  'after:absolute after:inset-x-3 after:bottom-1 after:h-px after:origin-left',
                  'after:bg-[var(--ink)] after:transition-transform after:duration-200',
                  'after:ease-[var(--ease-out-soft)]',
                  current ? 'after:scale-x-100' : 'after:scale-x-0 hover:after:scale-x-100',
                )}
              >
                {root.name}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
