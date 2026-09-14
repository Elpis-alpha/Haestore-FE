import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { SlabRule } from '@/components/motifs/rule';
import { OrderSummary } from '@/components/checkout/order-summary';
import { getOrder, requireSession } from '@/lib/auth/session';
import { STATUS_LABELS, statusTone } from '@/lib/checkout/types';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}): Promise<Metadata> {
  const { orderNumber } = await params;
  return { title: orderNumber };
}

/** One entry per product: two grinds of the same coffee are one thing to review. */
function uniqueProducts<T extends { productId: string }>(lines: T[]): T[] {
  const seen = new Set<string>();
  return lines.filter((line) => !seen.has(line.productId) && seen.add(line.productId));
}

/**
 * One order, as it was sold.
 *
 * Every figure here comes from the order's own snapshot rather than from the catalogue:
 * the title, the axis values and the unit price are what they were at purchase, so a
 * product that has since been re-priced, renamed or archived does not rewrite somebody's
 * receipt. The 2022 app populated order lines from the live product on every read, which
 * made a deleted product render as blank rows in a customer's history.
 */
export default async function OrderPage({ params }: { params: Promise<{ orderNumber: string }> }) {
  const { orderNumber } = await params;
  await requireSession(`/account/orders/${orderNumber}`);

  const order = await getOrder(orderNumber);
  // The API scopes the lookup to the caller, so "not yours" and "does not exist" are
  // already the same answer by the time it gets here.
  if (!order) notFound();

  return (
    <article className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <Link href="/account/orders" className="text-sm underline underline-offset-4">
          ← All orders
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-display text-2xl [--opsz:32] [--wght:600]">{order.orderNumber}</h2>
          <Badge tone={statusTone(order.status)}>{STATUS_LABELS[order.status]}</Badge>
        </div>
        <p className="text-sm text-[var(--ink-muted)]">
          Placed{' '}
          {new Date(order.placedAt).toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
          {order.paidAt && ' · paid'}
          {' · '}
          {order.payment.provider === 'paypal' ? 'PayPal' : 'Card'}
        </p>
      </header>

      <SlabRule />

      <div className="grid gap-8 sm:grid-cols-[1fr_16rem]">
        <OrderSummary
          lines={order.lines}
          subtotal={order.totals.subtotal}
          grandTotal={order.totals.grandTotal}
          heading="What you bought"
        />

        <div className="flex flex-col gap-4 text-sm">
          <div>
            <p className="text-[var(--ink-faint)]">Shipping to</p>
            <address className="not-italic leading-relaxed">
              {order.shippingAddress.name}
              <br />
              {order.shippingAddress.line1}
              <br />
              {order.shippingAddress.line2 && (
                <>
                  {order.shippingAddress.line2}
                  <br />
                </>
              )}
              {order.shippingAddress.city}
              {order.shippingAddress.region ? `, ${order.shippingAddress.region}` : ''}{' '}
              {order.shippingAddress.postalCode}
              <br />
              {order.shippingAddress.country}
            </address>
          </div>
          <div>
            <p className="text-[var(--ink-faint)]">Receipt sent to</p>
            <p className="break-words">{order.email}</p>
          </div>
          <div>
            <p className="text-[var(--ink-faint)]">Something wrong?</p>
            <Link
              href={`/account/support/new?order=${encodeURIComponent(order.orderNumber)}`}
              className="underline underline-offset-4"
            >
              Ask us about this order
            </Link>
          </div>
        </div>
      </div>

      {/* Offered only once the parcel has arrived, which is when a review is possible at all —
          the API refuses one for an order that has not reached `delivered`. */}
      {order.status === 'delivered' && (
        <section aria-labelledby="review-heading" className="flex flex-col gap-3">
          <SlabRule />
          <h2 id="review-heading" className="font-display text-lg [--opsz:20] [--wght:600]">
            Now that it has arrived
          </h2>
          <ul className="flex flex-col gap-2 text-sm">
            {uniqueProducts(order.lines).map((line) => (
              <li
                key={line.productId}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"
              >
                <span>{line.title}</span>
                <Link
                  href={`/account/reviews?write=${line.productId}`}
                  className="underline underline-offset-4"
                >
                  Review it
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
