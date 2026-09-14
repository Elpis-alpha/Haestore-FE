import type { Metadata } from 'next';
import Link from 'next/link';
import { adminRead } from '@/lib/admin/server';
import type { CustomerDetail } from '@/lib/admin/types';
import {
  ADMIN_STATUS_LABELS,
  adminStatusTone,
  formatDate,
  formatDateTime,
  plural,
} from '@/lib/admin/format';
import { formatMoney } from '@/lib/money';
import { Badge } from '@/components/ui/badge';
import {
  Empty,
  Facts,
  Ledger,
  LedgerHead,
  PageHeader,
  Sheet,
  cellClass,
  rowClass,
} from '@/components/admin/ledger';
import { CustomerActions } from '@/components/admin/customer-actions';

type PageProps = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: 'Customer' };

export default async function AdminCustomerPage({ params }: PageProps) {
  const { id } = await params;
  const { data: customer } = await adminRead<{ data: CustomerDetail }>(
    `/api/admin/customers/${id}`,
    `/admin/customers/${id}`,
  );
  const admin = customer.roles.includes('admin');

  return (
    <>
      <PageHeader
        back={{ href: '/admin/customers', label: 'customers' }}
        title={<span className="break-all">{customer.email}</span>}
        description={
          <span className="flex flex-wrap items-center gap-2">
            {customer.name && <span>{customer.name}</span>}
            {admin && <Badge tone="note">Admin</Badge>}
            {customer.self && <Badge tone="neutral">You</Badge>}
          </span>
        }
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section>
          <h2 className="mb-3 font-display text-xl [--opsz:24] [--wght:600]">Recent orders</h2>
          {customer.recentOrders.length === 0 ? (
            <Empty>No orders on this account.</Empty>
          ) : (
            <Ledger>
              <LedgerHead
                columns={[
                  { label: 'Order' },
                  { label: 'Placed' },
                  { label: 'Status' },
                  { label: 'Total', align: 'right' },
                ]}
              />
              <tbody>
                {customer.recentOrders.map((order) => (
                  <tr key={order.id} className={rowClass}>
                    <td className={cellClass}>
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-display font-semibold [--opsz:16] hover:underline"
                      >
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className={`${cellClass} whitespace-nowrap text-[var(--ink-muted)]`}>
                      {formatDateTime(order.placedAt)}
                    </td>
                    <td className={cellClass}>
                      <Badge tone={adminStatusTone(order.status)}>
                        {ADMIN_STATUS_LABELS[order.status]}
                      </Badge>
                    </td>
                    <td className={`${cellClass} tabular text-right`}>
                      {formatMoney(order.grandTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Ledger>
          )}
        </section>

        <aside className="flex flex-col gap-6">
          <Sheet title="Account">
            <Facts
              items={[
                { label: 'Joined', value: formatDate(customer.createdAt) },
                {
                  label: 'Last seen',
                  value: customer.lastSeenAt ? formatDate(customer.lastSeenAt) : 'Not recorded',
                },
                { label: 'Signed in on', value: plural(customer.activeSessions, 'device') },
                { label: 'Orders', value: String(customer.orderCount) },
                {
                  label: 'Spent',
                  value:
                    customer.spent.length === 0
                      ? 'Nothing yet'
                      : customer.spent.map((money) => formatMoney(money)).join(', '),
                },
              ]}
            />
          </Sheet>

          <Sheet title="Access">
            <CustomerActions
              customerId={customer.id}
              email={customer.email}
              admin={admin}
              self={customer.self}
              bootstrapAdmin={customer.bootstrapAdmin}
              activeSessions={customer.activeSessions}
            />
          </Sheet>
        </aside>
      </div>
    </>
  );
}
