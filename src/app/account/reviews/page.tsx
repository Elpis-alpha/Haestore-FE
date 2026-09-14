import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Rating } from '@/components/ui/rating';
import { Leaf } from '@/components/motifs/leaf';
import { ReviewDialog } from '@/components/reviews/review-dialog';
import { DeleteReview } from '@/components/reviews/delete-review';
import { getMyReviews, requireSession } from '@/lib/auth/session';

export const metadata: Metadata = { title: 'Reviews' };

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/** The byline a review will carry, computed the way the API computes it. Display only. */
function bylineFor(name: string | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'A customer';
  if (parts.length === 1) return parts[0]!;
  return `${parts[0]} ${Array.from(parts[parts.length - 1]!)[0]!.toLocaleUpperCase()}.`;
}

/**
 * Reviews, from the side of the person who writes them.
 *
 * This is where "write a review" lives. Everything offered at the top can actually be
 * reviewed — it came from an order that reached you — which is the thing a button on the
 * product page could not promise. Below it are the reviews already written, including any the
 * shop has hidden, with the shop's reason, because a review that silently disappeared from a
 * product page is the kind of thing people reasonably assume was censored for being unkind.
 *
 * `?write=<productId>` opens that product's dialog on arrival, which is how the link from a
 * delivered order lands.
 *
 * **No `loading.tsx`**, as everywhere in the account area: this page redirects when signed out.
 */
export default async function AccountReviewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ account }, { toWrite, written }, params] = await Promise.all([
    requireSession('/account/reviews'),
    getMyReviews(),
    searchParams,
  ]);
  const writeFor = typeof params.write === 'string' ? params.write : undefined;
  const byline = bylineFor(account.name);

  return (
    <div className="flex flex-col gap-12">
      <section aria-labelledby="to-review-heading" className="flex flex-col gap-4">
        <div>
          <h2 id="to-review-heading" className="font-display text-xl [--wght:600]">
            Waiting for your review
          </h2>
          <p className="mt-1 max-w-prose text-sm text-[var(--ink-muted)]">
            Things from your orders that have reached you. Reviews are published as{' '}
            <span className="text-[var(--ink)]">{byline}</span> —{' '}
            <Link href="/account" className="underline underline-offset-4">
              change your name
            </Link>{' '}
            if that is not how you want to sign.
          </p>
        </div>

        {toWrite.length === 0 ? (
          <p className="text-sm text-[var(--ink-muted)]">
            Nothing is waiting. When an order reaches you, what was in it will be here.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
            {toWrite.map((item) => (
              <li key={item.productId} className="flex items-center gap-4 py-4">
                <Thumbnail publicId={item.imagePublicId} title={item.title} slug={item.slug} />
                <div className="flex min-w-0 grow flex-col gap-1">
                  <Link href={`/product/${item.slug}`} className="font-medium hover:underline">
                    {item.title}
                  </Link>
                  <span className="text-xs text-[var(--ink-faint)]">
                    Delivered {dateFormat.format(new Date(item.deliveredAt))} ·{' '}
                    <Link
                      href={`/account/orders/${item.orderNumber}`}
                      className="underline underline-offset-4 hover:text-[var(--ink)]"
                    >
                      {item.orderNumber}
                    </Link>
                  </span>
                </div>
                <ReviewDialog
                  productId={item.productId}
                  productTitle={item.title}
                  authorName={byline}
                  defaultOpen={writeFor === item.productId}
                  triggerLabel="Write a review"
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="written-heading" className="flex flex-col gap-4">
        <h2 id="written-heading" className="font-display text-xl [--wght:600]">
          Your reviews
        </h2>

        {written.length === 0 ? (
          <p className="text-sm text-[var(--ink-muted)]">You have not written any yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
            {written.map((review) => (
              <li key={review.id} className="flex gap-4 py-5">
                <Thumbnail
                  publicId={review.product.imagePublicId}
                  title={review.product.title}
                  slug={review.product.onSale ? review.product.slug : undefined}
                />
                <article className="flex min-w-0 grow flex-col gap-2">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    {review.product.onSale ? (
                      <Link
                        href={`/product/${review.product.slug}`}
                        className="font-medium hover:underline"
                      >
                        {review.product.title}
                      </Link>
                    ) : (
                      <span className="font-medium">{review.product.title}</span>
                    )}
                    <span className="text-xs text-[var(--ink-faint)]">
                      {dateFormat.format(new Date(review.createdAt))}
                      {review.editedAt && ' · edited'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Rating value={review.rating} />
                    {review.status === 'hidden' && <Badge tone="bad">Hidden by the shop</Badge>}
                  </div>

                  {review.status === 'hidden' && review.hiddenReason && (
                    <p className="rounded-sm border border-[var(--bad)]/40 p-3 text-sm text-[var(--ink-muted)]">
                      <span className="font-medium text-[var(--ink)]">Why: </span>
                      {review.hiddenReason}
                    </p>
                  )}

                  {review.title && <p className="font-medium">{review.title}</p>}
                  {review.body && (
                    <p className="max-w-prose text-sm leading-relaxed whitespace-pre-line text-[var(--ink-muted)]">
                      {review.body}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-4">
                    {review.product.onSale && (
                      <ReviewDialog
                        productId={review.product.id}
                        productTitle={review.product.title}
                        authorName={byline}
                        existing={{
                          rating: review.rating,
                          ...(review.title ? { title: review.title } : {}),
                          ...(review.body ? { body: review.body } : {}),
                        }}
                        hidden={review.status === 'hidden'}
                        defaultOpen={writeFor === review.product.id}
                        triggerLabel="Edit"
                        triggerVariant="link"
                      />
                    )}
                    <DeleteReview
                      productId={review.product.id}
                      productTitle={review.product.title}
                    />
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Thumbnail({ publicId, title, slug }: { publicId?: string; title: string; slug?: string }) {
  const frame = (
    <span className="relative block size-16 shrink-0 overflow-hidden rounded-t-[999px] rounded-b-sm bg-[var(--groove)]">
      {publicId ? (
        <Image src={publicId} alt="" fill sizes="4rem" className="object-cover" />
      ) : (
        <span className="grid h-full place-items-center text-[var(--ink-faint)]">
          <Leaf aria-hidden className="size-5" />
        </span>
      )}
    </span>
  );
  // The title beside it is the link with a name; the picture is a second way to the same
  // place, hidden from the accessibility tree so the product is not announced twice.
  return slug ? (
    <Link href={`/product/${slug}`} aria-hidden tabIndex={-1} className="shrink-0" title={title}>
      {frame}
    </Link>
  ) : (
    frame
  );
}
