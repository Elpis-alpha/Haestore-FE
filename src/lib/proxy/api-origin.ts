/**
 * What the Worker build demands of `API_ORIGIN`: that it is set, and has no port.
 *
 * **No port, because OpenNext cannot rewrite to one.** It compiles a rewrite
 * destination's host with path-to-regexp, which reads the `:5003` in
 * `http://host:5003` as a parameter named "5003" and throws on every `/api/*`
 * request — `Expected "5003" to be a string`, a 500 from the Worker, and nothing in the
 * API's log. `next dev` and `next start` parse the destination as a URL first and are
 * unaffected, which is how this went unseen until the Worker was run against an API.
 * Current as of @opennextjs/aws 4.1.5. A production API sits behind nginx on 443, so
 * its origin has no port; for local runs, see docs/LOCAL-DEV.md.
 *
 * **Set, because the fallback is a machine's loopback**, which a Worker cannot reach.
 *
 * Only the Worker build is checked (`cf:build` sets `HAESTORE_BUILD_TARGET=workers`).
 */
export function assertWorkerApiOrigin(env: Record<string, string | undefined>): void {
  if (env.HAESTORE_BUILD_TARGET !== 'workers') return;

  const origin = env.API_ORIGIN;
  if (!origin) {
    throw new Error(
      'API_ORIGIN is not set for the Worker build. It is baked into the /api rewrite — set it to the API’s public origin (docs/DEPLOYMENT.md).',
    );
  }
  if (new URL(origin).port !== '') {
    throw new Error(
      `API_ORIGIN "${origin}" has a port, which the Worker's /api rewrite cannot reach: OpenNext reads ":port" as a route parameter and every /api call fails with a 500. Use an origin without one, such as the nginx front of the API (docs/DEPLOYMENT.md).`,
    );
  }
}
