import Link from 'next/link';
import { getCategories, softly } from '@/lib/api/client';
import { topLevel } from '@/lib/catalog/tree';
import { Wordmark } from '@/components/motifs/wordmark';
import { MobileNav } from './mobile-nav';
import { PrimaryNav } from './primary-nav';
import { SearchField } from './search-field';
import { BagButton } from '@/components/cart/bag-button';

/**
 * The shop front.
 *
 * The nav is read with `softly`: a category tree that fails to load leaves a header with
 * a wordmark and a search box, not a 500 on every page in the site. It is the one read
 * in the storefront that is allowed to fail quietly, because it is the one whose absence
 * costs a shopper nothing they came for.
 *
 * **Neither the bag nor the account link reads the session**, and that turned out to be
 * the right answer for both. `cookies()` in a layout opts every route beneath it into
 * dynamic rendering, and this layout wraps the whole site — so a header that resolved
 * who you are would cost the home page and every shelf their cacheability to render one
 * word and one number.
 *
 * Phase 5 expected Phase 6 to change that calculus, on the grounds that a bag needs
 * per-request state. It does not: the API writes the count to a cookie script can read,
 * so `<BagButton>` renders a correct badge in a statically prerendered header and fetches
 * the lines only when the drawer opens. `/` stays `○ Static`. See lib/cart/client.ts.
 *
 * The account link works the same way: it says "Account" in both states and `/account`
 * sorts it out — signed in you get the page, signed out it redirects and brings you back.
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

        {/*
          Hidden below md, where the drawer already carries a search field of its own.
          Kept here it was squeezed to 80px — 32px of it actual text, after the icon and
          the padding — which is not a search box, it is the idea of one. The breakpoint
          matches the drawer trigger's, so exactly one of the two is ever present.
        */}
        <SearchField className="ml-auto hidden w-full max-w-56 md:block" />

        <div className="ml-auto flex shrink-0 items-center md:ml-0">
          <Link
            href="/account"
            className="rounded-xs p-2 text-[var(--ink-muted)] transition-colors hover:text-[var(--ink)]"
          >
            <AccountGlyph />
            <span className="sr-only">Account</span>
          </Link>
          <BagButton />
        </div>
      </div>
    </header>
  );
}

/**
 * Drawn rather than imported: one glyph does not justify an icon dependency, and a
 * stroked figure at the same weight as the Arch keeps the header in one hand.
 */
function AccountGlyph() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden className="size-5" fill="none">
      <circle cx="10" cy="6.5" r="3.25" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3.75 17c0-3.2 2.8-5.25 6.25-5.25S16.25 13.8 16.25 17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
