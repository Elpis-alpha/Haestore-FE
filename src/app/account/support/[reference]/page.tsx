import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { SlabRule } from '@/components/motifs/rule';
import { Thread } from '@/components/support/thread';
import { CustomerReply } from '@/components/support/customer-reply';
import { getMyTicket, requireSession } from '@/lib/auth/session';
import { CUSTOMER_TICKET_LABELS, customerTicketTone } from '@/lib/support/types';

type PageProps = { params: Promise<{ reference: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { reference } = await params;
  return { title: reference.toUpperCase() };
}

/**
 * One conversation.
 *
 * Opening it is what marks the shop's replies as seen — the API records that on this read —
 * so the "New reply" mark on the list clears because the person actually looked, not because
 * an email was delivered.
 *
 * **No `loading.tsx`**: this page can redirect to sign in and can 404, and a Suspense
 * boundary at the route would commit a 200 before either (FRONTEND.md).
 */
export default async function ConversationPage({ params }: PageProps) {
  const { reference } = await params;
  await requireSession(`/account/support/${reference}`);

  const ticket = await getMyTicket(reference);
  if (!ticket) notFound();

  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <Link href="/account/support" className="self-start text-sm underline underline-offset-4">
          ← Your conversations
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="font-display text-2xl text-balance [--opsz:32] [--wght:600]">
            {ticket.subject}
          </h2>
          <Badge tone={customerTicketTone(ticket.status)}>
            {CUSTOMER_TICKET_LABELS[ticket.status]}
          </Badge>
        </div>
        <p className="text-sm text-[var(--ink-muted)]">
          Reference {ticket.reference}
          {ticket.orderNumber && (
            <>
              {' · about '}
              <Link
                href={`/account/orders/${ticket.orderNumber}`}
                className="underline underline-offset-4"
              >
                {ticket.orderNumber}
              </Link>
            </>
          )}
        </p>
      </header>

      <Thread messages={ticket.messages} viewer="customer" />

      <SlabRule />

      <CustomerReply reference={ticket.reference} status={ticket.status} />
    </article>
  );
}
