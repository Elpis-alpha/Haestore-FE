'use client';

import { Tooltip as T } from 'radix-ui';
import { cn } from '@/lib/cn';

/**
 * A tooltip explains a control that had to be an icon. It is never the only place
 * a piece of information appears, because it is unreachable on touch.
 */

export const TooltipProvider = T.Provider;
export const TooltipRoot = T.Root;
export const TooltipTrigger = T.Trigger;

export function TooltipContent({
  className,
  children,
  sideOffset = 6,
  ...props
}: React.ComponentPropsWithoutRef<typeof T.Content>) {
  return (
    <T.Portal>
      <T.Content
        sideOffset={sideOffset}
        className={cn(
          'surface-paper z-50 max-w-64 rounded-sm px-2.5 py-1.5 text-xs shadow-[var(--shadow-lift)]',
          'data-[state=delayed-open]:animate-[rise-in_140ms_var(--ease-out-soft)]',
          className,
        )}
        {...props}
      >
        {children}
        <T.Arrow className="fill-paper-50" width={10} height={5} />
      </T.Content>
    </T.Portal>
  );
}
