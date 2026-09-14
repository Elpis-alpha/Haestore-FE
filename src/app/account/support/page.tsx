import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getMyTickets, requireSession } from '@/lib/auth/session';
import { CUSTOMER_TICKET_LABELS, customerTicketTone } from '@/lib/support/types';

export const metadata: Metadata = { title: 'Help' };

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/**
 * The conversations this person has started, most recent first, with the ones the shop has
 * answered since they last looked marked as new — by a word, not only a dot, so the mark
 * means something without colour.
 */
export default async function AccountSupportPage() {
  await requireSession('/account/support');
  const tickets = await getMyTickets();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="max-w-prose text-sm text-[var(--ink-muted)]">
          Your conversations with the shop. When we reply you get an email, and the reply is here.
        </p>
        <Button asChild size="sm">
          <Link href="/account/support/new">Start a conversation</Link>
        </Button>
      </div>

      {tickets.length === 0 ? (
        <p className="text-[var(--ink-muted)]">
          You have not written to us. If something is wrong with an order, open it from{' '}
          <Link href="/account/orders" className="underline underline-offset-4">
            your orders
          </Link>{' '}
          and ask from there — the order comes with the message.
        </p>
      ) : (
        <ul className="divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
          {tickets.map((ticket) => (
            <li key={ticket.reference}>
              <Link
                href={`/account/support/${ticket.reference}`}
                className="flex flex-col gap-1.5 py-4 transition-colors hover:bg-[var(--ink)]/5"
              >
                <span className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                  <span className="flex min-w-0 items-center gap-2 font-medium">
                    {ticket.unread && <Badge tone="good">New reply</Badge>}
                    <span className="truncate">{ticket.subject}</span>
                  </span>
                  <Badge tone={customerTicketTone(ticket.status)}>
                    {CUSTOMER_TICKET_LABELS[ticket.status]}
                  </Badge>
                </span>
                <span className="line-clamp-1 text-sm text-[var(--ink-muted)]">
                  {ticket.lastMessage.from === 'shop' ? 'Hæstore: ' : 'You: '}
                  {ticket.lastMessage.excerpt}
                </span>
                <span className="text-xs text-[var(--ink-faint)]">
                  {ticket.reference}
                  {ticket.orderNumber && ` · about ${ticket.orderNumber}`} ·{' '}
                  {dateFormat.format(new Date(ticket.lastMessageAt))}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
