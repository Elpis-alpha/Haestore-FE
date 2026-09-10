import { cn } from '@/lib/cn';

/**
 * A doorway drawn around its contents.
 *
 * The logo's arch is a bag handle; read at page scale it is the opening you walk
 * through, and this is that reading. One path draws both jambs and the head, so the
 * corners always meet — two verticals plus a separate arc drift apart by a subpixel at
 * some widths and it looks like a mistake rather than a shape.
 *
 * `preserveAspectRatio="none"` lets the arch flatten as the column widens, which is what
 * a wide opening actually looks like, and `vector-effect: non-scaling-stroke` keeps the
 * line a hairline while that happens. Stretching the stroke with the shape is the usual
 * way this goes wrong: the head ends up three times heavier than the jambs.
 */
export function Doorway({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('relative', className)}>
      <svg
        aria-hidden
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="absolute inset-0 h-full w-full text-[var(--rule)]"
      >
        <path
          d="M0.5 100 L0.5 34 Q0.5 1.5 50 1.5 Q99.5 1.5 99.5 34 L99.5 100"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="relative">{children}</div>
    </div>
  );
}
