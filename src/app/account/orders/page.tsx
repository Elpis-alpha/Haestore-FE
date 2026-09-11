import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Price } from '@/components/ui/price';
import { getOrders, requireSession } from '@/lib/auth/session';
import { STATUS_LABELS, statusTone } from '@/lib/checkout/types';

export const metadata: Metadata = { title: 'Orders' };

/**
 * What you have bought.
 *
 * Rendered on the server, complete. An order list does not change while somebody is
 * looking at it, so there is nothing to gain from a skeleton and something to lose — a
 * page that arrives whole is the difference between a receipt and an app.
 *
 * **No `loading.tsx`**, here or in the detail route beneath it: both can `redirect()`
 * and the detail route can `notFound()`, and a Suspense boundary at the route would let
 * Next commit a 200 before either decision was made. Phase 4 and Phase 5 both learned
 * this; the account area is the third place it applies.
 */
export default async function OrdersPage() {
  await requireSession('/account/orders');
  const { orders } = await getOrders();

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-[var(--ink-muted)]">You have not ordered anything yet.</p>
        <Link href="/shop" className="text-sm underline underline-offset-4">
          Go to the shop
        </Link>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
      {orders.map((order) => (
        <li key={order.id}>
          <Link
            href={`/account/orders/${order.orderNumber}`}
            className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 py-4 transition-colors hover:bg-[var(--ink)]/5"
          >
            <span className="flex min-w-0 flex-col gap-1">
              <span className="font-display text-lg [--opsz:20] [--wght:600]">
                {order.orderNumber}
              </span>
              <span className="text-sm text-[var(--ink-muted)]">
                {new Date(order.placedAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
                {' · '}
                {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
              </span>
            </span>

            <span className="flex items-center gap-4">
              <Badge tone={statusTone(order.status)}>{STATUS_LABELS[order.status]}</Badge>
              <Price value={order.totals.grandTotal} />
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
