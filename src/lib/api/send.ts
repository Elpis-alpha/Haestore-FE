/**
 * A session-bearing request from the browser, for the account area.
 *
 * Through `/api/*`, the Next rewrite, like the bag and the console: the session is a
 * `__Host-` cookie and exists on one origin only. The admin console has its own copy of this
 * (lib/admin/client.ts) because it layers step-up on top; the account area has nothing to
 * layer, and the bag's (lib/cart/client.ts) substitutes an empty cart for a missing body,
 * which would be exactly wrong here.
 */

export class RequestError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'RequestError';
  }
}

export async function send<T = unknown>(
  path: string,
  init: { method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'GET'; body?: unknown } = {
    method: 'GET',
  },
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: init.method,
      headers: {
        accept: 'application/json',
        ...(init.body === undefined ? {} : { 'content-type': 'application/json' }),
      },
      ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
      // Never cached: every response here is one person's.
      cache: 'no-store',
    });
  } catch {
    throw new RequestError(0, 'NETWORK', 'We could not reach the shop. Check your connection.');
  }

  if (response.status === 204) return undefined as T;

  const body = (await response.json().catch(() => null)) as {
    data?: T;
    error?: { code?: string; message?: string; details?: unknown };
  } | null;

  if (!response.ok) {
    throw new RequestError(
      response.status,
      body?.error?.code ?? 'UPSTREAM_ERROR',
      body?.error?.message ?? `The shop answered ${response.status}. Try again in a moment.`,
      body?.error?.details,
    );
  }

  return body?.data as T;
}

/**
 * Field-level messages from a 422, keyed by the path the API reports — `body`, `orderNumber`.
 * Anything without a path falls through to the error's own message, shown above the form.
 */
export function fieldErrorsOf(error: unknown): Record<string, string> {
  if (!(error instanceof RequestError) || !Array.isArray(error.details)) return {};
  const out: Record<string, string> = {};
  for (const issue of error.details as { path?: unknown; message?: unknown }[]) {
    if (typeof issue.path === 'string' && typeof issue.message === 'string' && !out[issue.path]) {
      out[issue.path] = issue.message;
    }
  }
  return out;
}
