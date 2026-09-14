import type { OrderStatus } from './types';

/**
 * The console's vocabulary.
 *
 * The shopper's labels live in lib/checkout/types.ts and answer "what is happening to my
 * order". These answer "what do I have to do about it", which is a different question
 * with different words: to a shopper `paid` is reassurance, to the person behind the
 * counter it is a parcel still to pack.
 */
export const ADMIN_STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: 'Awaiting payment',
  paid: 'Paid, to pack',
  processing: 'Packing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  canceled: 'Canceled',
  refunded: 'Refunded',
};

/**
 * `note` where the order is waiting on someone in the shop, `good` where it has left,
 * `neutral` where nothing more will happen. Canceled and refunded are not failures from
 * behind the counter — they are closed.
 */
export function adminStatusTone(status: OrderStatus): 'good' | 'note' | 'neutral' {
  if (status === 'shipped' || status === 'delivered') return 'good';
  if (status === 'canceled' || status === 'refunded') return 'neutral';
  return 'note';
}

/**
 * Who moved an order, in words.
 *
 * The API records `by` as a machine string so the history can be written without a join;
 * this is the one place it becomes a sentence fragment.
 */
export function describeActor(by: string, viewerId?: string): string {
  if (by.startsWith('admin:')) return by.slice(6) === viewerId ? 'You' : 'An admin';
  switch (by) {
    case 'checkout':
      return 'Placed at checkout';
    case 'webhook':
      return 'The payment provider';
    case 'reconcile':
      return 'The return page';
    case 'sweeper':
      return 'The reservation expired';
    default:
      return by;
  }
}

const dateTime = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const dateOnly = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));
export const formatDate = (iso: string) => dateOnly.format(new Date(iso));

/** "3 orders", "1 order" — the console writes counts into sentences, so it needs this. */
export function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`;
}
