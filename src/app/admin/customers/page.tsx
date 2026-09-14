import type { Metadata } from 'next';
import Link from 'next/link';
import { adminRead, queryOf } from '@/lib/admin/server';
import type { CustomerSummary, Paged } from '@/lib/admin/types';
import { formatDate } from '@/lib/admin/format';
import { formatMoney } from '@/lib/money';
import { Badge } from '@/components/ui/badge';
import {
  Empty,
  Ledger,
  LedgerHead,
  PageHeader,
  Pager,
  cellClass,
  rowClass,
} from '@/components/admin/ledger';
import { SearchForm } from '@/components/admin/search-form';

export const metadata: Metadata = { title: 'Customers' };

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminCustomersPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = Array.isArray(params.q) ? params.q[0] : params.q;

  const { data: customers, page } = await adminRead<Paged<CustomerSummary>>(
    `/api/admin/customers${queryOf(params, ['q', 'page'])}`,
    '/admin/customers',
  );

  return (
    <>
      <PageHeader
        title="Customers"
        description="Everyone who has signed in at least once. A guest who checked out and never came back is in the order list under their address."
        actions={
          <SearchForm
            action="/admin/customers"
            label="Find a customer"
            placeholder="Start of an email"
            defaultValue={q}
          />
        }
      />

      {customers.length === 0 ? (
        <Empty>{q ? `No one’s address starts with “${q}”.` : 'No one has signed in yet.'}</Empty>
      ) : (
        <Ledger>
          <LedgerHead
            columns={[
              { label: 'Customer' },
              { label: 'Joined' },
              { label: 'Last seen' },
              { label: 'Orders', align: 'right' },
              { label: 'Spent', align: 'right' },
            ]}
          />
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} className={rowClass}>
                <td className={cellClass}>
                  <Link
                    href={`/admin/customers/${customer.id}`}
                    className="font-medium hover:underline"
                  >
                    <span className="break-all">{customer.email}</span>
                  </Link>
                  <span className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[var(--ink-muted)]">
                    {customer.name}
                    {customer.roles.includes('admin') && <Badge tone="note">Admin</Badge>}
                  </span>
                </td>
                <td className={`${cellClass} whitespace-nowrap text-[var(--ink-muted)]`}>
                  {formatDate(customer.createdAt)}
                </td>
                <td className={`${cellClass} whitespace-nowrap text-[var(--ink-muted)]`}>
                  {customer.lastSeenAt ? formatDate(customer.lastSeenAt) : '—'}
                </td>
                <td className={`${cellClass} tabular text-right`}>{customer.orderCount}</td>
                <td className={`${cellClass} tabular text-right`}>
                  {customer.spent.length === 0
                    ? '—'
                    : customer.spent.map((money) => formatMoney(money)).join(', ')}
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
        basePath="/admin/customers"
        params={{ q }}
      />
    </>
  );
}
