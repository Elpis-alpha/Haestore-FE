import Link from 'next/link';
import { cn } from '@/lib/cn';
import { SlabRule } from '@/components/motifs/rule';

/**
 * The console's page furniture.
 *
 * A back office in this shop is a ledger kept on paper at the counter: the ground is still
 * the shop around you, and the records you work on are paper set down on it — Phase 1's
 * rule, applied to the room behind the till. So lists are ruled paper, not a grid of
 * cards; a heading is the display face at a working size; and nothing here is coloured
 * unless the colour means something about the record.
 */

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <header className="mb-8 flex flex-col gap-3">
      {back && (
        <Link
          href={back.href}
          className="self-start text-sm text-[var(--ink-muted)] underline decoration-[var(--rule)] underline-offset-4 hover:text-[var(--ink)]"
        >
          Back to {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="font-display text-3xl leading-tight text-balance [--opsz:48] [--wght:600]">
            {title}
          </h1>
          {description && (
            <p className="mt-2 max-w-prose text-sm text-pretty text-[var(--ink-muted)]">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/**
 * A sheet of ruled paper holding a table. Wide tables scroll inside it, never the page.
 *
 * `relative` is load-bearing. Radix checkboxes render a hidden, absolutely positioned native
 * input for form submission, and an absolutely positioned element is clipped by an overflow
 * container only if that container is its containing block. Without `relative` those inputs
 * escaped the scroll box and widened the whole page to 773px at a 375px viewport.
 */
export function Ledger({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'surface-paper relative overflow-x-auto rounded-md border border-[var(--edge)] shadow-[0_1px_0_rgb(11_6_3/0.25)]',
        className,
      )}
    >
      <table className="w-full min-w-[40rem] border-collapse text-left text-sm">{children}</table>
    </div>
  );
}

export function LedgerHead({ columns }: { columns: { label: string; align?: 'right' }[] }) {
  return (
    <thead>
      <tr className="border-b border-[var(--edge)] text-xs text-[var(--ink-muted)]">
        {columns.map((column) => (
          <th
            key={column.label}
            scope="col"
            className={cn('px-4 py-2.5 font-medium', column.align === 'right' && 'text-right')}
          >
            {column.label}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export const rowClass =
  'border-b border-[var(--rule)] last:border-b-0 align-top transition-colors hover:bg-[var(--groove)]/60';
export const cellClass = 'px-4 py-3';

/** A sheet of paper for anything that is not a table. */
export function Sheet({
  title,
  children,
  className,
  actions,
}: {
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}) {
  return (
    <section className={cn('surface-paper rounded-md border border-[var(--edge)] p-5', className)}>
      {title && (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-lg [--opsz:24] [--wght:600]">{title}</h2>
            {actions}
          </div>
          <SlabRule className="mt-2 mb-4" />
        </>
      )}
      {children}
    </section>
  );
}

/** Label-and-value pairs, for the facts about one record. */
export function Facts({ items }: { items: { label: string; value: React.ReactNode }[] }) {
  return (
    <dl className="flex flex-col text-sm">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex justify-between gap-6 border-b border-[var(--rule)] py-2 last:border-b-0"
        >
          <dt className="shrink-0 text-[var(--ink-muted)]">{item.label}</dt>
          <dd className="min-w-0 text-right break-words text-[var(--ink)]">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** An empty list says what would fill it and where that comes from. */
export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-md border border-dashed border-[var(--edge)] px-5 py-8 text-center text-sm text-[var(--ink-muted)]">
      {children}
    </p>
  );
}

/** Previous and next, as real links that keep the current filters. */
export function Pager({
  page,
  totalPages,
  total,
  basePath,
  params,
}: {
  page: number;
  totalPages: number;
  total: number;
  basePath: string;
  params: Record<string, string | undefined>;
}) {
  if (totalPages <= 1) return null;
  const hrefFor = (target: number) => {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) if (value) search.set(key, value);
    if (target > 1) search.set('page', String(target));
    const text = search.toString();
    return `${basePath}${text ? `?${text}` : ''}`;
  };

  const link = 'rounded-sm px-3 py-1.5 transition-colors hover:bg-[var(--ink)]/8';
  return (
    <nav aria-label="Pages" className="mt-4 flex items-center justify-between text-sm">
      <span className="text-[var(--ink-faint)]">
        Page {page} of {totalPages}, {total} in all
      </span>
      <span className="flex gap-1">
        {page > 1 ? (
          <Link className={link} href={hrefFor(page - 1)}>
            Previous
          </Link>
        ) : null}
        {page < totalPages ? (
          <Link className={link} href={hrefFor(page + 1)}>
            Next
          </Link>
        ) : null}
      </span>
    </nav>
  );
}

/** Filter links along the top of a list. The current one is marked for a screen reader too. */
export function FilterLinks({
  items,
}: {
  items: { href: string; label: string; active: boolean }[];
}) {
  return (
    <ul className="flex flex-wrap gap-1">
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            aria-current={item.active ? 'true' : undefined}
            className={cn(
              'block rounded-sm px-3 py-1.5 text-sm transition-colors',
              item.active
                ? 'bg-[var(--ink)] text-[var(--surface)]'
                : 'text-[var(--ink-muted)] hover:bg-[var(--ink)]/8 hover:text-[var(--ink)]',
            )}
          >
            {item.label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
