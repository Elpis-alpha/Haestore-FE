import type { components } from '@/lib/api/schema';

/** Support conversations' shapes, from the generated contract. */

export type SupportTicket = components['schemas']['SupportTicket'];
export type SupportTicketSummary = components['schemas']['SupportTicketSummary'];
export type SupportMessage = components['schemas']['SupportMessage'];
export type TicketStatus = SupportTicket['status'];

/**
 * What a status means to the person who wrote in.
 *
 * The API names statuses by who owes the next message, which is exactly right for an inbox
 * and slightly cold for a customer. These say the same thing in the words somebody waiting
 * on a reply would use.
 */
export const CUSTOMER_TICKET_LABELS: Record<TicketStatus, string> = {
  open: 'Waiting for our reply',
  answered: 'We replied',
  closed: 'Closed',
};

export function customerTicketTone(status: TicketStatus): 'good' | 'note' | 'neutral' {
  if (status === 'answered') return 'good';
  if (status === 'open') return 'note';
  return 'neutral';
}
