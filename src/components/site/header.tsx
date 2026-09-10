import Link from 'next/link';
import { getCategories, softly } from '@/lib/api/client';
import { topLevel } from '@/lib/catalog/tree';
import { Wordmark } from '@/components/motifs/wordmark';
import { MobileNav } from './mobile-nav';
import { PrimaryNav } from './primary-nav';
import { SearchField } from './search-field';

/**
 * The shop front.
 *
 * The nav is read with `softly`: a category tree that fails to load leaves a header with
 * a wordmark and a search box, not a 500 on every page in the site. It is the one read
 * in the storefront that is allowed to fail quietly, because it is the one whose absence
 * costs a shopper nothing they came for.
 *
 * There is no cart control yet, and deliberately no disabled placeholder for one. Phase 4
 * builds the read path; the bag arrives in Phase 6 with something behind it. A button
 * that does nothing teaches people the buttons do nothing.
 */
export async function SiteHeader() {
  const categories = await softly(getCategories(), []);
  const roots = topLevel(categories);

  return (
    <header className="surface-ground sticky top-0 z-40 border-b border-[var(--rule)]">
      {/* The ground is opaque behind the header rather than blurred: a blur over a
          grain texture smears it, and the grain is fixed to the viewport so it would
          be smearing a layer that is not moving. */}
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <MobileNav roots={roots} categories={categories} />

        <Link href="/" className="mr-2 shrink-0 rounded-xs">
          <Wordmark />
          <span className="sr-only">— home</span>
        </Link>

        <PrimaryNav roots={roots} />

        <SearchField className="ml-auto w-full max-w-56" />
      </div>
    </header>
  );
}
