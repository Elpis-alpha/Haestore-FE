import { cn } from '@/lib/cn';

/**
 * A loading placeholder that warms rather than pulses grey.
 *
 * The sweep is one of the few animations here that nobody triggered; it earns that
 * by being the only signal that the page is still working. `prefers-reduced-motion`
 * flattens it to a static block globally.
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn(
        'relative overflow-hidden rounded-sm bg-[var(--ink)]/8',
        'after:absolute after:inset-0 after:-translate-x-full',
        'after:bg-gradient-to-r after:from-transparent after:via-[var(--ink)]/10 after:to-transparent',
        'after:animate-[sweep_1.6s_ease-in-out_infinite]',
        className,
      )}
      {...props}
    />
  );
}
