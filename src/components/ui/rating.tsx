import { cn } from '@/lib/cn';

/**
 * Ink, not gold.
 *
 * A gold star on cream measures 1.8:1 — it is decoration that happens to be shaped
 * like information. Filled and outlined ink glyphs carry the same meaning at 17.8:1
 * and look like a letterpress catalogue rather than every other shop.
 *
 * Half stars are rendered with a clip rather than a third glyph, so 4.3 does not
 * silently round to 4.
 */
export function Rating({
  value,
  count,
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { value: number; count?: number }) {
  const clamped = Math.min(5, Math.max(0, value));
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)} {...props}>
      <span aria-hidden className="relative inline-flex text-[var(--ink)]">
        <span className="inline-flex gap-0.5 text-[var(--ink-faint)]">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} />
          ))}
        </span>
        <span
          className="absolute inset-0 inline-flex gap-0.5 overflow-hidden"
          style={{ width: `${(clamped / 5) * 100}%` }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} filled />
          ))}
        </span>
      </span>
      <span className="sr-only">
        {clamped.toFixed(1)} out of 5{count !== undefined ? `, ${count} reviews` : ''}
      </span>
      {count !== undefined && (
        <span aria-hidden className="tabular text-xs text-[var(--ink-faint)]">
          ({count})
        </span>
      )}
    </span>
  );
}

function Star({ filled }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 16 16" className="size-3.5 shrink-0" aria-hidden>
      <path
        d="M8 1.6l1.9 4 4.3.6-3.1 3 .7 4.3L8 11.5l-3.8 2 .7-4.3-3.1-3 4.3-.6z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
