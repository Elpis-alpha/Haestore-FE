import Link from 'next/link';
import type { ReviewPage } from '@/lib/reviews/types';
import type { AxisLabelMap } from '@/lib/catalog/labels';
import { VineRule } from '@/components/motifs/rule';
import { RatingSummary } from './rating-summary';
import { ReviewList } from './review-list';

/**
 * What people who bought it say.
 *
 * **There is no "Write a review" button here**, and that is the point rather than an
 * oversight. This page is cached and does not know who is looking at it, and nearly everyone
 * who looks cannot review it — only somebody whose order of it was delivered can. A button
 * shown to all of them that then tells almost all of them "you can't" is the disabled-control
 * mistake this shop keeps declining to make. The way in is the sentence at the bottom, which
 * says who can, and goes to the one page where every item offered can actually be reviewed.
 */
export function ProductReviews({
  slug,
  reviews,
  labels,
}: {
  slug: string;
  reviews: ReviewPage;
  labels: AxisLabelMap;
}) {
  const { summary } = reviews;

  return (
    <section aria-labelledby="reviews-heading" className="mt-20">
      <VineRule />
      <h2 id="reviews-heading" className="mt-3 font-display text-2xl [--opsz:36] [--wght:600]">
        From people who bought it
      </h2>

      {summary.count === 0 ? (
        <p className="mt-4 text-sm text-[var(--ink-muted)]">Nobody has reviewed this yet.</p>
      ) : (
        <div className="mt-8 grid gap-10 md:grid-cols-[15rem_minmax(0,1fr)] md:gap-14">
          <RatingSummary summary={summary} />
          <ReviewList slug={slug} initial={reviews} labels={labels} />
        </div>
      )}

      <p className="mt-8 max-w-prose text-xs text-[var(--ink-faint)]">
        Every review here comes from an order that reached the person who wrote it. Bought this
        yourself?{' '}
        <Link
          href="/account/reviews"
          className="text-[var(--ink-muted)] underline decoration-[var(--rule)] underline-offset-4 hover:text-[var(--ink)]"
        >
          Review it from your account
        </Link>
        .
      </p>
    </section>
  );
}
