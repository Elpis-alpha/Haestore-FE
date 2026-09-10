/**
 * The session cookie's name, on its own, importable from anywhere.
 *
 * It lives in its own module because the middleware needs it and the middleware cannot
 * import `session.ts` — that file is `server-only` and calls `next/headers`, neither of
 * which exists in the middleware runtime. Duplicating the string instead would put two
 * copies of a value that must match a third in the backend, and the failure mode of a
 * mismatch is silent: sign-in appears to work and the guard never sees a cookie.
 *
 * The `__Host-` prefix is not decoration. A browser refuses a cookie carrying it unless
 * the cookie is `Secure`, has `Path=/` and declares **no `Domain`** — and that last
 * clause is what stops script on a compromised subdomain setting a session cookie the
 * API would accept. See `back-end/src/modules/auth/session-cookie.ts`, which sets it.
 */
export const SESSION_COOKIE = '__Host-hae_sid';
