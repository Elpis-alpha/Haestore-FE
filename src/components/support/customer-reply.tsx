'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/input';
import { fieldErrorsOf, RequestError } from '@/lib/api/send';
import { closeConversation, replyToConversation } from '@/lib/support/client';
import type { TicketStatus } from '@/lib/support/types';

/**
 * Adding to a conversation, or ending it.
 *
 * Writing to a closed conversation reopens it, and the label says so before the person
 * presses the button rather than after. The thread is rendered on the server, so a sent
 * message is shown by refreshing it, not by appending a local copy that could disagree.
 */
export function CustomerReply({ reference, status }: { reference: string; status: TicketStatus }) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<'send' | 'close' | null>(null);
  const closed = status === 'closed';

  async function run(kind: 'send' | 'close') {
    setPending(kind);
    setError(null);
    try {
      if (kind === 'send') {
        await replyToConversation(reference, body.trim());
        setBody('');
      } else {
        await closeConversation(reference);
      }
      router.refresh();
    } catch (err) {
      setError(
        fieldErrorsOf(err).body ??
          (err instanceof RequestError ? err.message : 'That could not be sent.'),
      );
    } finally {
      setPending(null);
    }
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (body.trim()) void run('send');
      }}
    >
      <Field invalid={Boolean(error)}>
        <FieldLabel>{closed ? 'Write again to reopen this conversation' : 'Reply'}</FieldLabel>
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={5000}
          rows={4}
        />
        <FieldError>{error}</FieldError>
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending !== null || !body.trim()}>
          {pending === 'send' ? 'Sending…' : closed ? 'Send and reopen' : 'Send'}
        </Button>
        {!closed && (
          <Button
            type="button"
            variant="ghost"
            disabled={pending !== null}
            onClick={() => void run('close')}
          >
            {pending === 'close' ? 'Closing…' : 'This is sorted — close it'}
          </Button>
        )}
      </div>
    </form>
  );
}
