import type { components, paths } from './schema';

/**
 * Convenience aliases over the generated contract.
 *
 * `schema.d.ts` is generated from the backend's OpenAPI document by
 * `npm run sync:types` at the repo root and committed; CI regenerates it and fails if
 * it differs. Nothing in the frontend should hand-write a shape the API returns — if a
 * type is missing here, the fix is in the backend's Zod schema, not in this file.
 */

export type Category = components['schemas']['Category'];
export type CategoryFilter = components['schemas']['CategoryFilter'];
export type EffectiveAttribute = components['schemas']['EffectiveAttribute'];
export type Money = components['schemas']['Money'];
export type Product = components['schemas']['Product'];
export type ProductCard = components['schemas']['ProductCard'];
export type ProductAttribute = components['schemas']['ProductAttribute'];
export type Variant = components['schemas']['Variant'];
export type ApiError = components['schemas']['Error'];
export type User = components['schemas']['User'];
export type Device = components['schemas']['Device'];

/**
 * The `GET /api/auth/me` body, taken from the document rather than described again.
 *
 * Writing this shape out by hand is how the account page first shipped reading
 * `data.account` from a response whose field is `data.user`: it typechecked, because
 * the type was the guess. Deriving it means a rename on the backend is a compile error
 * here, which is the entire argument of ADR-001.
 */
export type MeResponse =
  paths['/api/auth/me']['get']['responses'][200]['content']['application/json'];

/**
 * The generated filter panel.
 *
 * Nothing in this repo names a roast level or a glaze: a `Facet` describes a control the
 * backend derived from an attribute an admin defined, and the storefront renders it from
 * `filterUi` alone. `values[].count` is already disjunctive — see the backend's
 * search/facets.ts — so a value with count 0 should be rendered disabled, not hidden.
 */
export type Facet = components['schemas']['Facet'];
export type FacetValue = components['schemas']['FacetValue'];
export type ListingCard = components['schemas']['ListingCard'];

/**
 * The storefront listing.
 *
 * `page.degraded` says MongoDB answered instead of Meilisearch: `facets` is null and no
 * attribute filter was applied, so the panel should be hidden rather than shown inert.
 * `ignoredFilters` names anything that was dropped and why — a filter whose attribute
 * has since been archived, or one this category never bound.
 */
export type ProductListResponse =
  paths['/api/catalog/products']['get']['responses'][200]['content']['application/json'];
