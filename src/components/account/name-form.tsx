'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldHint, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

/**
 * The one editable thing on the account.
 *
 * Asked for *after* signing in rather than as a barrier to it, and optional even then:
 * nothing in the shop needs a name until there is an order to address, and a required
 * field in front of the door turns a thirty-second sign-in into a form.
 */
export function NameForm({ name }: { name?: string }) {
  const router = useRouter();
  const [value, setValue] = useState(name ?? '');
  const [state, setState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [error, setError] = useState<string | null>(null);

  const dirty = value.trim() !== (name ?? '');

  return (
    <form
      className="flex flex-col gap-4 sm:max-w-sm"
      onSubmit={(event) => {
        event.preventDefault();
        setState('saving');
        setError(null);
        void fetch('/api/auth/me', {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          // An empty string is sent as an omitted field, which unsets it. Storing ""
          // would make "has a name" two checks everywhere instead of one.
          body: JSON.stringify(value.trim() ? { name: value.trim() } : {}),
        })
          .then(async (response) => {
            if (!response.ok) {
              const body = (await response.json().catch(() => null)) as {
                error?: { message?: string };
              } | null;
              setError(body?.error?.message ?? 'That could not be saved.');
              setState('idle');
              return;
            }
            setState('saved');
            router.refresh();
          })
          .catch(() => {
            setError('We could not reach the shop.');
            setState('idle');
          });
      }}
    >
      <Field invalid={Boolean(error)}>
        <FieldLabel>Name</FieldLabel>
        <Input
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setState('idle');
          }}
          maxLength={80}
          autoComplete="name"
          placeholder="Not set"
        />
        <FieldHint>Optional. Used on orders, so a parcel arrives addressed to someone.</FieldHint>
        <FieldError>{error}</FieldError>
      </Field>

      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={!dirty || state === 'saving'}>
          {state === 'saving' ? 'Saving…' : 'Save name'}
        </Button>
        {state === 'saved' && !dirty && (
          <span className="text-xs text-[var(--good)]" role="status">
            Saved
          </span>
        )}
      </div>
    </form>
  );
}
