import { Price } from '@/components/ui/price';
import { SlabRule } from '@/components/motifs/rule';
import type { Money } from '@/lib/money';

type Line = {
  lineKey: string;
  title: string;
  axisValues: { key: string; value: string }[];
  quantity: number;
  lineTotal: Money;
};

/**
 * What is being paid for, restated beside the payment step.
 *
 * Deliberately not interactive. A shopper who wants to change something goes back to the
 * bag; a quantity stepper here would be an invitation to edit an order whose stock is
 * already reserved and whose PaymentIntent is already created for a fixed amount.
 */
export function OrderSummary({
  lines,
  subtotal,
  grandTotal,
  heading = 'Your order',
}: {
  lines: Line[];
  subtotal: Money;
  grandTotal: Money;
  heading?: string;
}) {
  return (
    <section aria-labelledby="order-summary-heading" className="flex flex-col gap-4">
      <h2 id="order-summary-heading" className="font-display text-xl [--opsz:24] [--wght:600]">
        {heading}
      </h2>

      <ul className="flex flex-col gap-3">
        {lines.map((line) => (
          <li key={line.lineKey} className="flex items-baseline justify-between gap-4 text-sm">
            <span className="min-w-0">
              <span className="text-[var(--ink)]">{line.title}</span>
              {line.axisValues.length > 0 && (
                <span className="text-[var(--ink-faint)]">
                  {' — '}
                  {line.axisValues.map((a) => a.value).join(' · ')}
                </span>
              )}
              <span className="text-[var(--ink-muted)]"> × {line.quantity}</span>
            </span>
            <Price value={line.lineTotal} className="shrink-0" />
          </li>
        ))}
      </ul>

      <SlabRule />

      <dl className="flex flex-col gap-2 text-sm">
        <div className="flex items-baseline justify-between">
          <dt className="text-[var(--ink-muted)]">Subtotal</dt>
          <dd>
            <Price value={subtotal} />
          </dd>
        </div>
        {/*
          Stated rather than omitted. A total with no delivery line reads as a total that
          is about to grow, and the last screen before a payment is the worst place to
          leave that question open.
        */}
        <div className="flex items-baseline justify-between text-[var(--ink-faint)]">
          <dt>Delivery and tax</dt>
          <dd>None on this order</dd>
        </div>
        <div className="flex items-baseline justify-between pt-1">
          <dt className="font-display text-lg [--opsz:20] [--wght:600]">Total</dt>
          <dd>
            <Price value={grandTotal} className="text-lg" />
          </dd>
        </div>
      </dl>
    </section>
  );
}
