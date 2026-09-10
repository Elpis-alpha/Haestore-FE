'use client';

import { Tabs as T } from 'radix-ui';
import { cn } from '@/lib/cn';

/**
 * Tabs, marked by the slab: the active tab sits on a short heavy rule that is the
 * same shape as the serif at the foot of the H. It reads as a bookmark tab rather
 * than a pill, which suits a catalogue.
 */

export const Tabs = T.Root;

export function TabsList({ className, ...props }: React.ComponentPropsWithoutRef<typeof T.List>) {
  return (
    <T.List
      className={cn('flex items-end gap-1 border-b border-[var(--rule)]', className)}
      {...props}
    />
  );
}

export function TabsTrigger({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof T.Trigger>) {
  return (
    <T.Trigger
      className={cn(
        'relative -mb-px px-3 py-2 text-sm font-medium text-[var(--ink-muted)]',
        'border-b-2 border-transparent transition-colors duration-150',
        'hover:text-[var(--ink)]',
        'data-[state=active]:border-[var(--ink)] data-[state=active]:text-[var(--ink)]',
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof T.Content>) {
  return <T.Content className={cn('pt-4', className)} {...props} />;
}
