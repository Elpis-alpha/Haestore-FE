'use client';

import { useState } from 'react';
import type { Facet } from '@/lib/api/types';
import { activeFilterCount, clearFilters } from '@/lib/listing/params';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogTrigger,
  DrawerContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { SlabRule } from '@/components/motifs/rule';
import { FacetControl, InStockFacet, PriceFacet } from './facet-controls';
import { useListing } from './listing-transition';

/**
 * The filter panel, assembled at request time from whatever the shop currently sells.
 *
 * There is no list of filters in this codebase. `facets` arrives already shaped — label,
 * control type, values, counts — from definitions an admin wrote, and every group here
 * is one of those. This component's whole job is deciding which groups start open and
 * getting out of the way.
 */
export function FacetPanel({
  facets,
  currency,
  /** The drawer supplies its own title, so the panel does not repeat it. */
  headed = true,
}: {
  facets: Facet[];
  currency: string;
  headed?: boolean;
}) {
  const { params, pending, refine } = useListing();
  const count = activeFilterCount(params);

  /**
   * A group the shopper has already used is open; otherwise the first three are, and the
   * rest are a scroll away rather than a wall. Uncontrolled after the first render, so
   * opening a group is not undone by the next refinement.
   */
  const [open, setOpen] = useState<string[]>(() => {
    const used = facets.filter((f) => params.attributes[f.key]).map((f) => f.key);
    const seeded = used.length > 0 ? used : facets.slice(0, 3).map((f) => f.key);
    return ['__shop__', ...seeded];
  });

  return (
    <div aria-busy={pending} className="flex flex-col gap-4">
      {(headed || count > 0) && (
        <>
          <div className="flex items-baseline justify-between gap-3">
            {headed && <h2 className="font-display text-lg [--opsz:20] [--wght:600]">Refine</h2>}
            {/* "Clear all" here and above the results, because it is the same action.
                A count would read "1 filter" beside two visible chips —
                `activeFilterCount` counts controls, not ticked values. */}
            {count > 0 && (
              <Button
                variant="link"
                size="sm"
                className="ml-auto"
                onClick={() => refine(clearFilters(params))}
              >
                Clear all
              </Button>
            )}
          </div>
          <SlabRule />
        </>
      )}

      <Accordion type="multiple" value={open} onValueChange={setOpen}>
        {/* Price and availability first: they are the two things a shopper narrows by
            before they know what the shop calls anything. */}
        <AccordionItem value="__shop__">
          <AccordionTrigger>Price &amp; availability</AccordionTrigger>
          <AccordionContent className="flex flex-col gap-4 text-[var(--ink)]">
            <PriceFacet currency={currency} />
            <SlabRule />
            <InStockFacet />
          </AccordionContent>
        </AccordionItem>

        {facets.map((facet) => (
          <AccordionItem key={facet.key} value={facet.key}>
            <AccordionTrigger>
              {facet.label}
              {params.attributes[facet.key] && (
                <span className="tabular ml-auto mr-1 rounded-xs bg-[var(--ink)] px-1.5 text-2xs text-[var(--surface)]">
                  {params.attributes[facet.key]?.length}
                </span>
              )}
            </AccordionTrigger>
            <AccordionContent className="text-[var(--ink)]">
              <FacetControl facet={facet} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

/**
 * The same panel, in a drawer, for viewports too narrow to carry a sidebar.
 *
 * One component rendered twice rather than a phone version and a desktop version: a
 * filter that only works on one of them is the classic way this goes wrong, and there is
 * no second implementation here to forget to update.
 */
export function FacetDrawer({ facets, currency }: { facets: Facet[]; currency: string }) {
  const { params } = useListing();
  const count = activeFilterCount(params);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="md" className="lg:hidden">
          Filters
          {count > 0 && (
            <span className="tabular rounded-xs bg-[var(--ink)] px-1.5 text-2xs text-[var(--surface)]">
              {count}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DrawerContent aria-describedby={undefined}>
        <DialogHeader className="p-5 pb-3">
          <DialogTitle>Refine</DialogTitle>
        </DialogHeader>
        <div className="grow overflow-y-auto px-5 pb-8">
          <FacetPanel facets={facets} currency={currency} headed={false} />
        </div>
      </DrawerContent>
    </Dialog>
  );
}
