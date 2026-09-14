import { send } from '@/lib/api/send';
import type { SupportTicket } from './types';

/** Support conversations, from the browser. Every call carries the session. */

export const openConversation = (input: { subject: string; body: string; orderNumber?: string }) =>
  send<{ ticket: SupportTicket }>('/api/support/tickets', { method: 'POST', body: input });

export const replyToConversation = (reference: string, body: string) =>
  send<{ ticket: SupportTicket }>(
    `/api/support/tickets/${encodeURIComponent(reference)}/messages`,
    {
      method: 'POST',
      body: { body },
    },
  );

export const closeConversation = (reference: string) =>
  send<{ ticket: SupportTicket }>(`/api/support/tickets/${encodeURIComponent(reference)}/close`, {
    method: 'POST',
  });
