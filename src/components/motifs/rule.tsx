import { Separator } from 'radix-ui';
import { cn } from '@/lib/cn';
import { Leaf } from './leaf';

/**
 * Two dividers, at two levels, because a divider that means nothing is decoration.
 *
 * SlabRule is the minor break — a hairline with a short vertical tick at each end,
 * which is the H's slab serif reduced to its structure. VineRule is the major one,
 * carrying the leaf, and belongs between whole sections of a page.
 *
 * Both are Radix Separators, so a decorative rule is `aria-hidden` and a
 * semantically meaningful one is announced, rather than every rule being invisible
 * scaffolding or every rule being noise.
 */

type RuleProps = {
  className?: string;
  /** Set false when the rule genuinely separates content for a screen reader too. */
  decorative?: boolean;
};

export function SlabRule({ className, decorative = true }: RuleProps) {
  return (
    <Separator.Root
      decorative={decorative}
      className={cn('flex w-full items-center text-[var(--rule)]', className)}
    >
      <span aria-hidden className="h-2 w-px shrink-0 bg-current" />
      <span aria-hidden className="h-px grow bg-current" />
      <span aria-hidden className="h-2 w-px shrink-0 bg-current" />
    </Separator.Root>
  );
}

export function VineRule({ className, decorative = true }: RuleProps) {
  return (
    <Separator.Root
      decorative={decorative}
      className={cn('flex w-full items-center gap-3 text-[var(--rule)]', className)}
    >
      <span aria-hidden className="h-2 w-px shrink-0 bg-current" />
      <span aria-hidden className="h-px grow bg-current" />
      <Leaf aria-hidden className="h-4 w-4 shrink-0 -rotate-12" />
      <span aria-hidden className="h-px grow bg-current" />
      <span aria-hidden className="h-2 w-px shrink-0 bg-current" />
    </Separator.Root>
  );
}
