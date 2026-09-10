import { cn } from '@/lib/cn';
import { formatMoney, formatMoneyRange, type Money } from '@/lib/money';

/**
 * The most-read number in a shop, so it gets the display face and tabular figures.
 *
 * Without `font-variant-numeric: tabular-nums` a column of prices jitters as digits
 * change width, which is the difference between a price list and a pile of numbers.
 */
export function Price({
  value,
  to,
  compareAt,
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  value: Money;
  /** Upper bound, for a product whose variants span a range. */
  to?: Money;
  /** The former price. Rendered struck through, announced as such. */
  compareAt?: Money;
}) {
  const main = to ? formatMoneyRange(value, to) : formatMoney(value);
  return (
    <span className={cn('inline-flex items-baseline gap-2', className)} {...props}>
      <span className="tabular font-display [--opsz:20] [--wght:600]">{main}</span>
      {compareAt && (
        <s className="tabular text-sm text-[var(--ink-faint)] decoration-[var(--bad)]">
          <span className="sr-only">Was </span>
          {formatMoney(compareAt)}
        </s>
      )}
    </span>
  );
}
