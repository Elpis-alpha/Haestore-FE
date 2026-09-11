import type { Order } from './types';

/**
 * Checkout, from the browser.
 *
 * Through `/api/*` — the Next rewrite — for the same reason as the cart: the bag's
 * identity is a `__Host-` cookie, which is single-origin by definition, and a request
 * to the API's own hostname would carry no cart.
 */

export class CheckoutError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'CheckoutError';
  }
}

/**
 * The idempotency key for one attempt at placing an order.
 *
 * **Generated once per checkout attempt and reused across retries**, which is the whole
 * point — a key regenerated on each press would make every double-tap a second order,
 * which is precisely what the header exists to prevent. The page holds it in a ref for
 * as long as the form is on screen.
 */
export function newIdempotencyKey(): string {
  return crypto.randomUUID();
}

async function send<T>(
  path: string,
  init: RequestInit & { idempotencyKey?: string } = {},
): Promise<T> {
  const { idempotencyKey, ...rest } = init;

  const response = await fetch(path, {
    ...rest,
    headers: {
      accept: 'application/json',
      ...(rest.body ? { 'content-type': 'application/json' } : {}),
      ...(idempotencyKey ? { 'idempotency-key': idempotencyKey } : {}),
      ...rest.headers,
    },
    cache: 'no-store',
  });

  const body = (await response.json().catch(() => null)) as {
    data?: T;
    error?: { code?: string; message?: string; details?: unknown };
  } | null;

  if (!response.ok) {
    throw new CheckoutError(
      response.status,
      body?.error?.code ?? 'UPSTREAM_ERROR',
      body?.error?.message ?? 'The shop did not answer. Try again in a moment.',
      body?.error?.details,
    );
  }

  return body?.data as T;
}

export type CheckoutDetails = {
  email: string;
  shippingAddress: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    region?: string;
    postalCode?: string;
    country: string;
    phone?: string;
  };
};

export type StripeSession = { order: Order; stripe: { clientSecret: string | null } };
export type PayPalSession = { order: Order; paypal: { orderId: string } };

/**
 * Places the order and starts the payment.
 *
 * **No amount crosses this boundary.** There is no field for one in the request and no
 * field for one on the server — everything charged is re-priced from the catalogue
 * inside the same transaction that reserves the stock.
 */
export function createSession(
  details: CheckoutDetails,
  provider: 'stripe' | 'paypal',
  idempotencyKey: string,
) {
  return send<StripeSession | PayPalSession>('/api/checkout/session', {
    method: 'POST',
    body: JSON.stringify({ ...details, provider }),
    idempotencyKey,
  });
}

export const capturePayPal = (paypalOrderId: string, idempotencyKey: string) =>
  send<{ order: Order }>('/api/checkout/paypal/capture', {
    method: 'POST',
    body: JSON.stringify({ paypalOrderId }),
    idempotencyKey,
  });

/**
 * Asks the server to ask the provider what happened.
 *
 * The return page's only job. Deliberately carries no idempotency key: it is safe to
 * call any number of times by construction, and requiring a key would turn a page
 * refresh into a 409.
 */
export const reconcile = (orderNumber: string, claimToken?: string | null) =>
  send<{ order: Order; reconciled: boolean }>('/api/checkout/reconcile', {
    method: 'POST',
    body: JSON.stringify({ orderNumber, ...(claimToken ? { claimToken } : {}) }),
  });

export const readOrder = (orderNumber: string, claimToken?: string | null) =>
  send<{ order: Order }>(
    `/api/checkout/order/${encodeURIComponent(orderNumber)}${claimToken ? `?t=${encodeURIComponent(claimToken)}` : ''}`,
  );
