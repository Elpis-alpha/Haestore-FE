import type { Metadata } from 'next';
import Link from 'next/link';
import { getOrders, requireSession } from '@/lib/auth/session';
import { NewConversationForm } from '@/components/support/new-conversation-form';

export const metadata: Metadata = { title: 'Start a conversation' };

/**
 * A new conversation.
 *
 * The person's recent orders are offered as choices rather than asking for an order number to
 * be typed: they are already known, the number is the least memorable thing about an order,
 * and choosing one means the message cannot be attached to somebody else's by a typo.
 * `?order=HAE-…` — the link from an order's own page — arrives with that order chosen.
 */
export default async function NewConversationPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [, { orders }, params] = await Promise.all([
    requireSession('/account/support/new'),
    getOrders(),
    searchParams,
  ]);
  const preselected = typeof params.order === 'string' ? params.order.toUpperCase() : undefined;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/account/support" className="text-sm underline underline-offset-4">
          ← Your conversations
        </Link>
        <h2 className="mt-3 font-display text-2xl [--opsz:32] [--wght:600]">
          Start a conversation
        </h2>
        <p className="mt-1 max-w-prose text-sm text-[var(--ink-muted)]">
          We reply here and let you know by email. Please don’t include card details — we never need
          them.
        </p>
      </div>

      <NewConversationForm
        orders={orders.slice(0, 8).map((order) => ({
          orderNumber: order.orderNumber,
          placedAt: order.placedAt,
          itemCount: order.itemCount,
        }))}
        preselected={
          orders.some((order) => order.orderNumber === preselected) ? preselected : undefined
        }
      />
    </div>
  );
}
