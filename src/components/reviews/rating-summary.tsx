import type { RatingSummary as Summary } from '@/lib/reviews/types';
import { Rating } from '@/components/ui/rating';

/**
 * The average, and how it is made up.
 *
 * The distribution is what makes an average honest: 4.2 from forty fours and 4.2 from thirty
 * fives and ten ones are different products. Each row is one sentence to a screen reader —
 * "5 stars: 8 reviews" — and the bar beside it is decoration for the eye, ink on the ground
 * rather than a coloured fill, for the same contrast reason the stars are ink (DESIGN-SYSTEM).
 */
export function RatingSummary({ summary }: { summary: Summary }) {
  const widest = Math.max(...summary.distribution.map((row) => row.count), 1);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline gap-3">
        <span className="tabular font-display text-5xl leading-none [--opsz:72] [--wght:600]">
          {summary.average.toFixed(1)}
        </span>
        <span className="flex flex-col gap-1">
          <Rating value={summary.average} />
          <span className="text-sm text-[var(--ink-muted)]">
            from {summary.count} {summary.count === 1 ? 'review' : 'reviews'}
          </span>
        </span>
      </div>

      <ul className="flex flex-col gap-1.5">
        {summary.distribution.map((row) => (
          <li key={row.rating} className="grid grid-cols-[3.5rem_1fr_2rem] items-center gap-3">
            <span className="text-xs text-[var(--ink-muted)]">
              {row.rating} {row.rating === 1 ? 'star' : 'stars'}
              <span className="sr-only">
                : {row.count} {row.count === 1 ? 'review' : 'reviews'}
              </span>
            </span>
            <span aria-hidden className="h-1.5 overflow-hidden rounded-full bg-[var(--ink)]/12">
              <span
                className="block h-full rounded-full bg-[var(--ink)]"
                style={{ width: `${(row.count / widest) * 100}%` }}
              />
            </span>
            <span aria-hidden className="tabular text-right text-xs text-[var(--ink-faint)]">
              {row.count}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
