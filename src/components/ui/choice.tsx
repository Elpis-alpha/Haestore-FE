'use client';

import { Checkbox, RadioGroup, Switch } from 'radix-ui';
import { cn } from '@/lib/cn';

/**
 * Checkbox, radio and switch.
 *
 * The checkbox carries more weight here than usual: the storefront's whole filter
 * panel is built from it, generated from whatever attributes an admin has defined.
 * So it has a real indeterminate state, a comfortable 40px hit area via the label
 * wrapper, and a count slot — because "Medium roast (14)" is one control, not a
 * control with text glued beside it.
 */

const box = [
  'peer grid size-[1.125rem] shrink-0 place-items-center rounded-xs',
  'border border-[var(--edge)] bg-[var(--field)]',
  'transition-colors duration-150',
  'hover:border-[var(--ink-muted)]',
  'data-[state=checked]:border-[var(--ink)] data-[state=checked]:bg-[var(--ink)]',
  'data-[state=indeterminate]:border-[var(--ink)] data-[state=indeterminate]:bg-[var(--ink)]',
  'disabled:cursor-not-allowed disabled:opacity-45',
];

export function CheckBox({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Checkbox.Root>) {
  return (
    <Checkbox.Root className={cn(box, className)} {...props}>
      <Checkbox.Indicator className="text-[var(--surface)]">
        {props.checked === 'indeterminate' ? (
          <span aria-hidden className="block h-0.5 w-2.5 rounded-full bg-current" />
        ) : (
          <svg viewBox="0 0 12 12" className="size-3" aria-hidden>
            <path
              d="M2.5 6.2 4.8 8.6 9.5 3.4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </Checkbox.Indicator>
    </Checkbox.Root>
  );
}

/**
 * A checkbox with its label and an optional count, as one clickable row.
 * `<label>` wrapping the control means the whole row is the hit target without any
 * htmlFor/id bookkeeping.
 */
export function CheckRow({
  label,
  count,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Checkbox.Root> & {
  label: React.ReactNode;
  count?: number;
}) {
  return (
    <label
      className={cn(
        'group flex cursor-pointer items-center gap-2.5 rounded-sm py-1.5 pr-2 pl-1',
        'text-sm text-[var(--ink)] transition-colors hover:bg-[var(--ink)]/6',
        'has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-45',
        className,
      )}
    >
      <CheckBox {...props} />
      <span className="grow">{label}</span>
      {count !== undefined && (
        <span className="tabular text-xs text-[var(--ink-faint)]">{count}</span>
      )}
    </label>
  );
}

export function Radio({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadioGroup.Item>) {
  return (
    <RadioGroup.Item
      className={cn(box, 'rounded-full data-[state=checked]:bg-transparent', className)}
      {...props}
    >
      <RadioGroup.Indicator className="block size-2.5 rounded-full bg-[var(--ink)]" />
    </RadioGroup.Item>
  );
}

export function RadioRow({
  label,
  hint,
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadioGroup.Item> & {
  label: React.ReactNode;
  hint?: React.ReactNode;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-start gap-2.5 rounded-sm p-1.5',
        'text-sm text-[var(--ink)] transition-colors hover:bg-[var(--ink)]/6',
        className,
      )}
    >
      <Radio {...props} className="mt-0.5" />
      <span className="flex flex-col gap-0.5">
        <span>{label}</span>
        {hint && <span className="text-xs text-[var(--ink-faint)]">{hint}</span>}
      </span>
    </label>
  );
}

export const RadioSet = RadioGroup.Root;

/**
 * A switch is for a setting that applies the moment it moves. Anything that needs
 * a Save button is a checkbox.
 */
export function Toggle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof Switch.Root>) {
  return (
    <Switch.Root
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full border border-[var(--edge)] bg-[var(--field)]',
        'transition-colors duration-200 ease-[var(--ease-out-soft)]',
        'data-[state=checked]:border-[var(--ink)] data-[state=checked]:bg-[var(--ink)]',
        'disabled:cursor-not-allowed disabled:opacity-45',
        className,
      )}
      {...props}
    >
      <Switch.Thumb
        className={cn(
          'block size-4 translate-x-1 rounded-full bg-[var(--ink)]',
          'transition-transform duration-200 ease-[var(--ease-out-soft)]',
          'data-[state=checked]:translate-x-[1.375rem] data-[state=checked]:bg-[var(--surface)]',
        )}
      />
    </Switch.Root>
  );
}
