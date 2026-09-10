import { cn } from '@/lib/cn';

/**
 * The bag handle, drawn as the logo draws it: a stroke, not a filled dome.
 *
 * Getting this wrong is the easy mistake — a solid arch shape reads as a tombstone
 * and loses the thing that makes the mark feel like a shop. Use it above a section
 * heading, the way the handle sits above the H.
 */
export function Arch({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 100 68"
      fill="none"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMax meet"
      className={cn('h-7 w-11', className)}
      {...props}
    >
      <path
        d="M5 68C5 30 23 4 50 4s45 26 45 64"
        stroke="currentColor"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * A frame with a half-round top — the shape of a shop doorway, and of the handle
 * read as an opening rather than a line. The product image lives in one of these.
 *
 * 999px on the top corners clamps to half the box width, so the arch stays a true
 * half-round at any size rather than a radius that has to be re-guessed per
 * breakpoint.
 */
export function ArchFrame({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('overflow-hidden rounded-t-[999px] rounded-b-md', className)} {...props}>
      {children}
    </div>
  );
}
