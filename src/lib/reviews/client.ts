import { RequestError, send } from '@/lib/api/send';
import type { MyReview, ReviewPage, ReviewSort } from './types';

/**
 * Reviews, from the browser.
 *
 * Writing goes through the session, so it uses `send`. Reading a product's reviews is public
 * and returns a list with its summary and page rather than a `data` envelope alone, so it is a
 * plain fetch — still through the `/api/*` rewrite, so the page never names the API's host.
 */

export type ReviewInput = { rating: number; title?: string; body?: string };

export const saveReview = (productId: string, input: ReviewInput) =>
  send<{ review: MyReview }>(`/api/reviews/products/${productId}`, { method: 'PUT', body: input });

export const deleteReview = (productId: string) =>
  send<void>(`/api/reviews/products/${productId}`, { method: 'DELETE' });

export async function fetchReviewPage(
  slug: string,
  sort: ReviewSort,
  page: number,
): Promise<ReviewPage> {
  const search = new URLSearchParams({ sort, page: String(page) });
  const response = await fetch(
    `/api/catalog/products/${encodeURIComponent(slug)}/reviews?${search}`,
    { headers: { accept: 'application/json' } },
  ).catch(() => null);

  if (!response?.ok) {
    throw new RequestError(
      response?.status ?? 0,
      'UPSTREAM_ERROR',
      'The reviews did not load. Try again in a moment.',
    );
  }
  return (await response.json()) as ReviewPage;
}
