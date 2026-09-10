'use client';

import { useId, useState } from 'react';
import type { Facet, FacetValue } from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/money';
import {
  parseRange,
  setFacetRange,
  setFacetValues,
  setInStock,
  setPrice,
  toggleFacetValue,
  type Range,
} from '@/lib/listing/params';
import { CheckRow, Toggle } from '@/components/ui/choice';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
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
 * The controls the filter panel is assembled from.
 *
 * Nothing in this file names an attribute. A `Facet` says what kind of control it is
 * (`filterUi`), what its values are, and what each value currently matches — all of it
 * derived on the server from a definition an admin wrote. Adding "Roast" to the shop is
 * a row in MongoDB, and this renders it.
 *
 * The rule that keeps the disjunctive facet counts worth computing: **a value with a
 * count of zero is disabled, never hidden.** The backend runs an extra query per selected
 * group specifically so a shopper can see that "Light" exists and currently matches
 * nothing alongside their ticked "Dark". Hiding it throws that away and makes the panel
 * appear to lose options as you use it.
 */

export function FacetControl({ facet }: { facet: Facet }) {
  switch (facet.filterUi) {
    case 'swatch':
      return <SwatchFacet facet={facet} />;
    case 'select':
      return <SelectFacet facet={facet} />;
    case 'range':
      return <RangeFacet facet={facet} />;
    case 'toggle':
      return <ToggleFacet facet={facet} />;
    case 'checkbox':
    default:
      return <CheckboxFacet facet={facet} />;
  }
}

function CheckboxFacet({ facet }: { facet: Facet }) {
  const { params, pending, refine } = useListing();

  return (
    <ul className="-ml-1 flex flex-col">
      {facet.values.map((value) => (
        <li key={value.value}>
          <CheckRow
            label={value.label}
            count={value.count}
            checked={value.selected}
            disabled={pending || (value.count === 0 && !value.selected)}
            onCheckedChange={() => refine(toggleFacetValue(params, facet.key, value.value))}
          />
        </li>
      ))}
    </ul>
  );
}

/**
 * A colour, shown as a colour.
 *
 * The swatch is the control, not an ornament beside a checkbox, so it carries the
 * checked state as a ring in `--ink` — which inverts with the surface like everything
 * else. The name is still in the accessible label, because a swatch alone is unusable
 * to anyone who cannot distinguish the two greens an admin defined.
 */
function SwatchFacet({ facet }: { facet: Facet }) {
  const { params, pending, refine } = useListing();

  return (
    <ul className="flex flex-wrap gap-2 pt-0.5">
      {facet.values.map((value) => {
        const unavailable = value.count === 0 && !value.selected;
        return (
          <li key={value.value}>
            <button
              type="button"
              aria-pressed={value.selected}
              disabled={pending || unavailable}
              onClick={() => refine(toggleFacetValue(params, facet.key, value.value))}
              title={`${value.label} (${value.count})`}
              className={cn(
                'relative block size-8 rounded-full border border-[var(--edge)]',
                'transition-[box-shadow,transform] duration-150 ease-[var(--ease-out-soft)]',
                'hover:scale-105',
                'aria-pressed:ring-2 aria-pressed:ring-[var(--ink)] aria-pressed:ring-offset-2',
                'aria-pressed:ring-offset-[var(--surface)]',
                'disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:scale-100',
              )}
              style={{ backgroundColor: value.swatchHex ?? 'var(--field)' }}
            >
              <span className="sr-only">
                {value.label} — {value.count} {value.count === 1 ? 'item' : 'items'}
              </span>
              {/* A struck-through swatch says "none of these right now" without
                  removing the colour from the shopper's mental map of the range. */}
              {unavailable && (
                <span
                  aria-hidden
                  className="absolute inset-0 grid place-items-center text-[var(--ink)]"
                >
                  <span className="h-px w-6 rotate-45 bg-current" />
                </span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** One value at a time, for an attribute whose values are mutually exclusive. */
function SelectFacet({ facet }: { facet: Facet }) {
  const { params, pending, refine } = useListing();
  const selected = facet.values.find((v) => v.selected);
  const ANY = '__any__';

  return (
    <SelectRoot
      value={selected?.value ?? ANY}
      disabled={pending}
      onValueChange={(value) =>
        refine(setFacetValues(params, facet.key, value === ANY ? [] : [value]))
      }
    >
      <SelectTrigger aria-label={facet.label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ANY}>Any</SelectItem>
        {facet.values.map((value) => (
          <SelectItem
            key={value.value}
            value={value.value}
            disabled={value.count === 0 && !value.selected}
          >
            {value.label} ({value.count})
          </SelectItem>
        ))}
      </SelectContent>
    </SelectRoot>
  );
}

/** A boolean attribute: on, or not mentioned. There is no "false" to filter for. */
function ToggleFacet({ facet }: { facet: Facet }) {
  const { params, pending, refine } = useListing();
  const on = facet.values.find((v) => v.value === 'true');
  const id = useId();

  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <label htmlFor={id} className="cursor-pointer text-sm">
        {facet.label}
        {on && <span className="tabular ml-2 text-xs text-[var(--ink-faint)]">{on.count}</span>}
      </label>
      <Toggle
        id={id}
        checked={Boolean(on?.selected)}
        disabled={pending}
        onCheckedChange={(checked) =>
          refine(setFacetValues(params, facet.key, checked ? ['true'] : []))
        }
      />
    </div>
  );
}

function RangeFacet({ facet }: { facet: Facet }) {
  const { params, pending, refine } = useListing();
  const current = parseRange(params.attributes[facet.key]?.[0] ?? null);

  return (
    <RangeControl
      key={params.attributes[facet.key]?.[0] ?? ''}
      label={facet.label}
      unit={facet.unit}
      bounds={facet.range}
      value={current}
      disabled={pending}
      onCommit={(range) => refine(setFacetRange(params, facet.key, range))}
    />
  );
}

/**
 * Two numbers and a bar showing what they select out of what exists.
 *
 * Not a dual-thumb slider. A slider is imprecise at exactly the moment a shopper is
 * being precise — "under £40" is a number they have in mind, not a pixel they are
 * hunting for — and a two-thumb one is a genuinely hard control to operate by keyboard.
 * The bar gives back the one thing the slider was for: where this range sits inside the
 * range that is available.
 *
 * The inputs are draft state until committed, because refining on every keystroke would
 * fire a request at "1", "15", "150" on the way to "1500". That draft is seeded once and
 * then owned by the shopper: callers pass a `key` derived from the committed range, so a
 * change that did not come from these inputs — Back, a chip removed, Clear all — remounts
 * the control with the new value instead of an effect racing the person typing.
 */
export function RangeControl({
  label,
  unit,
  bounds,
  value,
  disabled,
  format,
  onCommit,
}: {
  label: string;
  unit?: string;
  bounds: { min: number; max: number } | null;
  value: Range | null;
  disabled?: boolean;
  /** Renders a bound for display — money is not shown in minor units. */
  format?: (n: number) => string;
  onCommit: (range: Range | null) => void;
}) {
  const [min, setMin] = useState(value?.min?.toString() ?? '');
  const [max, setMax] = useState(value?.max?.toString() ?? '');

  const commit = () => {
    const parsedMin = min.trim() === '' ? null : Number(min);
    const parsedMax = max.trim() === '' ? null : Number(max);
    if (parsedMin !== null && !Number.isFinite(parsedMin)) return;
    if (parsedMax !== null && !Number.isFinite(parsedMax)) return;
    if (parsedMin === null && parsedMax === null) {
      onCommit(null);
      return;
    }
    onCommit({ min: parsedMin, max: parsedMax });
  };

  const dirty =
    (value?.min?.toString() ?? '') !== min.trim() || (value?.max?.toString() ?? '') !== max.trim();

  return (
    <div className="flex flex-col gap-3 pt-1">
      {bounds && <SpanBar bounds={bounds} value={value} format={format} />}

      {/* Field, not a bare label plus input: `Input` reads its id and aria wiring from
          Field's context and throws without it — the plumbing is assembled rather than
          remembered, which is the point of the composition. */}
      <div className="flex items-end gap-2">
        <Field className="flex-1">
          <FieldLabel className="text-xs font-normal text-[var(--ink-faint)]">
            Min {label.toLowerCase()}
            {unit ? ` (${unit})` : ''}
          </FieldLabel>
          <Input
            inputMode="decimal"
            value={min}
            disabled={disabled}
            placeholder={bounds ? String(bounds.min) : 'Any'}
            onChange={(event) => setMin(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && commit()}
          />
        </Field>
        <span aria-hidden className="pb-3 text-[var(--ink-faint)]">
          –
        </span>
        <Field className="flex-1">
          <FieldLabel className="text-xs font-normal text-[var(--ink-faint)]">
            Max {label.toLowerCase()}
            {unit ? ` (${unit})` : ''}
          </FieldLabel>
          <Input
            inputMode="decimal"
            value={max}
            disabled={disabled}
            placeholder={bounds ? String(bounds.max) : 'Any'}
            onChange={(event) => setMax(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && commit()}
          />
        </Field>
      </div>

      {/* Only offered once there is something to apply, so the panel does not carry a
          permanently inert button under every range. */}
      {dirty && (
        <Button size="sm" variant="outline" disabled={disabled} onClick={commit}>
          Apply {label.toLowerCase()}
        </Button>
      )}
    </div>
  );
}

/** Where the chosen range sits inside the range that exists. */
function SpanBar({
  bounds,
  value,
  format,
}: {
  bounds: { min: number; max: number };
  value: Range | null;
  format?: (n: number) => string;
}) {
  const span = Math.max(1, bounds.max - bounds.min);
  const from = Math.max(bounds.min, value?.min ?? bounds.min);
  const to = Math.min(bounds.max, value?.max ?? bounds.max);
  const left = ((from - bounds.min) / span) * 100;
  const width = Math.max(1, ((to - from) / span) * 100);
  const show = format ?? String;

  return (
    <div className="flex flex-col gap-1.5">
      <div aria-hidden className="relative h-1 rounded-full bg-[var(--groove)]">
        <span
          className="absolute inset-y-0 rounded-full bg-[var(--ink)]"
          style={{ left: `${left}%`, width: `${width}%` }}
        />
      </div>
      <div aria-hidden className="tabular flex justify-between text-2xs text-[var(--ink-faint)]">
        <span>{show(bounds.min)}</span>
        <span>{show(bounds.max)}</span>
      </div>
    </div>
  );
}

/**
 * Price and availability are the storefront's own filters, not attributes.
 *
 * They are reserved parameter names the backend owns, so no admin can define an
 * attribute called `price` that would collide with them — the collision is prevented at
 * definition time rather than resolved here.
 */
export function PriceFacet({ currency }: { currency: string }) {
  const { params, pending, refine } = useListing();
  const current = parseRange(params.price);

  return (
    <RangeControl
      key={params.price ?? ''}
      label="Price"
      bounds={null}
      value={
        // The URL carries minor units, as the API does; the control shows major ones,
        // because nobody filters for 1500 pence.
        current ? { min: toMajor(current.min), max: toMajor(current.max) } : null
      }
      disabled={pending}
      format={(n) => formatMoney({ amount: n * 100, currency })}
      onCommit={(range) =>
        refine(
          setPrice(params, range ? { min: toMinor(range.min), max: toMinor(range.max) } : null),
        )
      }
    />
  );
}

function toMajor(value: number | null): number | null {
  return value === null ? null : Math.round(value) / 100;
}

function toMinor(value: number | null): number | null {
  return value === null ? null : Math.round(value * 100);
}

export function InStockFacet() {
  const { params, pending, refine } = useListing();
  const id = useId();

  return (
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="cursor-pointer text-sm">
        In stock only
      </label>
      <Toggle
        id={id}
        checked={params.inStock}
        disabled={pending}
        onCheckedChange={(checked) => refine(setInStock(params, checked))}
      />
    </div>
  );
}

export type { FacetValue };
