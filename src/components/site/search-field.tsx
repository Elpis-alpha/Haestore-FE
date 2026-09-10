'use client';

import { useRouter } from 'next/navigation';
import { useId, useState } from 'react';
import { canonicalQuery, EMPTY_PARAMS, setQuery } from '@/lib/listing/params';
import { cn } from '@/lib/cn';

/**
 * Search.
 *
 * A form, submitted, not a box that fires a request per keystroke. Each keystroke would
 * be a Meilisearch query and a history entry, and the shop's search is a destination —
 * you arrive at `/shop?q=kettle`, which is a page that can be linked, shared and
 * indexed. Search-as-you-type belongs to a suggestion popover, and that is a different
 * feature with a different endpoint.
 *
 * Submitting keeps any filters already applied, because searching within a narrowed
 * shelf is the obvious reading of typing into the box while looking at one.
 */
export function SearchField({ className }: { className?: string }) {
  const router = useRouter();
  const [value, setValue] = useState('');
  const id = useId();

  return (
    <form
      role="search"
      className={cn('relative', className)}
      onSubmit={(event) => {
        event.preventDefault();
        router.push(`/shop${canonicalQuery(setQuery(EMPTY_PARAMS, value))}`);
      }}
    >
      <label htmlFor={id} className="sr-only">
        Search the shop
      </label>
      <input
        id={id}
        type="search"
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search the shop"
        className={cn(
          'h-10 w-full rounded-sm border border-[var(--edge)] bg-[var(--field)]',
          'py-2 pr-3 pl-9 text-sm text-[var(--ink)]',
          'placeholder:text-[var(--ink-faint)]',
          'transition-colors hover:border-[var(--ink-muted)]',
          // Safari draws its own clear button on type=search; it lands on the wrong
          // ground here and duplicates the Escape key.
          '[&::-webkit-search-cancel-button]:hidden',
        )}
      />
      <svg
        viewBox="0 0 16 16"
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--ink-faint)]"
      >
        <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </form>
  );
}
