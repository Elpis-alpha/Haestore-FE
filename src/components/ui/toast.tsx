'use client';

import { Toast as T } from 'radix-ui';
import { cn } from '@/lib/cn';
import { Leaf } from '../motifs/leaf';

/**
 * A toast confirms something that already happened. It never asks a question and
 * it never carries the only copy of an error a person needs to act on.
 *
 * Radix handles the part that is genuinely hard: a swipe to dismiss, a pause on
 * hover and on window blur, and an aria-live region that announces without
 * stealing focus.
 */

export const ToastProvider = T.Provider;
export const ToastAction = T.Action;

export function ToastViewport({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof T.Viewport>) {
  return (
    <T.Viewport
      className={cn(
        'fixed right-0 bottom-0 z-[60] flex w-[min(24rem,100vw)] flex-col gap-2 p-4 outline-none',
        className,
      )}
      {...props}
    />
  );
}

export function Toast({
  className,
  title,
  description,
  tone = 'good',
  children,
  ...props
}: React.ComponentPropsWithoutRef<typeof T.Root> & {
  title: React.ReactNode;
  description?: React.ReactNode;
  tone?: 'good' | 'bad';
}) {
  return (
    <T.Root
      className={cn(
        'surface-paper flex items-start gap-3 rounded-md p-3.5 shadow-[var(--shadow-lift)]',
        'data-[state=open]:animate-[rise-in_220ms_var(--ease-out-soft)]',
        'data-[state=closed]:animate-[fade-out_150ms_ease-in]',
        'data-[swipe=end]:animate-[slide-out-right_150ms_ease-out]',
        'data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)]',
        'data-[swipe=cancel]:translate-x-0 data-[swipe=cancel]:transition-transform',
        className,
      )}
      {...props}
    >
      {tone === 'good' ? (
        <Leaf className="mt-0.5 size-4 shrink-0 text-[var(--good)]" />
      ) : (
        <svg viewBox="0 0 16 16" aria-hidden className="mt-0.5 size-4 shrink-0 text-[var(--bad)]">
          <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M8 5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="8" cy="11" r=".9" fill="currentColor" />
        </svg>
      )}
      <div className="flex grow flex-col gap-0.5">
        <T.Title className="text-sm font-medium">{title}</T.Title>
        {description && (
          <T.Description className="text-xs text-[var(--ink-muted)]">{description}</T.Description>
        )}
        {children}
      </div>
      <T.Close
        aria-label="Dismiss"
        className="-m-1 rounded-xs p-1 text-[var(--ink-faint)] transition-colors hover:text-[var(--ink)]"
      >
        <svg viewBox="0 0 14 14" aria-hidden className="size-3.5">
          <path
            d="m3.5 3.5 7 7m0-7-7 7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </T.Close>
    </T.Root>
  );
}
