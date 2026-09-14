import type { Metadata } from 'next';
import Link from 'next/link';
import { adminRead } from '@/lib/admin/server';
import { getSession } from '@/lib/auth/session';
import type { AdminOrder } from '@/lib/admin/types';
import {
  ADMIN_STATUS_LABELS,
  adminStatusTone,
  describeActor,
  formatDateTime,
} from '@/lib/admin/format';
import { formatMoney } from '@/lib/money';
import { Badge } from '@/components/ui/badge';
import { Facts, PageHeader, Sheet } from '@/components/admin/ledger';
import { OrderActions } from '@/components/admin/order-actions';

type PageProps = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: 'Order' };

/**
 * One order, from behind the counter.
 *
 * The left column is the parcel — what was bought, where it goes, what has happened to it.
 * The right is the money and the decisions: the payment as the provider reported it, and
 * the actions the server says are possible now. Nothing here decides which actions to
 * show; `order.actions` comes from the status machine on the server.
 */
export default async function AdminOrderPage({ params }: PageProps) {
  const { id } = await params;
  const [{ data }, session] = await Promise.all([
    adminRead<{ data: { order: AdminOrder } }>(`/api/admin/orders/${id}`, `/admin/orders/${id}`),
    getSession(),
  ]);
  const { order } = data;
  const address = order.shippingAddress;
  const provider = order.payment.provider === 'stripe' ? 'Stripe' : 'PayPal';

  return (
    <>
      <PageHeader
        back={{ href: '/admin/orders', label: 'orders' }}
        title={order.orderNumber}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={adminStatusTone(order.status)}>{ADMIN_STATUS_LABELS[order.status]}</Badge>
            {order.stuckPayment && <Badge tone="bad">Payment may be stranded</Badge>}
            <span>Placed {formatDateTime(order.placedAt)}</span>
          </span>
        }
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex flex-col gap-6">
          <Sheet title="In the parcel">
            <ul className="flex flex-col divide-y divide-[var(--rule)]">
              {order.lines.map((line) => (
                <li
                  key={line.lineKey}
                  className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-2.5 first:pt-0"
                >
                  <span className="min-w-0">
                    <Link
                      href={`/admin/catalog/products/${line.productId}`}
                      className="font-medium hover:underline"
                    >
                      {line.title}
                    </Link>
                    <span className="block text-xs text-[var(--ink-muted)]">
                      {[line.sku, ...line.axisValues.map((a) => a.value)].join(', ')}
                    </span>
                  </span>
                  <span className="tabular text-sm whitespace-nowrap">
                    {line.quantity} × {formatMoney(line.unitPrice)}
                    <span className="ml-4 font-medium">{formatMoney(line.lineTotal)}</span>
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex items-baseline justify-between border-t border-[var(--edge)] pt-3">
              <span className="text-sm text-[var(--ink-muted)]">
                Total, with no delivery or tax charged
              </span>
              <span className="tabular font-display text-xl [--opsz:24] [--wght:600]">
                {formatMoney(order.totals.grandTotal)}
              </span>
            </div>
          </Sheet>

          <Sheet title="Where it goes">
            <address className="text-sm leading-relaxed not-italic">
              {address.name}
              <br />
              {address.line1}
              {address.line2 && (
                <>
                  <br />
                  {address.line2}
                </>
              )}
              <br />
              {[address.city, address.region, address.postalCode].filter(Boolean).join(', ')}
              <br />
              {address.country}
              {address.phone && (
                <>
                  <br />
                  {address.phone}
                </>
              )}
            </address>
            <p className="mt-3 text-sm text-[var(--ink-muted)]">
              {order.email}
              {order.userId ? (
                <>
                  {' — '}
                  <Link
                    href={`/admin/customers/${order.userId}`}
                    className="underline decoration-[var(--rule)] underline-offset-4 hover:text-[var(--ink)]"
                  >
                    see their account
                  </Link>
                </>
              ) : (
                ', checked out as a guest'
              )}
            </p>
          </Sheet>

          <Sheet title="What has happened">
            <ol className="relative flex flex-col gap-4 border-l border-[var(--rule)] pl-5">
              {order.history.map((entry, index) => (
                <li key={`${entry.at}-${index}`} className="relative">
                  <span
                    aria-hidden
                    className="absolute top-1.5 -left-[1.4rem] size-2 rounded-full bg-[var(--ink)]"
                  />
                  <p className="text-sm font-medium">{ADMIN_STATUS_LABELS[entry.status]}</p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {describeActor(entry.by, session?.account.id)}, {formatDateTime(entry.at)}
                  </p>
                  {entry.note && (
                    <p className="mt-1 text-sm text-[var(--ink-muted)]">{entry.note}</p>
                  )}
                </li>
              ))}
            </ol>
          </Sheet>
        </div>

        <aside className="flex flex-col gap-6">
          <Sheet title="Next">
            <OrderActions
              orderId={order.id}
              actions={order.actions}
              provider={provider}
              stockReserved={order.stockReserved}
            />
          </Sheet>

          <Sheet title="Payment">
            <Facts
              items={[
                { label: 'Provider', value: provider },
                { label: 'Paid', value: order.paidAt ? formatDateTime(order.paidAt) : 'Not yet' },
                {
                  label: 'Captured',
                  value: order.payment.amountCaptured
                    ? formatMoney(order.payment.amountCaptured)
                    : '—',
                },
                { label: 'Provider says', value: order.payment.providerStatus ?? '—' },
                {
                  label: 'Reference',
                  value: (
                    <span className="font-mono text-xs break-all">
                      {order.payment.intentId ?? 'No payment started'}
                    </span>
                  ),
                },
                {
                  label: 'Stock',
                  value: order.stockReserved ? 'Held for this order' : 'Not held',
                },
              ]}
            />
            {order.payment.lastError && (
              <p
                role="note"
                className="mt-3 rounded-sm border border-[var(--bad)]/40 p-3 text-xs text-[var(--bad)]"
              >
                The last payment check refused this order: {order.payment.lastError}
              </p>
            )}
          </Sheet>
        </aside>
      </div>
    </>
  );
}
