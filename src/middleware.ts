import { NextResponse, type NextRequest } from 'next/server';
import {
  canonicalQuery,
  parseListingParams,
  respell,
  type RawSearchParams,
} from '@/lib/listing/params';

/**
 * One URL per set of filters, enforced before anything renders.
 *
 * This was first written inside the shop page itself, and it did not work. By the time a
 * server component runs, Next has already begun streaming the shell, so `redirect()` can
 * no longer set a status — it degrades to a `<meta http-equiv="refresh">` in the body.
 * That is a one-second visible flash for a shopper and, for a crawler, precisely the
 * duplicate-content signal canonicalisation exists to remove.
 *
 * Middleware runs before the render, so this is a real 308: permanent, method-preserving,
 * and followed by every crawler without argument.
 *
 * Nothing the storefront itself emits is ever non-canonical — every control builds its
 * href through `listingHref`. This is for the URLs it does not control: hand-edited ones,
 * old bookmarks, and the parameter permutations crawlers invent.
 */
export function middleware(request: NextRequest) {
  const url = request.nextUrl;

  const raw: RawSearchParams = {};
  for (const key of new Set(url.searchParams.keys())) {
    const values = url.searchParams.getAll(key);
    raw[key] = values.length > 1 ? values : values[0];
  }

  const canonical = canonicalQuery(parseListingParams(raw));
  /**
   * Compared through `respell`, not against `url.search`. The request's own query string
   * carries NextURL's encoding, which disagrees with the canonical form's about the comma
   * — and comparing the two spells an infinite 308. See `respell`.
   */
  if (respell(raw) === canonical) return NextResponse.next();

  const target = new URL(url);
  target.search = canonical;
  return NextResponse.redirect(target, 308);
}

export const config = {
  /**
   * The listing routes only. The product page and the home page have no query state to
   * canonicalise, and running this over `/_next/*` would put a redirect check in front of
   * every asset request.
   */
  matcher: ['/shop', '/shop/:path*'],
};
