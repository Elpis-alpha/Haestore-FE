import type { components, paths } from '@/lib/api/schema';

/**
 * Reviews' shapes, from the generated contract. Nothing here is described twice; see
 * lib/cart/types.ts for the defect that rule exists because of.
 */

export type PublicReview = components['schemas']['PublicReview'];
export type RatingSummary = components['schemas']['RatingSummary'];
export type MyReview = components['schemas']['MyReview'];
export type ReviewableItem = components['schemas']['ReviewableItem'];

export type ReviewPage =
  paths['/api/catalog/products/{slug}/reviews']['get']['responses'][200]['content']['application/json'];

export type MyReviews =
  paths['/api/reviews/mine']['get']['responses'][200]['content']['application/json']['data'];

export type ReviewSort = NonNullable<
  NonNullable<paths['/api/catalog/products/{slug}/reviews']['get']['parameters']['query']>['sort']
>;

export const REVIEW_SORT_LABELS: Record<ReviewSort, string> = {
  newest: 'Newest first',
  highest: 'Highest rated',
  lowest: 'Lowest rated',
};
