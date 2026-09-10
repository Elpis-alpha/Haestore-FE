'use client';

import { createContext, useContext, useId } from 'react';
import { Label } from 'radix-ui';
import { cn } from '@/lib/cn';

/**
 * Form field plumbing, done once.
 *
 * The id, `aria-describedby` and `aria-invalid` wiring between a label, a control,
 * a hint and an error message is the thing every codebase gets slightly wrong in a
 * different place. Here Field mints the ids and the control reads them from
 * context, so a field is accessible because it was assembled, not because someone
 * remembered.
 *
 *   <Field>
 *     <FieldLabel>Email</FieldLabel>
 *     <Input type="email" autoComplete="email" />
 *     <FieldHint>We send a six-digit code. No password to forget.</FieldHint>
 *   </Field>
 */

type FieldContext = {
  id: string;
  hintId: string;
  errorId: string;
  invalid: boolean;
};

const Ctx = createContext<FieldContext | null>(null);

export function useField() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('Input, Textarea and FieldLabel must be used inside <Field>');
  return ctx;
}

/** For controls that are legitimately usable with or without a Field around them. */
export function useOptionalField() {
  return useContext(Ctx);
}

/** The aria props a control inside a Field should spread onto itself. */
export function useFieldControl() {
  const { id, hintId, errorId, invalid } = useField();
  return {
    id,
    'aria-invalid': invalid || undefined,
    'aria-describedby': [invalid ? errorId : null, hintId].filter(Boolean).join(' ') || undefined,
  } as const;
}

export function Field({
  invalid = false,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { invalid?: boolean }) {
  const uid = useId();
  return (
    <Ctx.Provider
      value={{ id: `${uid}-control`, hintId: `${uid}-hint`, errorId: `${uid}-error`, invalid }}
    >
      <div className={cn('flex flex-col gap-1.5', className)} {...props} />
    </Ctx.Provider>
  );
}

export function FieldLabel({ className, ...props }: React.ComponentPropsWithoutRef<'label'>) {
  const { id } = useField();
  return (
    <Label.Root
      htmlFor={id}
      className={cn('text-sm font-medium text-[var(--ink)]', className)}
      {...props}
    />
  );
}

export function FieldHint({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  const { hintId } = useField();
  return <p id={hintId} className={cn('text-xs text-[var(--ink-faint)]', className)} {...props} />;
}

/**
 * Renders nothing when there is no error, so callers can leave it in place
 * unconditionally. `role="alert"` announces the message when it appears rather
 * than only on the next focus move.
 */
export function FieldError({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  const { errorId } = useField();
  if (!children) return null;
  return (
    <p
      id={errorId}
      role="alert"
      className={cn('text-xs font-medium text-[var(--bad)]', className)}
      {...props}
    >
      {children}
    </p>
  );
}
