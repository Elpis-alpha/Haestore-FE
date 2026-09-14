import { AdminError } from './step-up';

export { AdminError } from './step-up';

/**
 * Admin mutations, from the browser.
 *
 * Through `/api/*`, the Next rewrite, for the reason every session-bearing call is: the
 * session is a `__Host-` cookie and exists on one origin only. Reads are not made here —
 * every admin page reads on the server, with the cookie forwarded, and a mutation is
 * followed by `router.refresh()` so the page re-reads what the server now holds rather
 * than patching a local copy that could disagree with it.
 */
export async function adminSend<T = unknown>(
  path: string,
  init: { method: 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'GET'; body?: unknown } = {
    method: 'POST',
  },
): Promise<T> {
  const response = await fetch(path, {
    method: init.method,
    headers: {
      accept: 'application/json',
      ...(init.body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    ...(init.body === undefined ? {} : { body: JSON.stringify(init.body) }),
    cache: 'no-store',
  });

  if (response.status === 204) return undefined as T;

  const body = (await response.json().catch(() => null)) as {
    data?: T;
    error?: { code?: string; message?: string; details?: unknown };
  } | null;

  if (!response.ok) {
    throw new AdminError(
      response.status,
      body?.error?.code ?? 'UPSTREAM_ERROR',
      body?.error?.message ?? `The shop answered ${response.status}. Try again in a moment.`,
      body?.error?.details,
    );
  }

  return body?.data as T;
}

/**
 * Field-level messages from a 422, keyed by the dotted path the API reports.
 *
 * The API's validation errors are `[{ path, message }]`, which maps straight onto a form:
 * `sections.2.primary.href` is the link field on the third section.
 */
export function fieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof AdminError) || !Array.isArray(error.details)) return {};
  const out: Record<string, string> = {};
  // A 422 names the field by `path`; the attribute validator's 400 names it by `key`,
  // because what it reports on is an attribute, not a position in the body.
  for (const issue of error.details as { path?: unknown; key?: unknown; message?: unknown }[]) {
    const where = typeof issue.path === 'string' ? issue.path : issue.key;
    if (typeof where === 'string' && typeof issue.message === 'string' && !out[where]) {
      out[where] = issue.message;
    }
  }
  return out;
}
