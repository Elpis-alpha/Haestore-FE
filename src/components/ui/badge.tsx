import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

/**
 * A small piece of state attached to something else: in stock, sold out, on sale.
 *
 * Colour is the message, so there is no "primary" badge and no colour picked for
 * looks. Each variant reads a dye slot from the surface it lands on, so the same
 * `<Badge tone="good">` is verdigris-200 on the chocolate ground and verdigris-600
 * on a paper card without being told which it is.
 */
const badge = cva(
  'inline-flex items-center gap-1.5 rounded-xs px-2 py-0.5 text-2xs font-medium leading-5 [&_svg]:size-3',
  {
    variants: {
      tone: {
        good: 'text-[var(--good)] ring-1 ring-[var(--good)]/40 ring-inset',
        bad: 'text-[var(--bad)] ring-1 ring-[var(--bad)]/40 ring-inset',
        note: 'text-[var(--note)] ring-1 ring-[var(--note)]/40 ring-inset',
        neutral: 'text-[var(--ink-muted)] ring-1 ring-[var(--edge)] ring-inset',
        // The only filled badge. Reserved for the one thing a shop genuinely
        // wants to shout, and it carries the hairline every dye fill carries.
        sale: 'border border-madder-300 bg-madder-500 text-paper-50',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badge>;

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badge({ tone }), className)} {...props} />;
}
