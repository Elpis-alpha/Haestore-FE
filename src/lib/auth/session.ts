import 'server-only';
import { cache } from 'react';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { SESSION_COOKIE } from './cookie-name';
import type { Device, MeResponse, User } from '@/lib/api/types';
import type { WishlistEntry } from '@/lib/cart/types';

/**
 * Reading the session from a server component.
 *
 * The cookie is forwarded to Express explicitly rather than travelling on its own: a
 * server component's `fetch` carries no browser state, which is the correct default —
 * it means no page accidentally makes a request as the shopper. Anything that needs to
 * has to say so, here, in one place.
 *
 * This deliberately calls `API_ORIGIN` rather than the `/api/*` rewrite, for the same
 * reason as the catalogue client: the rewrite exists so the *browser* sees one origin,
 * and a server component calling its own hostname is a needless second hop.
 */

const API_ORIGIN = process.env.API_ORIGIN ?? 'http://127.0.0.1:5000';

export { SESSION_COOKIE } from './cookie-name';

/** The account, as the API describes it. Never re-declared here — see `types.ts`. */
export type Account = User;

export type Session = {
  account: Account;
  /** When possession of a code was last proved. What step-up is measured against. */
  authAt: string;
};

/** One authenticated GET, with the browser's cookie forwarded explicitly. */
async function authedGet<T>(path: string): Promise<T | null> {
  const jar = await cookies();
  const sid = jar.get(SESSION_COOKIE)?.value;
  // No cookie is not an error and must not become a request: a signed-out visitor
  // asking for the account page should not cost the API a round trip to be told so.
  if (!sid) return null;

  const response = await fetch(`${API_ORIGIN}${path}`, {
    headers: { accept: 'application/json', cookie: `${SESSION_COOKIE}=${sid}` },
    /**
     * Never cached, and never shared. Next's fetch cache keys on the URL, so a
     * session-bearing response left cacheable is one shopper's account served to the
     * next — the single worst cache bug available in this codebase.
     */
    cache: 'no-store',
  });

  if (!response.ok) return null;
  const body = (await response.json()) as { data: T };
  return body.data;
}

/**
 * The signed-in account, or null.
 *
 * `cache()` scopes the result to one request, so a layout, a page and a component can
 * each ask independently and only one call reaches Express. Without it the account area
 * would make the same round trip three times to render one screen.
 */
export const getSession = cache(async (): Promise<Session | null> => {
  const data = await authedGet<MeResponse['data']>('/api/auth/me');
  if (!data) return null;
  // The API calls it `user`; this side of the boundary calls it `account`, because that
  // is the word the pages are written in. The rename happens here, once, against a
  // generated type — so it cannot silently become `undefined` three components later,
  // which is exactly what it did the first time this shape was written out by hand.
  return { account: data.user, authAt: data.authAt };
});

export type { Device };

export async function getDevices(): Promise<Device[]> {
  return (await authedGet<Device[]>('/api/auth/devices')) ?? [];
}

export async function getAccount(): Promise<Account | null> {
  return (await getSession())?.account ?? null;
}

/**
 * The account area's gate.
 *
 * The middleware already turns away anyone without a cookie, but it cannot tell a
 * valid session from an expired one — it has no Redis. So this is the check that
 * actually decides, and the middleware in front of it is only there to save a render.
 */
export async function requireSession(returnTo: string): Promise<Session> {
  const session = await getSession();
  if (!session) redirect(`/sign-in?next=${encodeURIComponent(returnTo)}`);
  return session;
}

/**
 * 404 rather than 403 for a signed-in non-admin, matching `requireRole` on the API.
 *
 * The admin surface is not discoverable by probing. A 403 confirms that the URL is
 * something; a 404 says only what every unrouted path says.
 */
export async function requireAdmin(returnTo: string): Promise<Session> {
  const session = await requireSession(returnTo);
  if (!session.account.roles.includes('admin')) notFound();
  return session;
}

/**
 * The wishlist, read on the server.
 *
 * Unlike the cart — which is fetched from the browser because a guest has one and the
 * root layout must stay static — the wishlist only exists for a signed-in person on a
 * page that is already dynamic and already `noindex`. Rendering it on the server is one
 * fewer round trip and no loading state.
 */
export async function getWishlist(): Promise<WishlistEntry[]> {
  return (await authedGet<WishlistEntry[]>('/api/wishlist')) ?? [];
}
