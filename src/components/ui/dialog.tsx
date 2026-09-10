'use client';

import { Dialog as D } from 'radix-ui';
import { cn } from '@/lib/cn';
import { Button } from './button';
import { SlabRule } from '../motifs/rule';

/**
 * Dialog and Drawer, from one Radix root.
 *
 * Both are paper. Both animate only on the way in and out, because that motion is
 * the visible half of something the person just did — it shows where the thing
 * came from. Nothing in this system moves on its own except a loading skeleton.
 *
 * The drawer slides from the right and is what the cart uses in Phase 6; the
 * dialog rises a few pixels rather than scaling up from nothing, which reads as a
 * label being set down rather than a window zooming open.
 */

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

function Overlay({ className, ...props }: React.ComponentPropsWithoutRef<typeof D.Overlay>) {
  return (
    <D.Overlay
      className={cn(
        'fixed inset-0 z-40 bg-bark-950/70 backdrop-blur-[2px]',
        'data-[state=open]:animate-[fade-in_200ms_ease-out]',
        'data-[state=closed]:animate-[fade-out_150ms_ease-in]',
        className,
      )}
      {...props}
    />
  );
}

export function DialogContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof D.Content>) {
  return (
    <D.Portal>
      <Overlay />
      <D.Content
        className={cn(
          'surface-paper fixed top-1/2 left-1/2 z-50 w-[calc(100vw-2rem)] max-w-lg',
          '-translate-x-1/2 -translate-y-1/2 rounded-lg p-6 shadow-[var(--shadow-lift)]',
          'data-[state=open]:animate-[rise-in_220ms_var(--ease-out-soft)]',
          'data-[state=closed]:animate-[rise-out_150ms_ease-in]',
          className,
        )}
        {...props}
      >
        {children}
        <CloseButton />
      </D.Content>
    </D.Portal>
  );
}

export function DrawerContent({
  className,
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof D.Content>) {
  return (
    <D.Portal>
      <Overlay />
      <D.Content
        className={cn(
          'surface-paper fixed inset-y-0 right-0 z-50 flex w-[min(26rem,100vw)] flex-col',
          'shadow-[var(--shadow-lift)]',
          'data-[state=open]:animate-[slide-in-right_280ms_var(--ease-out-soft)]',
          'data-[state=closed]:animate-[slide-out-right_200ms_ease-in]',
          className,
        )}
        {...props}
      >
        {children}
        <CloseButton />
      </D.Content>
    </D.Portal>
  );
}

function CloseButton() {
  return (
    <D.Close asChild>
      <Button variant="ghost" size="icon" className="absolute top-3 right-3">
        <svg viewBox="0 0 14 14" aria-hidden>
          <path
            d="m3.5 3.5 7 7m0-7-7 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <span className="sr-only">Close</span>
      </Button>
    </D.Close>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col gap-1.5 pr-10', className)} {...props} />;
}

export function DialogTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof D.Title>) {
  return (
    <D.Title
      className={cn('font-display text-xl [--opsz:24] [--wght:600]', className)}
      {...props}
    />
  );
}

export function DialogDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof D.Description>) {
  return <D.Description className={cn('text-sm text-[var(--ink-muted)]', className)} {...props} />;
}

/** Actions sit under a slab rule, so the dialog always reads bottom-weighted. */
export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className="mt-6 flex flex-col gap-4">
      <SlabRule />
      <div
        className={cn('flex flex-col-reverse gap-2 sm:flex-row sm:justify-end', className)}
        {...props}
      />
    </div>
  );
}
