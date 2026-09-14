'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckRow } from '@/components/ui/choice';
import { Field, FieldHint, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/input';
import { adminSend } from '@/lib/admin/client';
import type { TicketStatus } from '@/lib/admin/types';
import { useAdminAction } from './console-provider';

/**
 * Replying from behind the counter.
 *
 * "Close after sending" is offered beside Send because the commonest last message is an
 * answer, and making it two steps is how conversations that are finished sit in the inbox as
 * "answered" forever. A customer who writes back reopens it either way.
 */
export function StaffReply({
  ticketId,
  status,
  email,
}: {
  ticketId: string;
  status: TicketStatus;
  email: string;
}) {
  const { run, pending } = useAdminAction();
  const [body, setBody] = useState('');
  const [close, setClose] = useState(false);
  const closed = status === 'closed';

  return (
    <div className="flex flex-col gap-4">
      <form
        className="flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          const text = body.trim();
          if (!text) return;
          void run(
            () =>
              adminSend(`/api/admin/support/tickets/${ticketId}/messages`, {
                method: 'POST',
                body: { body: text, close },
              }),
            {
              done: close ? 'Reply sent and conversation closed' : 'Reply sent',
              description: `An email is on its way to ${email}.`,
            },
          ).then((result) => {
            // Kept on failure, so a reply that did not send is not also a reply that was lost.
            if (!result.ok) return;
            setBody('');
            setClose(false);
          });
        }}
      >
        <Field>
          <FieldLabel>Reply</FieldLabel>
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            maxLength={5000}
            rows={6}
          />
          <FieldHint>
            Sent to {email} and kept here. It goes from the shop — your address is not shown to
            them.
          </FieldHint>
        </Field>
        <CheckRow
          label="Close the conversation after sending"
          checked={close}
          onCheckedChange={(value) => setClose(value === true)}
          className="self-start"
        />
        <Button type="submit" disabled={pending || !body.trim()} className="self-start">
          Send reply
        </Button>
      </form>

      <div className="border-t border-[var(--rule)] pt-3">
        {closed ? (
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() =>
              void run(
                () =>
                  adminSend(`/api/admin/support/tickets/${ticketId}/reopen`, { method: 'POST' }),
                { done: 'Conversation reopened' },
              )
            }
          >
            Reopen — it needs a reply
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            disabled={pending}
            onClick={() =>
              void run(
                () => adminSend(`/api/admin/support/tickets/${ticketId}/close`, { method: 'POST' }),
                { done: 'Conversation closed' },
              )
            }
          >
            Close without replying
          </Button>
        )}
      </div>
    </div>
  );
}
