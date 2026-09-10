'use client';

import { unstable_OneTimePasswordField as OneTimePasswordField } from 'radix-ui';
import { cn } from '@/lib/cn';

/**
 * Six boxes for a six-digit code.
 *
 * A single text input would be simpler and is worse in the two places that matter:
 * the shape of the field tells you how many digits are coming before you start, and
 * a wrong digit can be corrected in place rather than by retyping the rest.
 *
 * Radix supplies the parts that are genuinely hard and always got wrong by hand —
 * pasting a whole code into the first box, Backspace stepping to the previous one,
 * arrow keys, and one hidden input so a form submission carries the value. What is
 * left here is how it looks.
 *
 * `autoSubmit` fires as soon as the last digit lands. The alternative is a Continue
 * button that is only ever pressed once, immediately, by everyone.
 */
export function CodeField({
  value,
  onValueChange,
  onComplete,
  disabled,
  invalid,
}: {
  value: string;
  onValueChange: (value: string) => void;
  onComplete: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}) {
  return (
    <OneTimePasswordField.Root
      value={value}
      onValueChange={onValueChange}
      autoSubmit
      onAutoSubmit={onComplete}
      disabled={disabled}
      /**
       * `type="text"`, not `"password"`. A sign-in code is single-use and expires in
       * ten minutes, so masking it defends nothing and costs the person the ability
       * to check what they typed against the message still open beside them.
       */
      type="text"
      validationType="numeric"
      autoFocus
      className="flex gap-1.5 sm:gap-2"
      aria-label="Six-digit code"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <OneTimePasswordField.Input
          key={index}
          className={cn(
            // Flexible rather than a fixed 48px. Six fixed boxes plus their gaps come
            // to 328px, which overflows a 375px screen inside the card's padding — the
            // page then scrolls sideways, which Phase 1 ruled out. Flexing fills
            // whatever is there and caps at the size the design wants.
            'aspect-square max-w-12 min-w-0 flex-1 rounded-sm border bg-[var(--field)] text-center',
            'font-mono text-lg text-[var(--ink)] tabular-nums',
            'transition-colors duration-150',
            'focus-visible:border-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2',
            'focus-visible:outline-[var(--focus)]',
            'disabled:cursor-not-allowed disabled:opacity-50',
            invalid
              ? 'border-[var(--bad)]'
              : 'border-[var(--edge)] hover:border-[var(--ink-muted)]',
          )}
        />
      ))}
      {/* Carries the value if this is ever submitted as a plain form. Radix sets
          autocomplete="one-time-code" itself — the prop is not accepted here, and
          that is the right call: it is the one value that makes iOS offer the code
          from the notification. */}
      <OneTimePasswordField.HiddenInput name="code" />
    </OneTimePasswordField.Root>
  );
}
