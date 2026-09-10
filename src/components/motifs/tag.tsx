import { cn } from '@/lib/cn';

/**
 * A tag tied to the goods: a label with one corner cut and a punched hole.
 *
 * This is where the system spends its one piece of literal decoration, and it is
 * spent here because the paper label is the whole conceit of the palette — the
 * primary button, the product card and this are the same object at three sizes.
 *
 * Like the primary button, it takes `--ink` for its body and `--surface` for its
 * text, so it inverts on its own: cream tag on the chocolate ground, dark tag on a
 * paper card. Filling it with a fixed cream made it invisible the moment it landed
 * on a paper surface — which is exactly the bug the contract exists to prevent.
 *
 * The punch reads as a hole because it too is `--surface`, so it really does match
 * whatever the tag is lying on.
 */
export function Tag({ className, children, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'relative inline-flex items-center bg-[var(--ink)] py-1 pr-3 pl-6 text-[var(--surface)]',
        'font-display text-sm leading-none [--opsz:16] [--wght:600] tabular',
        // The cut corner. A clip-path keeps it one element instead of a wrapper
        // plus a rotated pseudo-element that would have to be re-fudged per size.
        '[clip-path:polygon(0.75rem_0,100%_0,100%_100%,0.75rem_100%,0_50%)]',
        className,
      )}
      {...props}
    >
      <span aria-hidden className="absolute left-2.5 size-1.5 rounded-full bg-[var(--surface)]" />
      {children}
    </span>
  );
}
