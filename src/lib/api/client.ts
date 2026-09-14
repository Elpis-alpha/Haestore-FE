import 'server-only';
import type { paths } from './schema';
import type { Category, CategoryFilter, Product, ProductListResponse } from './types';

/**
 * The server-side catalogue client.
 *
 * Server components call Express directly on `API_ORIGIN`. They deliberately do not go
 * through the `/api/*` rewrite in next.config.ts: that rewrite exists so the *browser*
 * only ever sees one origin, which is what makes the `__Host-` cookie legal from Phase 5
 * onward. A server component making a same-origin request to itself would be a needless
 * second hop through the Worker, and on Cloudflare a subrequest against its own hostname
 * that has no reason to exist.
 *
 * Nothing here declares a response shape. Every type comes from `schema.d.ts`, which is
 * generated from the backend's OpenAPI document and regenerated in CI — so a field this
 * file gets wrong is a compile error rather than an `undefined` on a shelf label.
 */

const API_ORIGIN = process.env.API_ORIGIN ?? 'http://127.0.0.1:5000';

/**
 * A failed catalogue request, carrying the status so a caller can tell "no such
 * category" from "the API is down" — the first is a 404 page, the second is an outage.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type FetchOptions = {
  /** Seconds. Omit for a request that must not be cached. */
  revalidate?: number;
  tags?: string[];
  searchParams?: Record<string, string | number | boolean | undefined> | URLSearchParams;
};

async function apiGet<T>(path: string, options: FetchOptions = {}): Promise<T> {
  const url = new URL(path, API_ORIGIN);

  if (options.searchParams instanceof URLSearchParams) {
    url.search = options.searchParams.toString();
  } else if (options.searchParams) {
    for (const [key, value] of Object.entries(options.searchParams)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }

  const response = await fetch(url, {
    headers: { accept: 'application/json' },
    next:
      options.revalidate === undefined
        ? { revalidate: 0 }
        : { revalidate: options.revalidate, ...(options.tags ? { tags: options.tags } : {}) },
  });

  if (!response.ok) {
    // The API's error envelope is a fixed shape with a requestId, so a storefront error
    // can be traced to the exact server log line. A non-JSON body means something in
    // front of Express answered, which is worth saying differently.
    const body = (await response.json().catch(() => null)) as {
      error?: { code?: string; message?: string; requestId?: string };
    } | null;
    throw new ApiError(
      response.status,
      body?.error?.code ?? 'UPSTREAM_ERROR',
      body?.error?.message ?? `The catalogue did not answer (${response.status}).`,
      body?.error?.requestId,
    );
  }

  return (await response.json()) as T;
}

/**
 * The full active category tree, root-first.
 *
 * Cached hard and shared by every page: the header nav, the home page shelves and the
 * product page's breadcrumb all read the same document rather than each asking for the
 * ancestry they need. A category tree changes when an admin edits it, which is rare
 * enough that five minutes of staleness costs nothing and a per-request round trip on
 * every page would cost a great deal.
 */
export async function getCategories(): Promise<Category[]> {
  const body = await apiGet<{ data: Category[] }>('/api/catalog/categories', {
    revalidate: 300,
    tags: ['categories'],
  });
  return body.data;
}

export type CategoryDetail = {
  category: {
    id: string;
    name: string;
    slug: string;
    path: string;
    description?: string;
    ancestors: string[];
  };
  /** The filter panel, generated from attributes an admin defined. */
  filters: CategoryFilter[];
};

export async function getCategoryByPath(path: string): Promise<CategoryDetail> {
  const body = await apiGet<{ data: CategoryDetail }>(
    `/api/catalog/categories/by-path/${path.split('/').map(encodeURIComponent).join('/')}`,
    { revalidate: 300, tags: ['categories'] },
  );
  return body.data;
}

/**
 * The storefront listing.
 *
 * Uncached on purpose. The response varies with every filter combination, so the hit
 * rate on a shared cache is close to zero, and the two things it carries that a shopper
 * acts on — facet counts and stock — are exactly the ones that must not be stale. The
 * cheap, high-hit-rate reads above are where caching earns its keep.
 */
export async function getProducts(
  search: URLSearchParams,
  /**
   * Set only for a fixed, shopper-independent shelf — the home page's "recently added"
   * row, which is the same six products for everyone and would otherwise be a live
   * search on every visit to the front page.
   */
  options: { revalidate?: number; tags?: string[] } = {},
): Promise<ProductListResponse> {
  return apiGet<ProductListResponse>('/api/catalog/products', {
    searchParams: search,
    ...options,
  });
}

export async function getProduct(slug: string): Promise<Product> {
  const body = await apiGet<{ data: Product }>(
    `/api/catalog/products/${encodeURIComponent(slug)}`,
    { revalidate: 60, tags: ['products', `product:${slug}`] },
  );
  return body.data;
}

export type ReviewPage =
  paths['/api/catalog/products/{slug}/reviews']['get']['responses'][200]['content']['application/json'];

/**
 * The first page of a product's reviews, for the product page.
 *
 * Cached for the same minute as the product itself and tagged with it, so the rating in the
 * page's heading and the reviews beneath it age together rather than disagreeing for a
 * minute after somebody writes one. Later pages and other sorts are fetched from the browser.
 */
export async function getProductReviews(slug: string): Promise<ReviewPage> {
  return apiGet<ReviewPage>(`/api/catalog/products/${encodeURIComponent(slug)}/reviews`, {
    revalidate: 60,
    tags: ['products', `product:${slug}`, `reviews:${slug}`],
  });
}

export type SitemapEntries =
  paths['/api/catalog/sitemap']['get']['responses'][200]['content']['application/json']['data'];

/** Every live shelf and product. Cached for an hour; a sitemap is not read by the minute. */
export async function getSitemapEntries(): Promise<SitemapEntries> {
  const body = await apiGet<{ data: SitemapEntries }>('/api/catalog/sitemap', {
    revalidate: 3600,
    tags: ['sitemap'],
  });
  return body.data;
}

/**
 * A catalogue read that must not take the page down with it.
 *
 * The header's category nav is the case this exists for: a nav that cannot load is a
 * page with a thinner header, not a 500. The listing and the product page deliberately
 * do *not* use this — a shop that renders an empty grid because the API is unreachable
 * is worse than one that says so.
 */
export async function softly<T>(read: Promise<T>, fallback: T): Promise<T> {
  try {
    return await read;
  } catch (error) {
    console.error('[catalog] optional read failed', error);
    return fallback;
  }
}

export type StorefrontPage =
  paths['/api/storefront/{handle}']['get']['responses'][200]['content']['application/json']['data'];

/**
 * A composed page — the published version, with its products and shelves resolved.
 *
 * Tagged so publishing can revalidate it: the composer calls a server action that
 * revalidates `storefront`, which is what lets a publish show within seconds on a page that
 * otherwise holds for five minutes.
 */
export async function getStorefront(handle: 'home'): Promise<StorefrontPage> {
  const body = await apiGet<{ data: StorefrontPage }>(`/api/storefront/${handle}`, {
    revalidate: 300,
    tags: ['storefront'],
  });
  return body.data;
}
