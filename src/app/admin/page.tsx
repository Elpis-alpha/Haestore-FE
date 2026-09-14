import type { Metadata } from 'next';
import Link from 'next/link';
import { adminRead } from '@/lib/admin/server';
import type { Dashboard } from '@/lib/admin/types';
import { formatDate, formatDateTime, plural } from '@/lib/admin/format';
import { formatMoney } from '@/lib/money';
import {
  Ledger,
  LedgerHead,
  PageHeader,
  Sheet,
  cellClass,
  rowClass,
} from '@/components/admin/ledger';

/**
 * Absolute, because a layout's `title.template` applies to the segments beneath it and not
 * to the page in its own segment — so this page alone would otherwise read "Today · Hæstore".
 */
export const metadata: Metadata = { title: { absolute: 'Today · Admin · Hæstore' } };

/**
 * The daybook.
 *
 * Written as sentences, not tiles. A shopkeeper opening the book in the morning wants "two
 * orders are paid and waiting to be packed", with the way to them in the same line — not a
 * large 2 with a small label they have to translate. Each line is a queue somebody can work
 * down, in the order they are worth doing: money and parcels first, the shelves next, how
 * the month is going last.
 *
 * A queue with nothing in it says so plainly, because "nothing is stuck" is information.
 */
export default async function AdminTodayPage() {
  const { data } = await adminRead<{ data: Dashboard }>('/api/admin/dashboard', '/admin');
  const { orders, catalogue, revenue, storefront, support, reviews } = data;

  return (
    <>
      <PageHeader title="Today" description="What is waiting on the shop, most urgent first." />

      <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Sheet title="Waiting on you">
          <ul className="flex flex-col divide-y divide-[var(--rule)] text-[0.9375rem] leading-relaxed">
            <DaybookLine
              done={orders.toFulfil === 0}
              href="/admin/orders?status=paid"
              action="Open the packing list"
            >
              {orders.toFulfil === 0
                ? 'No orders are waiting to be packed.'
                : `${plural(orders.toFulfil, 'order is', 'orders are')} paid for and not yet shipped.`}
            </DaybookLine>

            <DaybookLine
              done={support.waiting.count === 0}
              href="/admin/support"
              action="Open the inbox"
            >
              {support.waiting.count === 0
                ? 'Nobody is waiting on a reply.'
                : `${plural(support.waiting.count, 'person is', 'people are')} waiting on a reply.`}
              {support.waiting.oldest.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1 text-sm">
                  {support.waiting.oldest.map((ticket) => (
                    <li key={ticket.id}>
                      <Link
                        href={`/admin/support/${ticket.id}`}
                        className="underline decoration-[var(--rule)] underline-offset-4 hover:decoration-[var(--ink)]"
                      >
                        {ticket.subject}
                      </Link>{' '}
                      <span className="text-[var(--ink-muted)]">
                        from {ticket.email}, waiting since {formatDateTime(ticket.waitingSince)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </DaybookLine>

            <DaybookLine
              done={orders.stuckPayments.count === 0}
              href="/admin/orders?status=pending_payment"
              action="See unpaid orders"
            >
              {orders.stuckPayments.count === 0
                ? 'No payments look stranded.'
                : `${plural(orders.stuckPayments.count, 'payment was', 'payments were')} started over fifteen minutes ago and never confirmed. The provider may have been paid while its message to us was lost — ask it from the order.`}
              {orders.stuckPayments.oldest.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1 text-sm">
                  {orders.stuckPayments.oldest.map((order) => (
                    <li key={order.id}>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="underline decoration-[var(--rule)] underline-offset-4 hover:decoration-[var(--ink)]"
                      >
                        {order.orderNumber}
                      </Link>{' '}
                      <span className="text-[var(--ink-muted)]">
                        {formatMoney(order.grandTotal)} by {order.email}, placed{' '}
                        {formatDateTime(order.placedAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </DaybookLine>

            <DaybookLine
              done={catalogue.needsAttention.count === 0}
              href="/admin/catalog/products?needsAttention=true"
              action="Review them"
            >
              {catalogue.needsAttention.count === 0
                ? 'Every product has what its category asks for.'
                : `${plural(catalogue.needsAttention.count, 'product is', 'products are')} missing something its category now asks for. They are still on sale.`}
              {catalogue.needsAttention.recent.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1 text-sm">
                  {catalogue.needsAttention.recent.map((product) => (
                    <li key={product.id}>
                      <Link
                        href={`/admin/catalog/products/${product.id}`}
                        className="underline decoration-[var(--rule)] underline-offset-4 hover:decoration-[var(--ink)]"
                      >
                        {product.title}
                      </Link>{' '}
                      <span className="text-[var(--ink-muted)]">{product.issues[0]}</span>
                    </li>
                  ))}
                </ul>
              )}
            </DaybookLine>

            <DaybookLine done={reviews.unread.count === 0} href="/admin/reviews" action="Read them">
              {reviews.unread.count === 0
                ? 'Every review has been read.'
                : `${plural(reviews.unread.count, 'review is', 'reviews are')} on product pages and not yet read by anyone here.`}
              {reviews.unread.oldest.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1 text-sm">
                  {reviews.unread.oldest.map((review) => (
                    <li key={review.id}>
                      <span>{review.productTitle}</span>{' '}
                      <span className="text-[var(--ink-muted)]">
                        — {review.rating} of 5 from {review.authorName},{' '}
                        {formatDate(review.postedAt)}
                        {review.hidden && ' (hidden, and edited since)'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </DaybookLine>
          </ul>
        </Sheet>

        <div className="flex flex-col gap-6">
          <Sheet title="Taken this month">
            {revenue.byCurrency.length === 0 ? (
              <p className="text-sm text-[var(--ink-muted)]">
                Nothing has been paid for in the last {revenue.windowDays} days.
              </p>
            ) : (
              <ul className="flex flex-col gap-2">
                {revenue.byCurrency.map((row) => (
                  <li key={row.currency} className="flex items-baseline justify-between gap-4">
                    <span className="tabular font-display text-2xl [--opsz:32] [--wght:600]">
                      {formatMoney({ amount: row.amount, currency: row.currency })}
                    </span>
                    <span className="text-sm text-[var(--ink-muted)]">
                      {plural(row.orders, 'order')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-[var(--ink-faint)]">
              Paid in the last {revenue.windowDays} days, not counting refunded orders.
            </p>
          </Sheet>

          <Sheet title="Front page">
            <p className="text-sm text-[var(--ink-muted)]">
              {storefront.publishedVersion === null
                ? 'The built-in front page is showing. Nothing has been published yet.'
                : `Version ${storefront.publishedVersion} is live${storefront.publishedAt ? `, published ${formatDate(storefront.publishedAt)}` : ''}.`}
              {storefront.draftVersion !== null &&
                ` A draft of version ${storefront.draftVersion} is in progress.`}
            </p>
            <Link
              href="/admin/storefront"
              className="mt-3 inline-block text-sm underline decoration-[var(--rule)] underline-offset-4 hover:decoration-[var(--ink)]"
            >
              Open the composer
            </Link>
          </Sheet>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="mb-3 font-display text-xl [--opsz:24] [--wght:600]">Running low</h2>
        {catalogue.lowStock.length === 0 ? (
          <p className="text-sm text-[var(--ink-muted)]">
            No variant on sale is at or below its low-stock mark.
          </p>
        ) : (
          <Ledger>
            <LedgerHead
              columns={[
                { label: 'Product' },
                { label: 'SKU' },
                { label: 'Available', align: 'right' },
                { label: 'Low at', align: 'right' },
              ]}
            />
            <tbody>
              {catalogue.lowStock.map((row) => (
                <tr key={`${row.productId}-${row.sku}`} className={rowClass}>
                  <td className={cellClass}>
                    <Link
                      href={`/admin/catalog/products/${row.productId}`}
                      className="font-medium hover:underline"
                    >
                      {row.title}
                    </Link>
                  </td>
                  <td className={`${cellClass} text-[var(--ink-muted)]`}>{row.sku}</td>
                  <td
                    className={`${cellClass} tabular text-right ${row.available === 0 ? 'font-medium text-[var(--bad)]' : ''}`}
                  >
                    {row.available === 0 ? 'Sold out' : row.available}
                  </td>
                  <td className={`${cellClass} tabular text-right text-[var(--ink-muted)]`}>
                    {row.threshold}
                  </td>
                </tr>
              ))}
            </tbody>
          </Ledger>
        )}
      </section>
    </>
  );
}

/**
 * One line of the daybook. A line with work in it carries the way to the work; a line with
 * none is set in the muted ink and has no link, so the eye skips it.
 */
function DaybookLine({
  done,
  href,
  action,
  children,
}: {
  done: boolean;
  href: string;
  action: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className={done ? 'text-[var(--ink-muted)]' : 'text-[var(--ink)]'}>{children}</div>
      {!done && (
        <Link
          href={href}
          className="shrink-0 rounded-sm bg-[var(--ink)] px-3 py-1.5 text-sm font-medium text-[var(--surface)] transition-colors hover:bg-[var(--ink-muted)]"
        >
          {action}
        </Link>
      )}
    </li>
  );
}
