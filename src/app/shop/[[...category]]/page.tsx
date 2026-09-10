import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ApiError, getCategories, getCategoryByPath, getProducts, softly } from '@/lib/api/client';
import { breadcrumbFor, childrenOf } from '@/lib/catalog/tree';
import {
  canonicalQuery,
  clearFilters,
  hasActiveFilters,
  listingHref,
  parseListingParams,
  type ListingParams,
  type RawSearchParams,
} from '@/lib/listing/params';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SlabRule, VineRule } from '@/components/motifs/rule';
import { Leaf } from '@/components/motifs/leaf';
import { ActiveFilters, ResultsRegion, SortControl } from '@/components/catalog/listing-controls';
import { FacetDrawer, FacetPanel } from '@/components/catalog/facet-panel';
import { ListingTransition } from '@/components/catalog/listing-transition';
import { Pagination } from '@/components/catalog/pagination';
import { ProductGrid } from '@/components/catalog/product-grid';

/**
 * The shop, and every shelf in it.
 *
 * One route serves `/shop` and `/shop/coffee-tea/beans` alike, because they are the same
 * page with a different scope — and because the filter panel is generated either way.
 * With a category it is that category's effective attributes; without one it is the union
 * of every filterable definition in the shop. Neither is written down here.
 *
 * The page is a pure function of its URL. Nothing on it holds filter state, which is what
 * makes Back, refresh and a pasted link all behave without any of them being implemented.
 *
 * **There is deliberately no `loading.tsx` here, and there must not be one.** It would wrap
 * the route in a Suspense boundary, letting Next flush the shell — and commit a 200 —
 * before this component has decided whether the shelf exists. `not-found.tsx` would still
 * render, but under a 200: a soft 404. Verified by removing the file and watching
 * `/shop/no-such-shelf` go from 200 to 404.
 *
 * Refinement feedback does not depend on it. A filter change is a client-side transition
 * whose pending flag dims the results in place (see `ResultsRegion`), which is the better
 * behaviour anyway — a shopper correcting a filter keeps their place instead of watching
 * the shelf empty and refill.
 */

type PageProps = {
  params: Promise<{ category?: string[] }>;
  searchParams: Promise<RawSearchParams>;
};

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { category } = await params;
  const path = category?.join('/');
  const listing = parseListingParams(await searchParams);
  const basePath = path ? `/shop/${path}` : '/shop';

  const detail = path ? await softly(getCategoryByPath(path), null) : null;
  const name = detail?.category.name ?? 'The shop';

  return {
    title: listing.q ? `${listing.q} — search` : name,
    description:
      detail?.category.description ??
      'Coffee and tea, ceramics, botanicals, textiles, pantry and hand tools.',
    alternates: { canonical: listingHref(basePath, listing) },
    robots: {
      /**
       * A shelf is worth indexing; a shelf with three boxes ticked is one of thousands of
       * near-identical combinations of the same products, and a search result is a page
       * about the query rather than about the shop. Canonicalisation already collapses
       * the *spelling* variants; this keeps the combinatorial ones out.
       */
      index: !hasActiveFilters(listing) && !listing.q,
      follow: true,
    },
  };
}

export default async function ShopPage({ params, searchParams }: PageProps) {
  const { category } = await params;
  const raw = await searchParams;
  const path = category?.join('/');
  const basePath = path ? `/shop/${path}` : '/shop';

  const listing = parseListingParams(raw);

  /**
   * By the time this runs the URL is already canonical — src/middleware.ts issued a 308
   * for anything that was not, because a redirect from here is too late to be a status
   * code and degrades to a meta refresh in the body.
   *
   * So this is not a re-canonicalisation, it is the API query: the same sorted, defaulted
   * parameters, with the category added.
   */
  const canonical = canonicalQuery(listing);
  const search = new URLSearchParams(canonical.replace(/^\?/, ''));
  if (path) search.set('category', path);

  const [detail, categories, results] = await Promise.all([
    path ? getCategoryByPath(path).catch(rethrowUnlessMissing) : null,
    softly(getCategories(), []),
    getProducts(search).catch(rethrowUnlessMissing),
  ]);

  if (path && !detail) notFound();
  // A category that resolves but whose listing 404s means the path vanished between the
  // two reads. Rare, and still a missing page rather than a blank shelf.
  if (!results) notFound();

  const { data: products, facets, ignoredFilters, page } = results;
  const shelves = detail ? childrenOf(categories, detail.category.id) : [];
  const trail = path ? breadcrumbFor(categories, path) : [];
  const currency = products.find((p) => p.priceRange)?.priceRange?.currency ?? 'USD';
  const showPanel = !page.degraded && facets !== null && facets.length > 0;

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Breadcrumb trail={trail} />

      <header className="mt-4 flex flex-col gap-3">
        <h1 className="font-display text-3xl [--opsz:48] [--wght:600] sm:text-4xl">
          {listing.q ? (
            <>
              <span className="text-[var(--ink-muted)]">Searching for </span>
              {listing.q}
            </>
          ) : (
            (detail?.category.name ?? 'Everything in the shop')
          )}
        </h1>

        {detail?.category.description && !listing.q && (
          <p className="max-w-prose text-base leading-relaxed text-[var(--ink-muted)]">
            {detail.category.description}
          </p>
        )}
      </header>

      {shelves.length > 0 && (
        <nav aria-label="Sub-shelves" className="mt-6">
          <ul className="flex flex-wrap gap-2">
            {shelves.map((shelf) => (
              <li key={shelf._id}>
                <Link
                  href={`/shop/${shelf.path}`}
                  className="inline-flex rounded-xs border border-[var(--edge)] px-3 py-1.5 text-sm text-[var(--ink-muted)] transition-colors hover:border-[var(--ink)] hover:text-[var(--ink)]"
                >
                  {shelf.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <VineRule className="my-8" />

      <ListingTransition params={listing} basePath={basePath}>
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
          {showPanel && (
            <aside className="hidden w-64 shrink-0 lg:block">
              <div className="sticky top-24">
                <FacetPanel facets={facets} currency={currency} />
              </div>
            </aside>
          )}

          <div className="min-w-0 grow">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {showPanel && <FacetDrawer facets={facets} currency={currency} />}
                <p className="text-sm text-[var(--ink-muted)]">
                  <span className="tabular text-[var(--ink)]">{page.total}</span>{' '}
                  {page.total === 1 ? 'item' : 'items'}
                  {page.totalPages > 1 && (
                    <>
                      {' · page '}
                      <span className="tabular">{page.page}</span> of{' '}
                      <span className="tabular">{page.totalPages}</span>
                    </>
                  )}
                </p>
              </div>
              <SortControl />
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <ActiveFilters facets={facets} currency={currency} />
              <Notices degraded={page.degraded} ignored={ignoredFilters} />
            </div>

            <SlabRule className="my-6" />

            {products.length > 0 ? (
              <>
                <ResultsRegion>
                  <ProductGrid products={products} />
                </ResultsRegion>
                <Pagination basePath={basePath} params={listing} totalPages={page.totalPages} />
              </>
            ) : (
              <EmptyShelf params={listing} basePath={basePath} />
            )}
          </div>
        </div>
      </ListingTransition>
    </main>
  );
}

/**
 * The two things the API says about its own answer that a shopper needs told.
 *
 * `degraded` means MongoDB answered instead of Meilisearch, so no attribute filter was
 * applied and there are no facet counts. `ignoredFilters` names filters that were
 * dropped — usually a bookmark that outlived the attribute it refers to. Both are the
 * difference between showing unfiltered results and claiming to have filtered them, so
 * neither is swallowed.
 */
function Notices({
  degraded,
  ignored,
}: {
  degraded: boolean;
  ignored: { key: string; reason: string }[];
}) {
  if (!degraded && ignored.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      {degraded && (
        <p className="flex items-start gap-2 text-sm text-[var(--note)]">
          <Badge tone="note" className="mt-0.5 shrink-0">
            Filters unavailable
          </Badge>
          <span className="text-[var(--ink-muted)]">
            Search is catching up, so the shelf is showing everything rather than a filtered
            selection. Sorting and paging still work.
          </span>
        </p>
      )}

      {ignored.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm text-[var(--ink-muted)]">
          {ignored.map((entry) => (
            <li key={entry.key} className="flex items-start gap-2">
              <Badge tone="note" className="mt-0.5 shrink-0">
                {entry.key}
              </Badge>
              <span>{entry.reason}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** An empty result is an instruction, not an apology. */
function EmptyShelf({ params, basePath }: { params: ListingParams; basePath: string }) {
  const narrowed = hasActiveFilters(params);

  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <Leaf aria-hidden className="size-8 text-[var(--ink-faint)]" />
      <p className="font-display text-xl [--opsz:24] [--wght:600]">
        {narrowed ? 'Nothing on this shelf matches' : 'This shelf is empty'}
      </p>
      <p className="max-w-sm text-sm text-[var(--ink-muted)]">
        {narrowed
          ? 'Take a filter off and the shelf will fill again.'
          : params.q
            ? 'Try a shorter search, or browse the shelves.'
            : 'Nothing has been put out here yet.'}
      </p>
      <div className="mt-2 flex gap-3">
        {narrowed && (
          <Button asChild>
            <Link href={listingHref(basePath, clearFilters(params))}>Clear the filters</Link>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link href="/shop">Browse the shelves</Link>
        </Button>
      </div>
    </div>
  );
}

function Breadcrumb({ trail }: { trail: { _id: string; name: string; path: string }[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--ink-faint)]">
        <li>
          <Link href="/shop" className="transition-colors hover:text-[var(--ink)]">
            Shop
          </Link>
        </li>
        {trail.map((entry, index) => (
          <li key={entry._id} className="flex items-center gap-2">
            <span aria-hidden>/</span>
            {index === trail.length - 1 ? (
              <span aria-current="page" className="text-[var(--ink-muted)]">
                {entry.name}
              </span>
            ) : (
              <Link
                href={`/shop/${entry.path}`}
                className="transition-colors hover:text-[var(--ink)]"
              >
                {entry.name}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** A 404 from the catalogue is a missing page; anything else is an outage and must surface. */
function rethrowUnlessMissing(error: unknown): null {
  if (error instanceof ApiError && error.status === 404) return null;
  throw error;
}
