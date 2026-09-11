'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Price } from '@/components/ui/price';
import { QuantityStepper } from '@/components/ui/quantity';
import { Leaf } from '@/components/motifs/leaf';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/money';
import { describeChange, type CartLine } from '@/lib/cart/types';
import { useCart } from './cart-provider';

/**
 * One row of the bag, used in the drawer and on the cart page.
 *
 * The notices under the row are the whole reason the backend returns `changes` as facts
 * rather than reconciling silently. A cart that quietly lowered a quantity because stock
 * moved is a cart the shopper cannot trust; one that says "only 2 left, so we lowered
 * the quantity" is one they can.
 */
export function CartLineRow({
  line,
  saved = false,
  compact = false,
}: {
  line: CartLine;
  /** A set-aside row: no stepper, and the action puts it back. */
  saved?: boolean;
  compact?: boolean;
}) {
  const { setQuantity, remove, move } = useCart();
  const unsellable = line.maxQuantity === 0;

  return (
    <li className="flex gap-3 py-4">
      <Link
        href={`/product/${line.slug}`}
        className={cn(
          'relative shrink-0 overflow-hidden rounded-t-[999px] rounded-b-sm bg-[var(--groove)]',
          compact ? 'size-20' : 'size-24',
          unsellable && 'opacity-50',
        )}
      >
        {line.imagePublicId ? (
          <Image
            src={line.imagePublicId}
            alt={line.title}
            fill
            sizes="6rem"
            className="object-cover"
          />
        ) : (
          <span className="grid h-full place-items-center text-[var(--ink-faint)]">
            <Leaf aria-hidden className="size-6" />
          </span>
        )}
      </Link>

      <div className="flex min-w-0 grow flex-col gap-1.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href={`/product/${line.slug}`}
              className="block truncate text-sm font-medium hover:underline"
            >
              {line.title}
            </Link>
            {line.axisValues.length > 0 && (
              <p className="truncate text-xs text-[var(--ink-muted)]">
                {line.axisValues.map((axis) => prettify(axis.value)).join(' · ')}
              </p>
            )}
          </div>

          <Price value={line.unitPrice} className="shrink-0 text-sm" />
        </div>

        {/*
          Stock said the way the product page says it, so the same item does not describe
          itself two different ways in two places.
        */}
        {!saved &&
          !unsellable &&
          line.available !== null &&
          line.available <= line.lowStockThreshold && (
            <Badge tone="note" className="self-start">
              Only {line.available} left
            </Badge>
          )}

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-0.5">
          {saved || unsellable ? (
            <span className="text-xs text-[var(--ink-faint)]">
              {unsellable ? 'Not available' : `Quantity ${line.quantity}`}
            </span>
          ) : (
            <QuantityStepper
              value={line.quantity}
              max={Math.max(1, line.maxQuantity)}
              onValueChange={(next) => void setQuantity(line.lineKey, next)}
              label={`Quantity of ${line.title}`}
            />
          )}

          <span className="ml-auto text-sm text-[var(--ink-muted)] tabular">
            {formatMoney(line.lineTotal)}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {!unsellable && (
            <Button
              variant="link"
              size="sm"
              className="text-xs"
              onClick={() => void move(line.lineKey, saved ? 'cart' : 'saved')}
            >
              {saved ? 'Move to bag' : 'Save for later'}
            </Button>
          )}
          <Button
            variant="link"
            size="sm"
            className="text-xs"
            onClick={() => void remove(line.lineKey)}
          >
            Remove
          </Button>
        </div>

        {line.changes.length > 0 && (
          <ul className="flex flex-col gap-1 pt-1">
            {line.changes.map((change, index) => (
              <li
                key={`${change.kind}-${index}`}
                className={cn(
                  'text-xs',
                  change.kind === 'dropped' ? 'text-[var(--bad)]' : 'text-[var(--note)]',
                )}
              >
                {describeChange(change, formatMoney)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

/**
 * A last resort for an axis value with no definition to name it — the same gap the
 * product page's picker has, and closed in the same place when Phase 8 gives axis
 * values labels of their own.
 */
function prettify(value: string): string {
  const spaced = value.replace(/[-_]+/g, ' ').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
