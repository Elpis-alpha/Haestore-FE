import type { components } from '@/lib/api/schema';

/**
 * The order's shapes, from the generated contract.
 *
 * Same argument as the cart's: Phase 5 shipped a page that read `data.account` from a
 * response whose field is `data.user`, and it typechecked, because the type had been
 * written next to the fetch as a guess. Nothing here is described twice.
 */

export type Order = components['schemas']['Order'];
export type OrderLine = components['schemas']['OrderLine'];
export type ShippingAddress = components['schemas']['ShippingAddress'];
export type OrderStatus = Order['status'];

/**
 * What a status means to the person who placed the order, rather than to the database.
 *
 * `pending_payment` is the one worth care: to us it is a row awaiting a webhook, but to
 * a shopper who has just closed a payment window it means "did that work?" — so it says
 * so plainly instead of using a word that sounds like a filing state.
 */
export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending_payment: 'Awaiting payment',
  paid: 'Paid',
  processing: 'Being packed',
  shipped: 'On its way',
  delivered: 'Delivered',
  canceled: 'Canceled',
  refunded: 'Refunded',
};

/** Which of the three tones the status badge takes. Maps to the surface contract's dyes. */
export function statusTone(status: OrderStatus): 'good' | 'bad' | 'note' {
  if (status === 'canceled' || status === 'refunded') return 'bad';
  if (status === 'pending_payment') return 'note';
  return 'good';
}
