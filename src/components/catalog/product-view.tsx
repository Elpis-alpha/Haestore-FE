'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import type { Product, Variant } from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/badge';
import { Price } from '@/components/ui/price';
import { Rating } from '@/components/ui/rating';
import { ArchFrame } from '@/components/motifs/arch';
import { Leaf } from '@/components/motifs/leaf';
import { SharedElement, productTransitionName } from '@/components/motion/shared-element';

/**
 * The product, and the one interaction on the read path: choosing a variant.
 *
 * Gallery, price, stock and axis pickers are one component because they are one piece of
 * state. Splitting them would mean lifting the selected variant into a context so that
 * picking "1 kg" could change the price, the stock line and the photograph — three
 * subscribers to a value with exactly one owner.
 *
 * There is no add-to-bag control here. Phase 4 is the read path, and the bag arrives in
 * Phase 6 with a cart behind it. A disabled button in its place would be the same
 * mistake as the 2022 app's checkout, which rendered a Pay button before it had a
 * payment intent.
 */

export type AxisLabels = Record<
  string,
  { label: string; values: Record<string, { label: string; swatchHex?: string }> }
>;

export function ProductView({
  product,
  axisLabels,
  specification,
}: {
  product: Product;
  /** Display names for axis keys and values, from the category's own attribute definitions. */
  axisLabels: AxisLabels;
  /**
   * The specification table, rendered on the server and passed in.
   *
   * It sits in this column rather than below the photograph because that is where a
   * shopper looks for "what is it": beside the thing, under the price. It is also what
   * keeps the column from being a title and a price next to a 600px image — the shape
   * this page had when the table lived in a section of its own.
   */
  specification?: React.ReactNode;
}) {
  const sellable = useMemo(
    () => product.variants.filter((v) => v.status === 'active'),
    [product.variants],
  );

  const [selection, setSelection] = useState<Record<string, string>>(() =>
    axisValuesOf(
      sellable.find((v) => v._id === product.defaultVariantId) ??
        sellable.find((v) => v.stock.available > 0) ??
        sellable[0],
    ),
  );

  const variant = useMemo(
    () => sellable.find((v) => matches(v, selection)) ?? null,
    [sellable, selection],
  );

  const [imageIndex, setImageIndex] = useState(0);

  /**
   * The images for what is currently selected.
   *
   * A variant may carry its own photographs — the celadon glaze rather than the tenmoku.
   * When it does not, the product's own images stand in, so an axis with no photography
   * of its own does not empty the gallery.
   */
  const images = useMemo(() => {
    const own = variant?.imagePublicIds ?? [];
    if (own.length === 0) return product.images;
    const byId = new Map(product.images.map((i) => [i.publicId, i]));
    return own.map(
      (publicId) => byId.get(publicId) ?? { publicId, alt: product.title, position: 0 },
    );
  }, [variant, product.images, product.title]);

  const active = images[Math.min(imageIndex, images.length - 1)];
  const stock = variant?.stock;

  // The photograph is bounded, not given a fraction of the page. At `1fr` of a max-w-7xl
  // container a 4:5 arch renders close to 1000px tall beside a details column holding a
  // title and a price — the taller the screen, the emptier the page looked.
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] lg:gap-14">
      <div className="flex flex-col gap-4">
        <SharedElement name={productTransitionName(product.slug)}>
          <ArchFrame className="relative aspect-[4/5] bg-[var(--groove)]">
            {active ? (
              <Image
                key={active.publicId}
                src={active.publicId}
                alt={active.alt}
                fill
                priority
                sizes="(min-width: 1024px) 42rem, 100vw"
                className="object-cover"
                {...(active.blurDataUrl
                  ? { placeholder: 'blur' as const, blurDataURL: active.blurDataUrl }
                  : {})}
              />
            ) : (
              <span className="grid h-full place-items-center text-[var(--ink-faint)]">
                <Leaf aria-hidden className="size-12" />
              </span>
            )}
          </ArchFrame>
        </SharedElement>

        {images.length > 1 && (
          <ul className="flex flex-wrap gap-2.5">
            {images.map((image, index) => (
              <li key={image.publicId}>
                <button
                  type="button"
                  aria-label={`View image ${index + 1} of ${images.length}`}
                  aria-pressed={index === imageIndex}
                  onClick={() => setImageIndex(index)}
                  className={cn(
                    'relative block size-16 overflow-hidden rounded-t-[999px] rounded-b-sm',
                    'border border-[var(--edge)] transition-colors',
                    'aria-pressed:border-[var(--ink)] hover:border-[var(--ink-muted)]',
                  )}
                >
                  <Image src={image.publicId} alt="" fill sizes="4rem" className="object-cover" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-3xl leading-tight text-balance [--opsz:48] [--wght:600]">
            {product.title}
          </h1>
          {product.subtitle && (
            <p className="text-base text-[var(--ink-muted)]">{product.subtitle}</p>
          )}
          {product.ratingCount > 0 && (
            <Rating value={product.ratingAverage} count={product.ratingCount} className="mt-1" />
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {variant ? (
            <Price
              value={variant.price}
              {...(variant.compareAtPrice ? { compareAt: variant.compareAtPrice } : {})}
              className="text-xl"
            />
          ) : product.priceRange ? (
            <Price
              value={{ amount: product.priceRange.min, currency: product.priceRange.currency }}
              to={{ amount: product.priceRange.max, currency: product.priceRange.currency }}
              className="text-xl"
            />
          ) : null}

          <StockLine stock={stock} available={Boolean(variant)} />
        </div>

        {product.variantAxes.length > 0 && (
          <div className="flex flex-col gap-5">
            {product.variantAxes.map((axis) => (
              <AxisPicker
                key={axis}
                axis={axis}
                labels={axisLabels[axis]}
                variants={sellable}
                selection={selection}
                onSelect={(value) => {
                  setSelection((current) => ({ ...current, [axis]: value }));
                  setImageIndex(0);
                }}
              />
            ))}
          </div>
        )}

        {variant && (
          <p className="text-xs text-[var(--ink-faint)]">
            <span className="sr-only">Stock keeping unit: </span>
            <span className="tabular">{variant.sku}</span>
          </p>
        )}

        {specification}
      </div>
    </div>
  );
}

/**
 * Stock, said in the words a shopper uses.
 *
 * `available` is on-hand minus reserved, so it already excludes what is sitting in
 * somebody else's basket. Below the admin's own low-stock threshold it is named exactly,
 * because "only 2 left" is information; above it, a count is just pressure.
 */
function StockLine({ stock, available }: { stock?: Variant['stock']; available: boolean }) {
  if (!available) {
    return <Badge tone="neutral">Not a combination we stock</Badge>;
  }
  if (!stock || stock.available <= 0) {
    return (
      <Badge tone={stock?.backorderable ? 'note' : 'bad'}>
        {stock?.backorderable ? 'On order' : 'Sold out'}
      </Badge>
    );
  }
  if (stock.available <= stock.lowStockThreshold) {
    return <Badge tone="note">Only {stock.available} left</Badge>;
  }
  return <Badge tone="good">In stock</Badge>;
}

/**
 * One axis of the variant grid.
 *
 * A value is disabled when no sellable variant has it *together with the other axes as
 * currently chosen* — so picking "1 kg" greys out the grinds that only come in 250 g,
 * rather than letting the shopper build a combination that does not exist and then
 * telling them so afterwards.
 */
function AxisPicker({
  axis,
  labels,
  variants,
  selection,
  onSelect,
}: {
  axis: string;
  labels?: AxisLabels[string];
  variants: Variant[];
  selection: Record<string, string>;
  onSelect: (value: string) => void;
}) {
  // Declaration order, taken from the variants themselves: an admin ordering the grid
  // light → medium → dark should see it that way here.
  const values: string[] = [];
  for (const variant of variants) {
    const value = variant.axisValues.find((a) => a.key === axis)?.value;
    if (value !== undefined && !values.includes(value)) values.push(value);
  }
  if (values.length === 0) return null;

  const others = { ...selection };
  delete others[axis];
  const swatches = values.every((v) => labels?.values[v]?.swatchHex);

  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="text-sm font-medium">{labels?.label ?? prettify(axis)}</legend>
      <div className="flex flex-wrap gap-2">
        {values.map((value) => {
          const reachable = variants.some((v) => matches(v, { ...others, [axis]: value }));
          const chosen = selection[axis] === value;
          const label = labels?.values[value]?.label ?? prettify(value);
          const hex = labels?.values[value]?.swatchHex;

          if (swatches && hex) {
            return (
              <button
                key={value}
                type="button"
                aria-pressed={chosen}
                disabled={!reachable}
                onClick={() => onSelect(value)}
                title={label}
                style={{ backgroundColor: hex }}
                className={cn(
                  'size-9 rounded-full border border-[var(--edge)] transition-[box-shadow,transform]',
                  'duration-150 ease-[var(--ease-out-soft)] hover:scale-105',
                  'aria-pressed:ring-2 aria-pressed:ring-[var(--ink)] aria-pressed:ring-offset-2',
                  'aria-pressed:ring-offset-[var(--surface)]',
                  'disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:scale-100',
                )}
              >
                <span className="sr-only">{label}</span>
              </button>
            );
          }

          return (
            <button
              key={value}
              type="button"
              aria-pressed={chosen}
              disabled={!reachable}
              onClick={() => onSelect(value)}
              className={cn(
                'rounded-sm border px-3 py-2 text-sm transition-colors',
                chosen
                  ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]'
                  : 'border-[var(--edge)] text-[var(--ink)] hover:border-[var(--ink)]',
                // Struck through rather than hidden, for the same reason a zero-count
                // facet value is: the shopper should be able to see that the shop makes
                // this and that their other choice is what rules it out.
                'disabled:cursor-not-allowed disabled:border-[var(--rule)] disabled:text-[var(--ink-faint)] disabled:line-through',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

function axisValuesOf(variant: Variant | undefined): Record<string, string> {
  if (!variant) return {};
  return Object.fromEntries(variant.axisValues.map((a) => [a.key, a.value]));
}

function matches(variant: Variant, selection: Record<string, string>): boolean {
  return Object.entries(selection).every(([key, value]) =>
    variant.axisValues.some((a) => a.key === key && a.value === value),
  );
}

/**
 * A last resort for an axis value with no definition to name it.
 *
 * Values are the admin's own slugs, and a definition normally supplies the label. This
 * only shows when the axis attribute is not filterable — so the category endpoint does
 * not return its options — which is the one gap left in Phase 4's read path.
 */
function prettify(value: string): string {
  const spaced = value.replace(/[-_]+/g, ' ').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
