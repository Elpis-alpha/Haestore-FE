import type { Metadata } from 'next';
import Link from 'next/link';
import { adminRead } from '@/lib/admin/server';
import { getSession } from '@/lib/auth/session';
import type { AdminSupportTicket } from '@/lib/admin/types';
import {
  ADMIN_STATUS_LABELS,
  ADMIN_TICKET_LABELS,
  adminTicketTone,
  formatDateTime,
} from '@/lib/admin/format';
import { Badge } from '@/components/ui/badge';
import { Facts, PageHeader, Sheet } from '@/components/admin/ledger';
import { StaffReply } from '@/components/admin/staff-reply';
import { Thread } from '@/components/support/thread';

type PageProps = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: 'Conversation' };

/**
 * One conversation, from behind the counter.
 *
 * The thread and the reply box on the left; on the right, who this is and what it is about —
 * the customer's account and the order, one link each, so answering "where is my parcel"
 * does not start with a search.
 */
export default async function AdminConversationPage({ params }: PageProps) {
  const { id } = await params;
  const [{ data }, session] = await Promise.all([
    adminRead<{ data: { ticket: AdminSupportTicket } }>(
      `/api/admin/support/tickets/${id}`,
      `/admin/support/${id}`,
    ),
    getSession(),
  ]);
  const { ticket } = data;
  const viewerEmail = session?.account.email;
  const customerName = ticket.customer?.name ?? ticket.customer?.email ?? ticket.email;

  return (
    <>
      <PageHeader
        back={{ href: '/admin/support', label: 'support' }}
        title={ticket.subject}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <Badge tone={adminTicketTone(ticket.status)}>
              {ADMIN_TICKET_LABELS[ticket.status]}
            </Badge>
            <span>
              {ticket.reference} · opened {formatDateTime(ticket.createdAt)}
              {ticket.closedBy &&
                ` · closed by ${ticket.closedBy === 'shop' ? 'the shop' : 'the customer'}`}
            </span>
          </span>
        }
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex flex-col gap-6">
          <Thread
            viewer="shop"
            messages={ticket.messages.map((message) => ({
              ...message,
              byline:
                message.from === 'shop'
                  ? message.staffEmail && message.staffEmail === viewerEmail
                    ? 'You'
                    : (message.staffEmail ?? 'The shop')
                  : customerName,
            }))}
          />
          <Sheet title={ticket.status === 'closed' ? 'Write again' : 'Answer'}>
            <StaffReply ticketId={ticket.id} status={ticket.status} email={ticket.email} />
          </Sheet>
        </div>

        <aside className="flex flex-col gap-6">
          <Sheet title="Who">
            <Facts
              items={[
                {
                  label: 'Email',
                  value: ticket.customer ? (
                    <Link
                      href={`/admin/customers/${ticket.customer.id}`}
                      className="break-all underline decoration-[var(--rule)] underline-offset-4 hover:decoration-[var(--ink)]"
                    >
                      {ticket.email}
                    </Link>
                  ) : (
                    <span className="break-all">{ticket.email}</span>
                  ),
                },
                { label: 'Name', value: ticket.customer?.name ?? '—' },
              ]}
            />
          </Sheet>

          <Sheet title="About">
            {ticket.order ? (
              <Facts
                items={[
                  {
                    label: 'Order',
                    value: (
                      <Link
                        href={`/admin/orders/${ticket.order.id}`}
                        className="underline decoration-[var(--rule)] underline-offset-4 hover:decoration-[var(--ink)]"
                      >
                        {ticket.order.orderNumber}
                      </Link>
                    ),
                  },
                  { label: 'Status', value: ADMIN_STATUS_LABELS[ticket.order.status] },
                ]}
              />
            ) : (
              <p className="text-sm text-[var(--ink-muted)]">Not about a particular order.</p>
            )}
          </Sheet>
        </aside>
      </div>
    </>
  );
}
