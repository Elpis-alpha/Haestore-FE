'use client';

import { Select as S } from 'radix-ui';
import { cn } from '@/lib/cn';
import { useOptionalField } from './field';

/**
 * A select, for a short closed list — sort order, country, a variant axis with a
 * handful of values. Anything longer wants a search field, not a taller menu.
 *
 * The listbox is a paper surface: floating things in this system are paper set
 * down on the counter. That single class re-points ink, edges and the focus ring
 * inside the menu, so nothing in here needs a light-on-dark variant.
 */

export const SelectRoot = S.Root;
export const SelectGroup = S.Group;
export const SelectValue = S.Value;

export function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof S.Trigger>) {
  const field = useOptionalField();
  return (
    <S.Trigger
      id={field?.id}
      className={cn(
        'inline-flex h-10 w-full items-center justify-between gap-2 rounded-sm px-3',
        'border border-[var(--edge)] bg-[var(--field)] text-sm text-[var(--ink)]',
        'transition-colors duration-150 hover:border-[var(--ink-muted)]',
        'data-[placeholder]:text-[var(--ink-faint)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    >
      {children}
      <S.Icon asChild>
        <svg viewBox="0 0 12 12" className="size-3 shrink-0 opacity-60" aria-hidden>
          <path
            d="m3 4.5 3 3 3-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </S.Icon>
    </S.Trigger>
  );
}

export function SelectContent({
  className,
  children,
  position = 'popper',
  ...props
}: React.ComponentPropsWithoutRef<typeof S.Content>) {
  return (
    <S.Portal>
      <S.Content
        position={position}
        sideOffset={6}
        className={cn(
          'surface-paper z-50 max-h-72 min-w-[var(--radix-select-trigger-width)] overflow-hidden',
          'rounded-md border border-[var(--edge)] shadow-[var(--shadow-lift)]',
          'data-[state=open]:animate-[rise-in_160ms_var(--ease-out-soft)]',
          'data-[state=closed]:animate-[fade-out_100ms_ease-in]',
          className,
        )}
        {...props}
      >
        <S.Viewport className="p-1">{children}</S.Viewport>
      </S.Content>
    </S.Portal>
  );
}

export function SelectItem({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof S.Item>) {
  return (
    <S.Item
      className={cn(
        'relative flex cursor-pointer items-center rounded-xs py-1.5 pr-8 pl-2.5 text-sm',
        'text-[var(--ink)] outline-none select-none',
        'data-[highlighted]:bg-[var(--ink)]/8',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-45',
        className,
      )}
      {...props}
    >
      <S.ItemText>{children}</S.ItemText>
      <S.ItemIndicator className="absolute right-2.5">
        <svg viewBox="0 0 12 12" className="size-3" aria-hidden>
          <path
            d="M2.5 6.2 4.8 8.6 9.5 3.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </S.ItemIndicator>
    </S.Item>
  );
}

export function SelectLabel({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof S.Label>) {
  return (
    <S.Label
      className={cn('px-2.5 pt-2 pb-1 text-2xs font-medium text-[var(--ink-faint)]', className)}
      {...props}
    />
  );
}
