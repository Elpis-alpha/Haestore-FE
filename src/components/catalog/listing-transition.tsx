'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useMemo, useTransition } from 'react';
import { listingHref, type ListingParams } from '@/lib/listing/params';

/**
 * The listing's single piece of client state, and it is not the filters.
 *
 * The filters live in the URL. What lives here is *whether a refinement is in flight* —
 * which the facet panel starts and the product grid has to know about, and which nothing
 * on the server can tell either of them.
 *
 * The shape is deliberate: the panel and the grid are both rendered by the server, and
 * this provider wraps them as children. A client component accepting server-rendered
 * children is what lets the grid stay a server component while still dimming when a
 * checkbox two columns to its left is ticked.
 */

type ListingContext = {
  /** The current URL state, parsed on the server. Controls read it rather than re-parsing. */
  params: ListingParams;
  /** `/shop`, or `/shop/coffee-tea/beans`. */
  basePath: string;
  /** A refinement is in flight. Drives the grid's busy state and the panel's disabled state. */
  pending: boolean;
  /** Navigates to the canonical URL for `next`. The only way a control changes anything. */
  refine: (next: ListingParams) => void;
};

const Context = createContext<ListingContext | null>(null);

export function useListing(): ListingContext {
  const context = useContext(Context);
  if (!context) throw new Error('A listing control was rendered outside <ListingTransition>.');
  return context;
}

export function ListingTransition({
  params,
  basePath,
  children,
}: {
  params: ListingParams;
  basePath: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const refine = useCallback(
    (next: ListingParams) => {
      /**
       * `push`, not `replace`.
       *
       * The plan specified `replace`, and that turns out to defeat the reason it gave for
       * specifying it: Back is supposed to restore the previous filter state, and a
       * replaced entry is precisely the one Back cannot return to. A shopper who ticks a
       * box and immediately regrets it reaches for Back, not for the checkbox. See
       * docs/FRONTEND.md.
       *
       * The transition is what makes this bearable to look at: the current results stay
       * on screen, marked busy, until the new ones are ready, instead of the grid
       * emptying and refilling on every tick.
       */
      startTransition(() => router.push(listingHref(basePath, next), { scroll: false }));
    },
    [router, basePath],
  );

  const value = useMemo(
    () => ({ params, basePath, pending, refine }),
    [params, basePath, pending, refine],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}
