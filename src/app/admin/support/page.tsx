import type { Metadata } from 'next';
import Link from 'next/link';
import { adminRead } from '@/lib/admin/server';
import type { AdminSupportTicketSummary, Paged, TicketStatus } from '@/lib/admin/types';
import { ADMIN_TICKET_LABELS, adminTicketTone, formatDateTime } from '@/lib/admin/format';
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

export const metadata: Metadata = { title: 'Support' };

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const FILTERS: { value: TicketStatus | 'all'; label: string }[] = [
  { value: 'open', label: 'Needs a reply' },
  { value: 'answered', label: 'Answered' },
  { value: 'closed', label: 'Closed' },
  { value: 'all', label: 'All' },
];

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

/**
 * The inbox.
 *
 * Opens on the conversations that need a reply, **longest-waiting first**, because that is
 * the order they should be answered in. A search looks across every status, since somebody
 * quoting a reference down the phone does not know whether it was closed.
 */
export default async function AdminSupportPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const q = one(params.q);
  const requested = one(params.status);
  // No filter and no search is the inbox; a search with no filter looks everywhere.
  const status = requested ?? (q ? 'all' : 'open');

  const search = new URLSearchParams();
  if (status !== 'all') search.set('status', status);
  if (q) search.set('q', q);
  const page = one(params.page);
  if (page) search.set('page', page);

  const { data: tickets, page: paging } = await adminRead<Paged<AdminSupportTicketSummary>>(
    `/api/admin/support/tickets${search.size ? `?${search}` : ''}`,
    '/admin/support',
  );

  return (
    <>
      <PageHeader
        title="Support"
        description="Conversations customers have started from their accounts. Your reply is emailed to them and kept in the thread."
        actions={
          <SearchForm
            action="/admin/support"
            label="Find a conversation"
            placeholder="Reference or start of an email"
            defaultValue={q}
          />
        }
      />

      <div className="mb-4">
        <FilterLinks
          items={FILTERS.map((filter) => ({
            href: `/admin/support?status=${filter.value}${q ? `&q=${encodeURIComponent(q)}` : ''}`,
            label: filter.label,
            active: status === filter.value,
          }))}
        />
      </div>

      {tickets.length === 0 ? (
        <Empty>
          {q
            ? `No conversation matches “${q}”.`
            : status === 'open'
              ? 'Nobody is waiting on a reply.'
              : 'There are no conversations here.'}
        </Empty>
      ) : (
        <Ledger>
          <LedgerHead
            columns={[
              { label: 'Conversation' },
              { label: 'Customer' },
              { label: status === 'open' ? 'Waiting since' : 'Last message' },
              { label: 'Status' },
            ]}
          />
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.id} className={rowClass}>
                <td className={cellClass}>
                  <Link
                    href={`/admin/support/${ticket.id}`}
                    className="font-medium hover:underline"
                  >
                    {ticket.subject}
                  </Link>
                  <span className="mt-0.5 block text-xs text-[var(--ink-muted)]">
                    {ticket.reference}
                    {ticket.orderNumber && ` · about ${ticket.orderNumber}`}
                  </span>
                  <span className="mt-1 line-clamp-2 block max-w-md text-xs text-[var(--ink-faint)]">
                    {ticket.lastMessage.from === 'shop' ? 'Us: ' : 'Them: '}
                    {ticket.lastMessage.excerpt}
                  </span>
                </td>
                <td className={`${cellClass} break-all text-[var(--ink-muted)]`}>{ticket.email}</td>
                <td className={`${cellClass} whitespace-nowrap text-[var(--ink-muted)]`}>
                  {formatDateTime(ticket.lastMessageAt)}
                </td>
                <td className={cellClass}>
                  <Badge tone={adminTicketTone(ticket.status)}>
                    {ADMIN_TICKET_LABELS[ticket.status]}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </Ledger>
      )}

      <Pager
        page={paging.page}
        totalPages={paging.totalPages}
        total={paging.total}
        basePath="/admin/support"
        params={{ status, q }}
      />
    </>
  );
}
