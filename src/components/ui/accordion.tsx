'use client';

import { Accordion as A } from 'radix-ui';
import { cn } from '@/lib/cn';

/**
 * Used twice in the storefront: the filter panel's attribute groups, and the
 * product page's specification table. Both are lists of things an admin defined,
 * so the component has to survive labels of any length — hence the trigger wraps
 * rather than truncating.
 *
 * The height transition uses Radix's --radix-accordion-content-height, which is the
 * only way to animate to `auto` without measuring in JavaScript.
 */

export const Accordion = A.Root;

export function AccordionItem({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof A.Item>) {
  return <A.Item className={cn('border-b border-[var(--rule)]', className)} {...props} />;
}

export function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof A.Trigger>) {
  return (
    <A.Header className="flex">
      <A.Trigger
        className={cn(
          'group flex flex-1 items-center justify-between gap-3 py-3 text-left',
          'text-sm font-medium text-[var(--ink)] transition-colors hover:text-[var(--ink-muted)]',
          className,
        )}
        {...props}
      >
        {children}
        <svg
          viewBox="0 0 12 12"
          aria-hidden
          className={cn(
            'size-3 shrink-0 opacity-60 transition-transform duration-200 ease-[var(--ease-out-soft)]',
            'group-data-[state=open]:-rotate-180',
          )}
        >
          <path
            d="m3 4.5 3 3 3-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </A.Trigger>
    </A.Header>
  );
}

export function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof A.Content>) {
  return (
    <A.Content
      className={cn(
        'overflow-hidden text-sm text-[var(--ink-muted)]',
        'data-[state=open]:animate-[accordion-open_220ms_var(--ease-out-soft)]',
        'data-[state=closed]:animate-[accordion-close_180ms_ease-in]',
      )}
      {...props}
    >
      <div className={cn('pb-3', className)}>{children}</div>
    </A.Content>
  );
}
