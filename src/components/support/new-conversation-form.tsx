'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { RadioRow, RadioSet } from '@/components/ui/choice';
import { Field, FieldError, FieldHint, FieldLabel } from '@/components/ui/field';
import { Input, Textarea } from '@/components/ui/input';
import { fieldErrorsOf, RequestError } from '@/lib/api/send';
import { openConversation } from '@/lib/support/client';

const NONE = 'none';

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long' });

export function NewConversationForm({
  orders,
  preselected,
}: {
  orders: { orderNumber: string; placedAt: string; itemCount: number }[];
  preselected?: string;
}) {
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [order, setOrder] = useState(preselected ?? NONE);
  const [body, setBody] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function submit() {
    setSending(true);
    setErrors({});
    setMessage(null);
    try {
      const { ticket } = await openConversation({
        subject: subject.trim(),
        body: body.trim(),
        ...(order !== NONE ? { orderNumber: order } : {}),
      });
      router.push(`/account/support/${ticket.reference}`);
    } catch (error) {
      const fields = fieldErrorsOf(error);
      setErrors(fields);
      // A 422 is said field by field; anything else — the open-conversation limit, a network
      // failure — is said once, above the button.
      if (Object.keys(fields).length === 0) {
        setMessage(error instanceof RequestError ? error.message : 'That could not be sent.');
      }
      setSending(false);
    }
  }

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <Field invalid={Boolean(errors.subject)}>
        <FieldLabel>Subject</FieldLabel>
        <Input
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          maxLength={160}
          required
          placeholder="Chipped bowl in my last order"
        />
        <FieldError>{errors.subject}</FieldError>
      </Field>

      {orders.length > 0 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-[var(--ink)]">Is it about an order?</legend>
          <RadioSet value={order} onValueChange={setOrder} className="flex flex-col gap-0.5">
            <RadioRow value={NONE} label="Not a particular order" />
            {orders.map((entry) => (
              <RadioRow
                key={entry.orderNumber}
                value={entry.orderNumber}
                label={entry.orderNumber}
                hint={`Placed ${dateFormat.format(new Date(entry.placedAt))} · ${entry.itemCount} ${entry.itemCount === 1 ? 'item' : 'items'}`}
              />
            ))}
          </RadioSet>
          {errors.orderNumber && (
            <p role="alert" className="text-xs font-medium text-[var(--bad)]">
              {errors.orderNumber}
            </p>
          )}
        </fieldset>
      )}

      <Field invalid={Boolean(errors.body)}>
        <FieldLabel>Message</FieldLabel>
        <Textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          maxLength={5000}
          rows={7}
          required
        />
        <FieldHint>What happened, and what you would like us to do about it.</FieldHint>
        <FieldError>{errors.body}</FieldError>
      </Field>

      {message && (
        <p role="alert" className="text-sm text-[var(--bad)]">
          {message}
        </p>
      )}

      <Button type="submit" disabled={sending} className="self-start">
        {sending ? 'Sending…' : 'Send'}
      </Button>
    </form>
  );
}
