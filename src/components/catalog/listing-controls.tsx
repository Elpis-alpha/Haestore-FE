'use client';

import type { Facet } from '@/lib/api/types';
import { formatMoney } from '@/lib/money';
import {
  clearFilters,
  effectiveSort,
  parseRange,
  setInStock,
  setPrice,
  setFacetValues,
  toggleFacetValue,
  SORT_LABELS,
  SORT_KEYS,
  setSort,
  type SortKey,
} from '@/lib/listing/params';
import { Button } from '@/components/ui/button';
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useListing } from './listing-transition';

/**
 * Sort order.
 *
 * Relevance is offered only when there is something to be relevant to. Listing it on an
 * unsearched shop would be a sort that silently means "newest", which is the kind of
 * control that teaches people the controls do nothing.
 */
export function SortControl() {
  const { params, pending, refine } = useListing();
  const available: SortKey[] = SORT_KEYS.filter((key) => key !== 'relevance' || params.q);

  return (
    <SelectRoot
      value={effectiveSort(params)}
      disabled={pending}
      onValueChange={(value) => refine(setSort(params, value as SortKey))}
    >
      <SelectTrigger aria-label="Sort products" className="w-auto min-w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {available.map((key) => (
          <SelectItem key={key} value={key}>
            {SORT_LABELS[key]}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  );
}

/**
 * What is currently applied, and how to take it off.
 *
 * The panel says what *could* be filtered; this says what *is*, in one line at the top
 * of the results where the shopper is looking when the count surprises them. On a phone,
 * where the panel is behind a drawer, it is the only visible record of the filters at
 * all — which is why it is not collapsed into the drawer alongside them.
 *
 * Labels come from the facets, so a chip reads "Dark roast" rather than `roast=dark`.
 * A filter whose facet is gone — an attribute archived since the URL was bookmarked —
 * still gets a chip, spelled from the raw value, so it can be removed.
 */
export function ActiveFilters({ facets, currency }: { facets: Facet[] | null; currency: string }) {
  const { params, pending, refine } = useListing();
  const byKey = new Map((facets ?? []).map((f) => [f.key, f]));

  const chips: { id: string; label: string; remove: () => void }[] = [];

  if (params.inStock) {
    chips.push({
      id: 'in_stock',
      label: 'In stock',
      remove: () => refine(setInStock(params, false)),
    });
  }

  const price = parseRange(params.price);
  if (price) {
    chips.push({
      id: 'price',
      label: describeRange(price, (n) => formatMoney({ amount: n, currency }), 'Price'),
      remove: () => refine(setPrice(params, null)),
    });
  }

  for (const [key, values] of Object.entries(params.attributes)) {
    const facet = byKey.get(key);

    if (facet?.filterUi === 'range') {
      const range = parseRange(values[0] ?? null);
      chips.push({
        id: key,
        label: range
          ? describeRange(range, (n) => `${n}${facet.unit ? ` ${facet.unit}` : ''}`, facet.label)
          : facet.label,
        remove: () => refine(setFacetValues(params, key, [])),
      });
      continue;
    }

    for (const value of values) {
      const option = facet?.values.find((v) => v.value === value);
      chips.push({
        id: `${key}:${value}`,
        label: option ? `${facet?.label}: ${option.label}` : `${facet?.label ?? key}: ${value}`,
        remove: () => refine(toggleFacetValue(params, key, value)),
      });
    }
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ul className="contents">
        {chips.map((chip) => (
          <li key={chip.id}>
            <button
              type="button"
              disabled={pending}
              onClick={chip.remove}
              className={[
                'group inline-flex items-center gap-1.5 rounded-xs py-1 pr-2 pl-2.5',
                'border border-[var(--edge)] text-xs text-[var(--ink)]',
                'transition-colors hover:border-[var(--ink)] hover:bg-[var(--ink)]/8',
                'disabled:pointer-events-none disabled:opacity-45',
              ].join(' ')}
            >
              {chip.label}
              <svg viewBox="0 0 12 12" aria-hidden className="size-3 opacity-60">
                <path
                  d="m3.5 3.5 5 5m0-5-5 5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              <span className="sr-only">Remove filter</span>
            </button>
          </li>
        ))}
      </ul>

      {chips.length > 1 && (
        <Button
          variant="link"
          size="sm"
          disabled={pending}
          onClick={() => refine(clearFilters(params))}
        >
          Clear all
        </Button>
      )}
    </div>
  );
}

function describeRange(
  range: { min: number | null; max: number | null },
  show: (n: number) => string,
  label: string,
): string {
  if (range.min !== null && range.max !== null) {
    return range.min === range.max
      ? `${label}: ${show(range.min)}`
      : `${label}: ${show(range.min)}–${show(range.max)}`;
  }
  if (range.min !== null) return `${label}: ${show(range.min)} and up`;
  if (range.max !== null) return `${label}: up to ${show(range.max)}`;
  return label;
}

/**
 * Marks the results as stale while a refinement is in flight.
 *
 * The previous page of products stays exactly where it is, dimmed and inert, instead of
 * being replaced by a skeleton. Filtering is a series of small corrections, and a shop
 * that blanks itself on each one is unusable at a fast tick rate — the shopper loses
 * their place every time. `aria-busy` says the same thing to a screen reader that the
 * dimming says to everyone else.
 */
export function ResultsRegion({ children }: { children: React.ReactNode }) {
  const { pending } = useListing();

  return (
    <div
      aria-busy={pending}
      className={[
        'transition-opacity duration-200',
        pending ? 'pointer-events-none opacity-50' : 'opacity-100',
      ].join(' ')}
    >
      {children}
    </div>
  );
}
