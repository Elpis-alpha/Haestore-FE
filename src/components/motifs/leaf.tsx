import { cn } from '@/lib/cn';

/**
 * The leaf that terminates the H's crossbar: a pointed almond with a single vein.
 *
 * It has one job in the interface — it means *growing, alive, in stock* — and it
 * is the empty-state mark. It is not a bullet and not a decoration.
 */
export function Leaf({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn('h-4 w-4', className)}
      {...props}
    >
      <path d="M20.5 3.5C12.6 5 6.6 10 5.6 18.4c8.2-.5 14-6.4 14.9-14.9Z" fill="currentColor" />
      <path
        d="M19.4 4.6C14.2 8 9.4 12.6 6.4 18.6"
        stroke="var(--surface, #523523)"
        strokeWidth="1.1"
        strokeLinecap="round"
      />
    </svg>
  );
}
