import { Slot } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/cn';

/**
 * The primary action is a paper label, not a coloured button.
 *
 * `bg-[var(--ink)] text-[var(--surface)]` is the whole trick: on the chocolate
 * ground it renders as cream-on-brown (10.5:1); drop the same button inside a
 * paper card and it inverts to ink-on-cream (17.8:1) without a variant, a prop, or
 * a dark-mode branch. Every surface in globals.css was checked against it and all
 * four clear AAA.
 *
 * The alternative — a terracotta fill, which is where this palette wants to go —
 * measures 2:1 against the ground. It would have needed a border to be visible at
 * all, and it is the single most over-used accent in this genre.
 */
const button = cva(
  [
    'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap',
    'font-sans font-medium select-none',
    'transition-[background-color,border-color,color,transform] duration-150 ease-[var(--ease-out-soft)]',
    'active:translate-y-px',
    'disabled:pointer-events-none disabled:opacity-45',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  ],
  {
    variants: {
      variant: {
        primary: 'bg-[var(--ink)] text-[var(--surface)] hover:bg-[var(--ink-muted)]',
        outline:
          'border border-[var(--edge)] text-[var(--ink)] hover:bg-[var(--ink)]/10 hover:border-[var(--ink)]',
        ghost: 'text-[var(--ink)] hover:bg-[var(--ink)]/10',
        // A dye fill is only ~2:1 against the ground, so the hairline is what the
        // eye reads as the button's edge. It is not decoration and must not be
        // removed. See tokens.test.ts.
        danger: 'border border-madder-300 bg-madder-500 text-paper-50 hover:bg-madder-600',
        link: [
          'text-[var(--ink)] underline decoration-[var(--edge)] decoration-1 underline-offset-4',
          'hover:decoration-[var(--ink)]',
        ],
      },
      size: {
        sm: 'h-8 rounded-xs px-3 text-sm [&_svg]:size-4',
        md: 'h-10 rounded-sm px-4 text-sm [&_svg]:size-4',
        lg: 'h-12 rounded-sm px-6 text-base [&_svg]:size-5',
        icon: 'size-10 rounded-sm [&_svg]:size-4',
      },
    },
    compoundVariants: [
      // A link has no box, so box padding and height would only misalign it.
      { variant: 'link', size: ['sm', 'md', 'lg'], class: 'h-auto rounded-none px-0' },
    ],
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export type ButtonProps = React.ComponentPropsWithoutRef<'button'> &
  VariantProps<typeof button> & {
    /** Render as the single child element — for a link that must look like a button. */
    asChild?: boolean;
  };

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Component = asChild ? Slot.Root : 'button';
  return <Component className={cn(button({ variant, size }), className)} {...props} />;
}

export { button as buttonVariants };
