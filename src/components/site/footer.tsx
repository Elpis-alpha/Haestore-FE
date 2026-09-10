import Link from 'next/link';
import { getCategories, softly } from '@/lib/api/client';
import { topLevel } from '@/lib/catalog/tree';
import { Wordmark } from '@/components/motifs/wordmark';
import { VineRule } from '@/components/motifs/rule';

/**
 * The foot of the page.
 *
 * Two columns, not five: this shop has shelves and it has a note about itself, and
 * padding either of those out into a wall of link groups would be inventing pages that
 * do not exist. Pages arrive in later phases and the footer grows then.
 */
export async function SiteFooter() {
  const categories = await softly(getCategories(), []);
  const roots = topLevel(categories);
  const year = new Date().getFullYear();

  return (
    <footer className="surface-ground mt-20 border-t border-[var(--rule)]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 sm:flex-row sm:justify-between">
          <div className="max-w-sm">
            <Wordmark />
            <p className="mt-4 text-sm leading-relaxed text-[var(--ink-muted)]">
              A general store for things that are made rather than manufactured. We keep a small
              range and know where each of it comes from.
            </p>
          </div>

          {roots.length > 0 && (
            <nav aria-label="Shelves">
              <h2 className="font-display text-sm [--wght:600]">Shelves</h2>
              <ul className="mt-3 grid grid-cols-2 gap-x-10 gap-y-1.5 sm:grid-cols-1">
                {roots.map((root) => (
                  <li key={root._id}>
                    <Link
                      href={`/shop/${root.path}`}
                      className="text-sm text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
                    >
                      {root.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>

        <VineRule className="my-10" />

        <div className="flex flex-col-reverse gap-3 text-xs text-[var(--ink-faint)] sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Hæstore</p>
          <Link href="/styleguide" className="hover:text-[var(--ink)]">
            Specimen sheet
          </Link>
        </div>
      </div>
    </footer>
  );
}
