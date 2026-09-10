'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import type { Category } from '@/lib/api/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DrawerContent,
} from '@/components/ui/dialog';
import { SlabRule } from '@/components/motifs/rule';
import { Wordmark } from '@/components/motifs/wordmark';
import { SearchField } from './search-field';

/**
 * The shelves, on a narrow screen.
 *
 * The whole tree, two levels deep, in one scroll — not an accordion of accordions. A
 * general store has six shelves; hiding them behind a second tap to save vertical space
 * that is not scarce is the wrong trade.
 */
export function MobileNav({ roots, categories }: { roots: Category[]; categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  /**
   * Radix keeps a drawer open across a client-side navigation, so a tapped link would
   * leave the shopper looking at the menu they just used.
   *
   * Adjusted during render rather than in an effect. An effect would paint the drawer
   * over the new page for one frame and then close it, and React re-runs this render
   * immediately without committing the first pass — so the drawer is simply gone.
   */
  const [routeWhenOpened, setRouteWhenOpened] = useState(pathname);
  if (pathname !== routeWhenOpened) {
    setRouteWhenOpened(pathname);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <svg viewBox="0 0 16 16" aria-hidden>
            <path
              d="M2 4h12M2 8h12M2 12h12"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          <span className="sr-only">Open the shelves</span>
        </Button>
      </DialogTrigger>

      <DrawerContent aria-describedby={undefined} className="left-0 right-auto">
        <DialogHeader className="p-5 pb-4">
          <DialogTitle asChild>
            <Wordmark />
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 pb-4">
          <SearchField />
        </div>

        <nav aria-label="Shelves" className="grow overflow-y-auto px-5 pb-10">
          <ul className="flex flex-col gap-5">
            {roots.map((root) => {
              const children = categories.filter((c) => c.parent === root._id);
              return (
                <li key={root._id}>
                  <Link
                    href={`/shop/${root.path}`}
                    className="font-display text-lg [--opsz:22] [--wght:600]"
                  >
                    {root.name}
                  </Link>
                  {children.length > 0 && (
                    <ul className="mt-2 flex flex-col gap-0.5 border-l border-[var(--rule)] pl-4">
                      {children.map((child) => (
                        <li key={child._id}>
                          <Link
                            href={`/shop/${child.path}`}
                            className="block py-1 text-sm text-[var(--ink-muted)] hover:text-[var(--ink)]"
                          >
                            {child.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>

          <SlabRule className="my-6" />

          <Link href="/shop" className="text-sm underline underline-offset-4">
            Everything in the shop
          </Link>
        </nav>
      </DrawerContent>
    </Dialog>
  );
}
