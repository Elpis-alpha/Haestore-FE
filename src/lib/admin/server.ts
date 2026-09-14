import 'server-only';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { SESSION_COOKIE } from '@/lib/auth/cookie-name';

const API_ORIGIN = process.env.API_ORIGIN ?? 'http://127.0.0.1:5000';

/**
 * One admin read, on the server, as the signed-in admin.
 *
 * The cookie is forwarded explicitly, as in lib/auth/session.ts, and the response is never
 * cached — an admin page served from Next's fetch cache is one admin's view of the shop
 * shown to whoever asks for the URL next.
 *
 * The API's answers map onto the page's: 401 is a session that expired while the console
 * was open, so the person is sent to sign in and brought back; 404 is either a record that
 * does not exist or a non-admin, and both render the same not-found page — the admin
 * surface is not discoverable from the frontend any more than from the API.
 */
export async function adminRead<T>(path: string, returnTo: string): Promise<T> {
  const jar = await cookies();
  const sid = jar.get(SESSION_COOKIE)?.value;
  if (!sid) redirect(`/sign-in?next=${encodeURIComponent(returnTo)}`);

  const response = await fetch(`${API_ORIGIN}${path}`, {
    headers: { accept: 'application/json', cookie: `${SESSION_COOKIE}=${sid}` },
    cache: 'no-store',
  });

  if (response.status === 401) redirect(`/sign-in?next=${encodeURIComponent(returnTo)}`);
  if (response.status === 404) notFound();
  if (!response.ok) {
    throw new Error(`The admin API answered ${response.status} for ${path}.`);
  }

  return (await response.json()) as T;
}

/** A query string from a page's search params, dropping empties. */
export function queryOf(params: Record<string, string | string[] | undefined>, keys: string[]) {
  const search = new URLSearchParams();
  for (const key of keys) {
    const value = params[key];
    const single = Array.isArray(value) ? value[0] : value;
    if (single) search.set(key, single);
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}
