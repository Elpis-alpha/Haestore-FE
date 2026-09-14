import { NextResponse, type NextRequest } from 'next/server';
import {
  canonicalQuery,
  parseListingParams,
  respell,
  type RawSearchParams,
} from '@/lib/listing/params';
import { SESSION_COOKIE } from '@/lib/auth/cookie-name';

/**
 * Two jobs, both of which have to happen before anything renders.
 *
 * 1. **One URL per set of filters.** Anything non-canonical gets a 308.
 * 2. **A closed door on the account area and the admin console**, so a signed-out
 *    visitor is redirected instead of rendering a page that then redirects.
 *
 * Both are here for the same reason: by the time a server component runs, Next has
 * begun streaming the shell, so `redirect()` can no longer set a status — it degrades
 * to a `<meta http-equiv="refresh">` in the body. That is a visible flash for a person
 * and, for a crawler, the duplicate-content signal canonicalisation exists to remove.
 * Middleware runs before the render, so both redirects are real.
 */
export function middleware(request: NextRequest) {
  const url = request.nextUrl;

  if (
    url.pathname === '/account' ||
    url.pathname.startsWith('/account/') ||
    url.pathname === '/admin' ||
    url.pathname.startsWith('/admin/')
  ) {
    return guardSignedIn(request);
  }

  return canonicaliseListing(request);
}

/**
 * A presence check, not an authentication check — and the difference matters.
 *
 * Middleware has no Redis, so it cannot tell a valid session from an expired one. It
 * only turns away visitors carrying no cookie at all, which is the overwhelming
 * majority of the signed-out ones and costs them a render they would only have been
 * bounced out of.
 *
 * **The real decision is `requireSession` or `requireAdmin` in the layout**, which asks the
 * API — and for the console, answers a signed-in non-admin with the ordinary 404. This is an
 * optimisation in front of that, never a replacement for it: treating a cookie's
 * existence as proof of a session is how an expired credential becomes a valid one.
 */
function guardSignedIn(request: NextRequest) {
  if (request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  const target = new URL('/sign-in', request.url);
  // Path and query only. Passing the full URL would put an absolute address into a
  // redirect parameter, which is the shape an open redirect is built from.
  target.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`);
  return NextResponse.redirect(target);
}

function canonicaliseListing(request: NextRequest) {
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
   * The listing routes, the account area and the admin console, and nothing else. The product page and the
   * home page have no query state to canonicalise and no session to check, and running
   * this over `/_next/*` would put a redirect check in front of every asset request.
   */
  matcher: ['/shop', '/shop/:path*', '/account', '/account/:path*', '/admin', '/admin/:path*'],
};
