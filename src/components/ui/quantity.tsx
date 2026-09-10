'use client';

import { cn } from '@/lib/cn';

/**
 * The stepper in a cart line.
 *
 * The number is an input rather than a label, because the fastest way to change 1
 * to 12 is to type it — and because a stepper that only steps makes correcting a
 * mis-tap a nine-click job. Out-of-range values are clamped on commit rather than
 * rejected on keystroke, so a half-typed number is never fought with.
 */
export function QuantityStepper({
  value,
  onValueChange,
  min = 1,
  max = 99,
  label = 'Quantity',
  className,
}: {
  value: number;
  onValueChange: (next: number) => void;
  min?: number;
  max?: number;
  label?: string;
  className?: string;
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));

  return (
    <div
      className={cn(
        'inline-flex h-9 items-center rounded-sm border border-[var(--edge)] bg-[var(--field)]',
        className,
      )}
    >
      <Step
        label={`Decrease ${label.toLowerCase()}`}
        disabled={value <= min}
        onClick={() => onValueChange(clamp(value - 1))}
      >
        <path d="M3.5 7h7" />
      </Step>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label={label}
        value={value}
        onChange={(e) => {
          const digits = e.target.value.replace(/\D/g, '');
          if (digits !== '') onValueChange(clamp(Number(digits)));
        }}
        className="tabular h-full w-9 border-x border-[var(--edge)] bg-transparent text-center text-sm text-[var(--ink)]"
      />
      <Step
        label={`Increase ${label.toLowerCase()}`}
        disabled={value >= max}
        onClick={() => onValueChange(clamp(value + 1))}
      >
        <path d="M7 3.5v7M3.5 7h7" />
      </Step>
    </div>
  );
}

function Step({
  label,
  children,
  ...props
}: React.ComponentPropsWithoutRef<'button'> & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        'grid h-full w-9 place-items-center text-[var(--ink)] transition-colors',
        'hover:bg-[var(--ink)]/10 disabled:pointer-events-none disabled:opacity-35',
      )}
      {...props}
    >
      <svg viewBox="0 0 14 14" aria-hidden className="size-3.5">
        <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          {children}
        </g>
      </svg>
    </button>
  );
}
