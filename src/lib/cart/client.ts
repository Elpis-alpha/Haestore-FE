import { EMPTY_CART, type Cart, type MergeReport, type WishlistEntry } from './types';

/**
 * The bag, from the browser.
 *
 * **Every call goes through `/api/*`, the Next rewrite — never to `API_ORIGIN`.** That
 * is not a preference: the cart's identity is a `__Host-` cookie, and a cookie with no
 * `Domain` attribute is single-origin by definition. A request to the API's own hostname
 * would carry no cart and, worse, the `Set-Cookie` issuing a guest token would land on
 * an origin the browser is not on. The rewrite is what makes one origin true.
 *
 * These are plain functions rather than a hook, because the provider owns the state and
 * this file owns the transport. Splitting them is what lets the optimistic layer be
 * tested as arithmetic.
 */

export class CartError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'CartError';
  }
}

async function send<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      accept: 'application/json',
      ...(init.body ? { 'content-type': 'application/json' } : {}),
      ...init.headers,
    },
    // Never cached. A cart response is one person's, and Next's fetch cache keys on the
    // URL — a cacheable one is the single worst bug available in this file.
    cache: 'no-store',
  });

  if (response.status === 204) return undefined as T;

  const body = (await response.json().catch(() => null)) as {
    data?: T;
    error?: { code?: string; message?: string };
  } | null;

  if (!response.ok) {
    throw new CartError(
      response.status,
      body?.error?.code ?? 'UPSTREAM_ERROR',
      body?.error?.message ?? 'The shop did not answer. Try again in a moment.',
    );
  }

  return (body?.data ?? EMPTY_CART) as T;
}

export const readCart = () => send<Cart>('/api/cart');

export const addLine = (productId: string, variantId: string, quantity = 1) =>
  send<Cart>('/api/cart/lines', {
    method: 'POST',
    // No price, no total, no currency. There is no field on the server to put one in.
    body: JSON.stringify({ productId, variantId, quantity }),
  });

export const setLineQuantity = (lineKey: string, quantity: number) =>
  send<Cart>(`/api/cart/lines/${lineKey}`, {
    method: 'PATCH',
    body: JSON.stringify({ quantity }),
  });

export const removeLine = (lineKey: string) =>
  send<Cart>(`/api/cart/lines/${lineKey}`, { method: 'DELETE' });

export const moveLine = (lineKey: string, to: 'saved' | 'cart') =>
  send<Cart>(`/api/cart/lines/${lineKey}/move`, {
    method: 'POST',
    body: JSON.stringify({ to }),
  });

export const readMergeReport = () => send<MergeReport | null>('/api/cart/merge-report');

export const dismissMergeReport = () =>
  send<void>('/api/cart/merge-report/dismiss', { method: 'POST' });

export const undoMerge = () => send<Cart>('/api/cart/merge-report/undo', { method: 'POST' });

export const addWish = (productId: string, variantId?: string | null) =>
  send<WishlistEntry[]>('/api/wishlist', {
    method: 'POST',
    body: JSON.stringify({ productId, variantId: variantId ?? null }),
  });

export const removeWish = (productId: string, variantId?: string | null) =>
  send<WishlistEntry[]>('/api/wishlist', {
    method: 'DELETE',
    body: JSON.stringify({ productId, variantId: variantId ?? null }),
  });

/**
 * The bag count, read from the cookie the API writes alongside every cart response.
 *
 * This is why the header can show a badge without making the whole site dynamic.
 * `cookies()` in the root layout would opt every route beneath it into dynamic
 * rendering — including `/`, which the Phase 5 verification confirmed is still
 * `○ Static` — to render one number. Reading it in the browser costs nothing and keeps
 * the prerender.
 *
 * It is a display hint and never the truth. It is forgeable, it can be stale, and every
 * cart response replaces it; the drawer always shows what the server said.
 */
export function readBagCount(): number {
  if (typeof document === 'undefined') return 0;
  const match = /(?:^|;\s*)hae_bag=(\d+)/.exec(document.cookie);
  const parsed = Number(match?.[1]);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Whether a merge report is worth asking for.
 *
 * The API sets a readable `hae_merge` cookie when signing in folded a guest bag in, and
 * clears it on dismiss, on undo, and on any read that finds nothing. Without it the cart
 * page asked on every visit — a 401 in the console for every signed-out shopper, and a
 * round trip for every signed-in one to be told "no" almost every time.
 */
export function hasMergeReport(): boolean {
  if (typeof document === 'undefined') return false;
  return /(?:^|;\s*)hae_merge=1/.test(document.cookie);
}
