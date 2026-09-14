import type { Metadata } from 'next';
import Link from 'next/link';
import { adminRead, queryOf } from '@/lib/admin/server';
import type { AdminReview, Paged } from '@/lib/admin/types';
import { formatDate, formatDateTime } from '@/lib/admin/format';
import { Badge } from '@/components/ui/badge';
import { Rating } from '@/components/ui/rating';
import { Empty, FilterLinks, PageHeader, Pager } from '@/components/admin/ledger';
import { ReviewModeration } from '@/components/admin/review-moderation';

export const metadata: Metadata = { title: 'Reviews' };

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const QUEUES = [
  { value: undefined, label: 'To read' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'all', label: 'All' },
] as const;

/**
 * Reviews, from behind the counter.
 *
 * **Reading comes after publishing, not before.** A review is on its product page the moment
 * it is written, because every one comes from an order that reached the person writing it —
 * the spam defence is the purchase, not a queue — and a shop that approves reviews before
 * anybody can read them is choosing its own average. This page is where somebody in the shop
 * reads them afterwards, oldest first, and takes down what does not belong on a shop's page.
 *
 * Written as a list of paper slips rather than a table: a review is text, and a table cell is
 * the wrong measure for somebody's paragraph.
 */
export default async function AdminReviewsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const queue = typeof params.queue === 'string' ? params.queue : undefined;

  const { data: reviews, page } = await adminRead<Paged<AdminReview>>(
    `/api/admin/reviews${queryOf(params, ['queue', 'page'])}`,
    '/admin/reviews',
  );

  return (
    <>
      <PageHeader
        title="Reviews"
        description="Every review comes from an order that reached the person who wrote it, and is on the product page as soon as it is written. Hide what does not belong on a shop’s page — not what is unflattering."
        actions={
          <FilterLinks
            items={QUEUES.map((entry) => ({
              href: entry.value ? `/admin/reviews?queue=${entry.value}` : '/admin/reviews',
              label: entry.label,
              active: (queue ?? undefined) === entry.value || (!queue && !entry.value),
            }))}
          />
        }
      />

      {reviews.length === 0 ? (
        <Empty>
          {queue === 'hidden'
            ? 'Nothing is hidden.'
            : queue === 'all'
              ? 'Nobody has reviewed anything yet. Reviews arrive once orders are delivered.'
              : 'Every review has been read.'}
        </Empty>
      ) : (
        <ul className="flex flex-col gap-4">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="surface-paper flex flex-col gap-3 rounded-md border border-[var(--edge)] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
                <div className="flex min-w-0 flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <Rating value={review.rating} />
                    {review.needsReview && <Badge tone="note">Not read yet</Badge>}
                    {review.status === 'hidden' && <Badge tone="bad">Hidden</Badge>}
                    {review.editedAt && <Badge tone="neutral">Edited</Badge>}
                  </span>
                  <span className="text-sm text-[var(--ink-muted)]">
                    On{' '}
                    {review.product.onSale ? (
                      <Link
                        href={`/product/${review.product.slug}`}
                        className="font-medium text-[var(--ink)] hover:underline"
                      >
                        {review.product.title}
                      </Link>
                    ) : (
                      <span className="font-medium text-[var(--ink)]">{review.product.title}</span>
                    )}
                  </span>
                </div>
                <ReviewModeration
                  reviewId={review.id}
                  status={review.status}
                  needsReview={review.needsReview}
                  productTitle={review.product.title}
                />
              </div>

              {review.title && (
                <p className="font-display text-base [--wght:600]">{review.title}</p>
              )}
              {review.body ? (
                <p className="max-w-prose text-sm leading-relaxed whitespace-pre-line">
                  {review.body}
                </p>
              ) : (
                <p className="text-sm text-[var(--ink-faint)]">A rating with no words.</p>
              )}

              {review.moderation && (
                <p className="rounded-sm border border-[var(--bad)]/40 p-3 text-sm text-[var(--ink-muted)]">
                  Hidden by {review.moderation.byEmail ?? 'an admin'},{' '}
                  {formatDateTime(review.moderation.at)}:{' '}
                  <span className="text-[var(--ink)]">{review.moderation.note}</span>
                </p>
              )}

              <p className="text-xs text-[var(--ink-faint)]">
                Signed <span className="text-[var(--ink-muted)]">{review.authorName}</span> ·{' '}
                <Link
                  href={`/admin/customers/${review.customer.id}`}
                  className="underline decoration-[var(--rule)] underline-offset-4 hover:text-[var(--ink)]"
                >
                  {review.customer.email ?? 'their account'}
                </Link>
                {review.order.orderNumber && (
                  <>
                    {' · bought in '}
                    <Link
                      href={`/admin/orders/${review.order.id}`}
                      className="underline decoration-[var(--rule)] underline-offset-4 hover:text-[var(--ink)]"
                    >
                      {review.order.orderNumber}
                    </Link>
                  </>
                )}{' '}
                · written {formatDate(review.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <Pager
        page={page.page}
        totalPages={page.totalPages}
        total={page.total}
        basePath="/admin/reviews"
        params={{ queue }}
      />
    </>
  );
}
