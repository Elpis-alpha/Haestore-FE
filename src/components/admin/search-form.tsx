'use client';

import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

/**
 * A plain GET form. Searching a list is a URL, like filtering the shop is, so Back works
 * and a search can be pasted to a colleague. Hidden inputs carry the other filters along.
 */
export function SearchForm({
  action,
  label,
  placeholder,
  defaultValue,
  keep = {},
}: {
  action: string;
  label: string;
  placeholder: string;
  defaultValue?: string;
  keep?: Record<string, string | undefined>;
}) {
  return (
    <form action={action} method="get" role="search" className="flex items-end gap-2">
      {Object.entries(keep).map(([key, value]) =>
        value ? <input key={key} type="hidden" name={key} value={value} /> : null,
      )}
      <Field className="w-full max-w-xs">
        <FieldLabel className="sr-only">{label}</FieldLabel>
        <Input name="q" type="search" placeholder={placeholder} defaultValue={defaultValue} />
      </Field>
      <Button type="submit" variant="outline">
        Search
      </Button>
    </form>
  );
}
