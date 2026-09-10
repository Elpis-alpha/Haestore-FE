'use client';

import { cn } from '@/lib/cn';
import { useFieldControl } from './field';

/**
 * An input is an incised well in the surface, not a raised box: --field is always
 * a step darker than the surface it sits in (a step lighter on paper). That is why
 * the border can stay a hairline instead of doing all the work of saying "type
 * here".
 */
const control = [
  'w-full rounded-sm bg-[var(--field)] px-3 text-[var(--ink)]',
  'border border-[var(--edge)]',
  'transition-colors duration-150',
  'placeholder:text-[var(--ink-faint)]',
  'hover:border-[var(--ink-muted)]',
  'disabled:cursor-not-allowed disabled:opacity-50',
  'aria-[invalid]:border-[var(--bad)]',
];

export function Input({ className, ...props }: React.ComponentPropsWithoutRef<'input'>) {
  const aria = useFieldControl();
  return <input {...aria} className={cn(control, 'h-10 text-sm', className)} {...props} />;
}

export function Textarea({ className, ...props }: React.ComponentPropsWithoutRef<'textarea'>) {
  const aria = useFieldControl();
  return (
    <textarea
      {...aria}
      className={cn(control, 'min-h-24 resize-y py-2 text-sm leading-relaxed', className)}
      {...props}
    />
  );
}
