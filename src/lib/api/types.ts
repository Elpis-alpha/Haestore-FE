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

/** The shape of the degraded listing endpoint's response, cursor page included. */
export type ProductListResponse =
  paths['/api/catalog/products']['get']['responses'][200]['content']['application/json'];
