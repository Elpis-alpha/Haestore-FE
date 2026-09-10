import Link from 'next/link';
import { cn } from '@/lib/cn';
import { listingHref, maxReachablePage, setPage, type ListingParams } from '@/lib/listing/params';

/**
 * The pager.
 *
 * Real links, not buttons routed through the refinement transition — which is a
 * deliberate difference from every other control on the page. A page is a distinct
 * document with its own canonical URL, so a crawler has to be able to follow it, and a
 * shopper moving to page 2 wants the top of page 2 rather than to stay where they were.
 * Both fall out of using an `<a>`.
 *
 * The last page offered is the last page the API will actually serve: both engines bound
 * result depth at 1000 documents, so a listing reporting 4,000 matches still stops here
 * at page 41. Offering page 60 would be offering a page that answers with an error.
 */
export function Pagination({
  basePath,
  params,
  totalPages,
}: {
  basePath: string;
  params: ListingParams;
  totalPages: number;
}) {
  const last = maxReachablePage(params.perPage, totalPages);
  if (last <= 1) return null;

  const current = Math.min(params.page, last);
  const href = (page: number) => listingHref(basePath, setPage(params, page));

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-1.5 pt-4">
      <Step href={current > 1 ? href(current - 1) : null} label="Previous page">
        ‹
      </Step>

      {pageWindow(current, last).map((page, index) =>
        page === null ? (
          <span key={`gap-${index}`} aria-hidden className="px-1 text-[var(--ink-faint)]">
            …
          </span>
        ) : (
          <Link
            key={page}
            href={href(page)}
            aria-label={`Page ${page}`}
            aria-current={page === current ? 'page' : undefined}
            className={cn(
              'tabular grid h-9 min-w-9 place-items-center rounded-sm px-2 text-sm',
              'transition-colors',
              page === current
                ? 'bg-[var(--ink)] font-medium text-[var(--surface)]'
                : 'text-[var(--ink-muted)] hover:bg-[var(--ink)]/10 hover:text-[var(--ink)]',
            )}
          >
            {page}
          </Link>
        ),
      )}

      <Step href={current < last ? href(current + 1) : null} label="Next page">
        ›
      </Step>
    </nav>
  );
}

function Step({
  href,
  label,
  children,
}: {
  href: string | null;
  label: string;
  children: React.ReactNode;
}) {
  const shape =
    'grid h-9 w-9 place-items-center rounded-sm border border-[var(--edge)] text-base leading-none';

  // A disabled end of the pager stays in the layout so the row does not shift by 36px
  // between page 1 and page 2, but it is not a link and not focusable.
  if (!href) {
    return (
      <span aria-hidden className={cn(shape, 'opacity-30')}>
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      aria-label={label}
      className={cn(shape, 'transition-colors hover:border-[var(--ink)] hover:bg-[var(--ink)]/10')}
    >
      <span aria-hidden>{children}</span>
    </Link>
  );
}

/**
 * First, last, and a window around the current page.
 *
 * Returns `null` where a run of pages is elided, so the caller renders an ellipsis
 * rather than a link to a page nobody asked for.
 */
function pageWindow(current: number, last: number): (number | null)[] {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);

  const pages = new Set([1, last, current, current - 1, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((p) => pages.add(p));
  if (current >= last - 2) [last - 3, last - 2, last - 1].forEach((p) => pages.add(p));

  const sorted = [...pages].filter((p) => p >= 1 && p <= last).sort((a, b) => a - b);
  const out: (number | null)[] = [];

  sorted.forEach((page, index) => {
    const previous = sorted[index - 1];
    if (previous !== undefined && page - previous > 1) out.push(null);
    out.push(page);
  });

  return out;
}
