/**
 * Listing URL state, and the one function that decides what a listing URL looks like.
 *
 * Every filter control in the storefront changes the URL and nothing else. There is no
 * second copy of "what is currently filtered" in React state, which is what makes Back,
 * Forward, refresh, bookmarking and sharing all work without being implemented.
 *
 * That only holds if a given set of choices has exactly *one* spelling. Two shoppers
 * ticking the same two boxes in opposite orders must produce byte-identical URLs, or
 * the CDN caches the same page twice and a search engine indexes it twice. So the
 * canonical form is defined here, the shop route redirects anything non-canonical to
 * it, and `canonicalise` is idempotent — asserted in params.test.ts, because a
 * canonicaliser that is not idempotent turns that redirect into a loop.
 *
 * The wire format is the backend's, not ours: values within one attribute are
 * comma-joined (`?roast=medium,dark`), ranges are `min-max` with either end omittable,
 * and any parameter this file does not reserve is an attribute filter whose key nothing
 * in this repo knows. See back-end/src/search/filter-expression.ts.
 */

/** Mirrors SORT_KEYS in back-end/src/search/search.service.ts. */
export const SORT_KEYS = [
  'relevance',
  'newest',
  'oldest',
  'price_asc',
  'price_desc',
  'rating',
] as const;

export type SortKey = (typeof SORT_KEYS)[number];

export const SORT_LABELS: Record<SortKey, string> = {
  relevance: 'Best match',
  newest: 'Newest',
  oldest: 'Oldest',
  price_asc: 'Price, low to high',
  price_desc: 'Price, high to low',
  rating: 'Best rated',
};

/** Kept in step with RESERVED_PARAMS in back-end/src/modules/catalog/catalog.routes.ts. */
const RESERVED = new Set([
  'q',
  'category',
  'sort',
  'page',
  'per_page',
  'price',
  'in_stock',
  'view',
]);

export const DEFAULT_PAGE_SIZE = 24;
export const MAX_PAGE_SIZE = 60;
/** Meilisearch's `maxTotalHits`; the Mongo fallback honours the same bound. */
export const MAX_TOTAL_HITS = 1000;

export type ListingParams = {
  q: string;
  /** Null means "whatever the server defaults to", which is what keeps it out of the URL. */
  sort: SortKey | null;
  page: number;
  perPage: number;
  inStock: boolean;
  /** Minor units, as the API takes them. */
  price: string | null;
  /**
   * Attribute filters, keyed by an attribute key this codebase never names.
   *
   * A range control stores exactly one member (`'250-1000'`); a value control stores
   * one per ticked box. Both serialise the same way, which is why they share a shape.
   */
  attributes: Record<string, string[]>;
};

export const EMPTY_PARAMS: ListingParams = {
  q: '',
  sort: null,
  page: 1,
  perPage: DEFAULT_PAGE_SIZE,
  inStock: false,
  price: null,
  attributes: {},
};

export type RawSearchParams = Record<string, string | string[] | undefined>;

function first(raw: string | string[] | undefined): string {
  if (Array.isArray(raw)) return raw[0] ?? '';
  return raw ?? '';
}

/**
 * `?roast=medium,dark` and `?roast=medium&roast=dark` are the same filter, so both
 * flatten to the same list before anything else looks at it.
 */
function valueList(raw: string | string[] | undefined): string[] {
  const parts = Array.isArray(raw) ? raw : [raw ?? ''];
  return parts
    .flatMap((p) => String(p).split(','))
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * Sorts values within one attribute.
 *
 * Numbers compare as numbers so a weight filter reads `250,500,1000` rather than
 * `1000,250,500`. Determinism is the requirement — the server treats the list as a set —
 * and a URL a person can read is the reason to spend a comparator on it.
 */
function compareValues(a: string, b: string): number {
  const na = Number(a);
  const nb = Number(b);
  if (Number.isFinite(na) && Number.isFinite(nb) && a.trim() !== '' && b.trim() !== '') {
    return na - nb || a.localeCompare(b);
  }
  return a.localeCompare(b);
}

function uniqueSorted(values: string[]): string[] {
  return [...new Set(values)].sort(compareValues);
}

export type Range = { min: number | null; max: number | null };

/** `250-1000`, `250-`, `-1000`, or a bare `250` meaning a range of one. */
export function parseRange(raw: string | null | undefined): Range | null {
  if (!raw) return null;
  const text = raw.trim();
  const match = /^(-?\d+(?:\.\d+)?)?\s*(?:\.\.|-)\s*(-?\d+(?:\.\d+)?)?$/.exec(text);
  if (!match) {
    const single = Number(text);
    if (text !== '' && Number.isFinite(single)) return { min: single, max: single };
    return null;
  }
  const min = match[1] === undefined ? null : Number(match[1]);
  const max = match[2] === undefined ? null : Number(match[2]);
  if (min === null && max === null) return null;
  if (min !== null && !Number.isFinite(min)) return null;
  if (max !== null && !Number.isFinite(max)) return null;
  // Swapped bounds are a typo, not an empty result set. The backend takes the same view.
  if (min !== null && max !== null && min > max) return { min: max, max: min };
  return { min, max };
}

export function formatRange(range: Range | null): string | null {
  if (!range) return null;
  if (range.min === null && range.max === null) return null;
  return `${range.min ?? ''}-${range.max ?? ''}`;
}

function clampInt(value: string, min: number, max: number, fallback: number): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(n)));
}

/**
 * Reads the URL into the shape the page works with.
 *
 * Nothing here rejects: an unparseable page number becomes 1 and an unknown sort key
 * becomes the default, because this runs on a URL somebody may have typed or bookmarked
 * years ago. Filters naming attributes that no longer exist are carried through
 * untouched — the API reports them back in `ignoredFilters` and the storefront says so,
 * which it can only do if they reach the API in the first place.
 */
export function parseListingParams(raw: RawSearchParams): ListingParams {
  const sortRaw = first(raw.sort) as SortKey;
  const attributes: Record<string, string[]> = {};

  for (const [key, value] of Object.entries(raw)) {
    if (RESERVED.has(key) || value === undefined) continue;
    const values = uniqueSorted(valueList(value));
    if (values.length > 0) attributes[key] = values;
  }

  return {
    q: first(raw.q).trim().replace(/\s+/g, ' ').slice(0, 200),
    sort: SORT_KEYS.includes(sortRaw) ? sortRaw : null,
    page: clampInt(first(raw.page), 1, 1000, 1),
    perPage: clampInt(
      first(raw.per_page) || String(DEFAULT_PAGE_SIZE),
      1,
      MAX_PAGE_SIZE,
      DEFAULT_PAGE_SIZE,
    ),
    // Only the literal the canonical form emits counts as on, so `?in_stock=0` reads
    // as off rather than as the truthiness of a non-empty string.
    inStock: first(raw.in_stock) === 'true',
    price: formatRange(parseRange(first(raw.price))),
    attributes,
  };
}

/**
 * The sort the server applies when the URL does not name one.
 *
 * Relevance is only meaningful with a query, so an unsearched listing defaults to
 * newest. Knowing this is what lets `?sort=newest` be dropped from a browse URL and
 * kept on a search URL, instead of always emitting it or never emitting it.
 */
export function defaultSort(q: string): SortKey {
  return q ? 'relevance' : 'newest';
}

export function effectiveSort(params: ListingParams): SortKey {
  return params.sort ?? defaultSort(params.q);
}

/**
 * The canonical query string, including the leading `?`, or `''` when every value is a
 * default.
 *
 * Two rules, and they are the whole point of the file: keys are emitted in sorted order
 * and values within a key are emitted in sorted order, so the spelling depends on what
 * was chosen and never on the order it was clicked. Defaults are dropped rather than
 * spelled out, so the shop's own front page is `/shop` and not
 * `/shop?in_stock=false&page=1&per_page=24&sort=newest`.
 */
export function canonicalQuery(params: ListingParams): string {
  const entries: [string, string][] = [];

  if (params.q) entries.push(['q', params.q]);
  if (params.sort && params.sort !== defaultSort(params.q)) entries.push(['sort', params.sort]);
  if (params.page > 1) entries.push(['page', String(params.page)]);
  if (params.perPage !== DEFAULT_PAGE_SIZE) entries.push(['per_page', String(params.perPage)]);
  if (params.inStock) entries.push(['in_stock', 'true']);
  if (params.price) entries.push(['price', params.price]);

  for (const [key, values] of Object.entries(params.attributes)) {
    const list = uniqueSorted(values);
    if (list.length > 0) entries.push([key, list.join(',')]);
  }

  entries.sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) return '';

  // URLSearchParams percent-encodes the comma that joins a value list. It is a legal
  // sub-delimiter in a query and the backend splits on the literal, so it is written
  // back out — a URL a shopper might read should not say %2C.
  const search = new URLSearchParams(entries).toString().replace(/%2C/g, ',');
  return `?${search}`;
}

/** The canonical spelling of a raw query string, for comparison against the incoming one. */
export function canonicalise(raw: RawSearchParams): string {
  return canonicalQuery(parseListingParams(raw));
}

/**
 * The incoming query, re-spelled with the encoder `canonicalQuery` uses — no reordering,
 * no defaults dropped, only the encoding made comparable.
 *
 * `src/middleware.ts` compares this against the canonical form to decide whether to
 * redirect, and it must be *this* rather than the request's own query string. Comparing
 * against `NextURL.search` redirects forever: NextURL normalises to the URL spec's
 * encoding, where a comma is `%2C`, while `URLSearchParams.toString()` writes form
 * encoding, where it is not — so a literal-comma URL is redirected to a literal-comma URL
 * until the browser gives up. The encoders also disagree about `/` `:` `@` `!` `~`, so
 * this is not one character to special-case.
 *
 * Putting both sides through one encoder makes termination structural: `respell` of a
 * canonical query is that same query, which params.test.ts asserts.
 */
export function respell(raw: RawSearchParams): string {
  const entries: [string, string][] = [];
  for (const [key, value] of Object.entries(raw)) {
    if (value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value]) entries.push([key, item]);
  }
  if (entries.length === 0) return '';
  return `?${new URLSearchParams(entries).toString().replace(/%2C/g, ',')}`;
}

export function listingHref(basePath: string, params: ListingParams): string {
  return `${basePath}${canonicalQuery(params)}`;
}

/**
 * Every filter change returns to page 1.
 *
 * Narrowing from page 7 of an unfiltered listing to page 7 of a three-result one is an
 * empty page, and the shopper reads that as "no matches" rather than as "wrong page".
 * Putting it in the one constructor every mutation goes through means no control has to
 * remember it.
 */
function refine(params: ListingParams, patch: Partial<ListingParams>): ListingParams {
  return { ...params, ...patch, page: 1 };
}

/** Ticks or unticks one value of a multi-value control. */
export function toggleFacetValue(params: ListingParams, key: string, value: string): ListingParams {
  const current = params.attributes[key] ?? [];
  const next = current.includes(value)
    ? current.filter((v) => v !== value)
    : uniqueSorted([...current, value]);
  return refine(params, { attributes: withKey(params.attributes, key, next) });
}

/** Replaces a control's whole selection — a single-select, or a range. */
export function setFacetValues(
  params: ListingParams,
  key: string,
  values: string[],
): ListingParams {
  return refine(params, {
    attributes: withKey(params.attributes, key, uniqueSorted(values.filter(Boolean))),
  });
}

export function setFacetRange(
  params: ListingParams,
  key: string,
  range: Range | null,
): ListingParams {
  const formatted = formatRange(range);
  return setFacetValues(params, key, formatted ? [formatted] : []);
}

export function setPrice(params: ListingParams, range: Range | null): ListingParams {
  return refine(params, { price: formatRange(range) });
}

export function setInStock(params: ListingParams, inStock: boolean): ListingParams {
  return refine(params, { inStock });
}

export function setQuery(params: ListingParams, q: string): ListingParams {
  return refine(params, { q: q.trim().replace(/\s+/g, ' ').slice(0, 200) });
}

/** Sort is not a filter: it reorders the same result set, so it does not reset the page. */
export function setSort(params: ListingParams, sort: SortKey): ListingParams {
  return { ...params, sort };
}

export function setPage(params: ListingParams, page: number): ListingParams {
  return { ...params, page: Math.min(1000, Math.max(1, Math.trunc(page))) };
}

/** Clears filters but keeps the query — the shopper searched for something on purpose. */
export function clearFilters(params: ListingParams): ListingParams {
  return refine(params, { attributes: {}, price: null, inStock: false });
}

function withKey(
  attributes: Record<string, string[]>,
  key: string,
  values: string[],
): Record<string, string[]> {
  const next = { ...attributes };
  if (values.length === 0) delete next[key];
  else next[key] = values;
  return next;
}

/**
 * How many filters are applied, counting each control once.
 *
 * A group with three boxes ticked is one filter to a shopper reading "3 filters
 * applied", not three — the count is there to say how much has been narrowed, and a
 * shopper narrows by control.
 */
export function activeFilterCount(params: ListingParams): number {
  return Object.keys(params.attributes).length + (params.price ? 1 : 0) + (params.inStock ? 1 : 0);
}

export function hasActiveFilters(params: ListingParams): boolean {
  return activeFilterCount(params) > 0;
}

/**
 * The deepest page either engine will serve.
 *
 * Meilisearch bounds result depth with `maxTotalHits` and the Mongo fallback honours the
 * same bound, so a pager that offered page 60 of a 24-per-page listing would be offering
 * a page the API refuses. It is computed rather than assumed for the same reason.
 */
export function maxReachablePage(perPage: number, totalPages: number): number {
  return Math.max(1, Math.min(totalPages, Math.floor(MAX_TOTAL_HITS / Math.max(1, perPage))));
}
