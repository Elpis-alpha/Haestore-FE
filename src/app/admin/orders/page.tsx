import type { Metadata } from 'next';
import Link from 'next/link';
import { adminRead, queryOf } from '@/lib/admin/server';
import type { AdminOrderSummary, OrderStatus, Paged } from '@/lib/admin/types';
import { ADMIN_STATUS_LABELS, adminStatusTone, formatDateTime } from '@/lib/admin/format';
import { formatMoney } from '@/lib/money';
import { Badge } from '@/components/ui/badge';
import {
  Empty,
  FilterLinks,
  Ledger,
  LedgerHead,
  PageHeader,
  Pager,
  cellClass,
  rowClass,
} from '@/components/admin/ledger';
import { SearchForm } from '@/components/admin/search-form';

export const metadata: Metadata = { title: 'Orders' };

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const FILTERS: { status?: OrderStatus; label: string }[] = [
  { label: 'All' },
  { status: 'paid', label: 'To pack' },
  { status: 'processing', label: 'Packing' },
  { status: 'pending_payment', label: 'Awaiting payment' },
  { status: 'shipped', label: 'Shipped' },
  { status: 'delivered', label: 'Delivered' },
  { status: 'refunded', label: 'Refunded' },
  { status: 'canceled', label: 'Canceled' },
];

export default async function AdminOrdersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const single = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const status = single('status');
  const q = single('q');

  const { data: orders, page } = await adminRead<Paged<AdminOrderSummary>>(
    `/api/admin/orders${queryOf(params, ['status', 'q', 'page'])}`,
    '/admin/orders',
  );

  return (
    <>
      <PageHeader
        title="Orders"
        description="Newest first. Search by order number — however it was read out to you — or by the start of an email address."
      />

      <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <FilterLinks
          items={FILTERS.map((filter) => ({
            label: filter.label,
            href: `/admin/orders${filter.status ? `?status=${filter.status}` : ''}`,
            active: (status ?? undefined) === filter.status,
          }))}
        />
        <SearchForm
          action="/admin/orders"
          label="Find an order"
          placeholder="HAE-… or jane@"
          defaultValue={q}
          keep={{ status }}
        />
      </div>

      {orders.length === 0 ? (
        <Empty>
          {q
            ? `No order matches “${q}”.`
            : status
              ? `No orders are ${ADMIN_STATUS_LABELS[status as OrderStatus]?.toLowerCase() ?? 'in that state'}.`
              : 'No orders yet. They appear here the moment someone checks out.'}
        </Empty>
      ) : (
        <Ledger>
          <LedgerHead
            columns={[
              { label: 'Order' },
              { label: 'Customer' },
              { label: 'Placed' },
              { label: 'Status' },
              { label: 'Items', align: 'right' },
              { label: 'Total', align: 'right' },
            ]}
          />
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className={rowClass}>
                <td className={cellClass}>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="font-display font-semibold [--opsz:16] hover:underline"
                  >
                    {order.orderNumber}
                  </Link>
                </td>
                <td className={cellClass}>
                  <span className="break-all">{order.email}</span>
                  {order.guest && (
                    <span className="block text-xs text-[var(--ink-faint)]">Guest checkout</span>
                  )}
                </td>
                <td className={`${cellClass} whitespace-nowrap text-[var(--ink-muted)]`}>
                  {formatDateTime(order.placedAt)}
                </td>
                <td className={cellClass}>
                  <span className="flex flex-wrap gap-1.5">
                    <Badge tone={adminStatusTone(order.status)}>
                      {ADMIN_STATUS_LABELS[order.status]}
                    </Badge>
                    {order.stuckPayment && <Badge tone="bad">May be stranded</Badge>}
                  </span>
                </td>
                <td className={`${cellClass} tabular text-right`}>{order.itemCount}</td>
                <td className={`${cellClass} tabular text-right font-medium`}>
                  {formatMoney(order.grandTotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </Ledger>
      )}

      <Pager
        page={page.page}
        totalPages={page.totalPages}
        total={page.total}
        basePath="/admin/orders"
        params={{ status, q }}
      />
    </>
  );
}
