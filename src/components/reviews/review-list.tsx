'use client';

import { useRef, useState } from 'react';
import type { PublicReview, ReviewPage, ReviewSort } from '@/lib/reviews/types';
import { REVIEW_SORT_LABELS } from '@/lib/reviews/types';
import { fetchReviewPage } from '@/lib/reviews/client';
import { describePurchased, type AxisLabelMap } from '@/lib/catalog/labels';
import { Button } from '@/components/ui/button';
import { Rating } from '@/components/ui/rating';
import { cn } from '@/lib/cn';

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/**
 * The reviews themselves, sortable and with more on request.
 *
 * The first page arrives rendered with the product page, so the reviews are in the HTML a
 * crawler and a slow connection both receive. Sorting and "more" are the only client work,
 * and they fetch rather than navigate: the product page is cached per URL, and a `?sort=`
 * parameter would make every sort order a separate page to cache and to index.
 *
 * A sort replaces the list; "more" appends to it. The status line under the list is a live
 * region, so a screen reader hears "Showing 24 of 40" when the list grows rather than nothing.
 */
export function ReviewList({
  slug,
  initial,
  labels,
}: {
  slug: string;
  initial: ReviewPage;
  labels: AxisLabelMap;
}) {
  const [reviews, setReviews] = useState<PublicReview[]>(initial.data);
  const [sort, setSort] = useState<ReviewSort>('newest');
  const [page, setPage] = useState(initial.page.page);
  const [totalPages, setTotalPages] = useState(initial.page.totalPages);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A slow response for an old sort must not overwrite the list for a newer one.
  const latest = useRef(0);

  const total = initial.summary.count;

  async function load(nextSort: ReviewSort, nextPage: number, append: boolean) {
    const request = ++latest.current;
    setPending(true);
    setError(null);
    try {
      const result = await fetchReviewPage(slug, nextSort, nextPage);
      if (request !== latest.current) return;
      setReviews((current) => (append ? [...current, ...result.data] : result.data));
      setPage(result.page.page);
      setTotalPages(result.page.totalPages);
    } catch (err) {
      if (request === latest.current) {
        setError(err instanceof Error ? err.message : 'The reviews did not load.');
      }
    } finally {
      if (request === latest.current) setPending(false);
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-6">
      {total > 1 && (
        <div role="group" aria-label="Sort reviews" className="flex flex-wrap gap-1">
          {(Object.keys(REVIEW_SORT_LABELS) as ReviewSort[]).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={sort === key}
              disabled={pending && sort === key}
              onClick={() => {
                if (sort === key) return;
                setSort(key);
                void load(key, 1, false);
              }}
              className={cn(
                'rounded-sm px-3 py-1.5 text-sm transition-colors',
                sort === key
                  ? 'bg-[var(--ink)] text-[var(--surface)]'
                  : 'text-[var(--ink-muted)] hover:bg-[var(--ink)]/8 hover:text-[var(--ink)]',
              )}
            >
              {REVIEW_SORT_LABELS[key]}
            </button>
          ))}
        </div>
      )}

      <ol
        aria-busy={pending}
        className={cn(
          'flex flex-col divide-y divide-[var(--rule)] transition-opacity',
          pending && 'opacity-60',
        )}
      >
        {reviews.map((review) => (
          <li key={review.id} className="py-5 first:pt-0">
            <ReviewEntry review={review} labels={labels} />
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p role="status" className="text-xs text-[var(--ink-faint)]">
          Showing {reviews.length} of {total}
        </p>
        {page < totalPages && (
          <Button
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => void load(sort, page + 1, true)}
          >
            {pending ? 'Loading…' : 'More reviews'}
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-[var(--bad)]">
          {error}
        </p>
      )}
    </div>
  );
}

function ReviewEntry({ review, labels }: { review: PublicReview; labels: AxisLabelMap }) {
  const bought = describePurchased(review.purchased, labels);

  return (
    <article className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Rating value={review.rating} />
        {review.title && (
          <h3 className="font-display text-base leading-snug [--opsz:18] [--wght:600]">
            {review.title}
          </h3>
        )}
      </div>

      {review.body && (
        <p className="max-w-prose text-sm leading-relaxed whitespace-pre-line text-[var(--ink)]">
          {review.body}
        </p>
      )}

      <p className="text-xs text-[var(--ink-faint)]">
        <span className="text-[var(--ink-muted)]">{review.authorName}</span>
        {' · '}
        <time dateTime={review.createdAt}>{dateFormat.format(new Date(review.createdAt))}</time>
        {review.editedAt && ' · edited'}
        {bought && ` · bought ${bought}`}
      </p>
    </article>
  );
}
