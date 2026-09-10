# Hæstore Web

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v4 · Cloudflare Workers

The storefront and admin console for [Hæstore](https://github.com/Elpis-alpha/haestore).
Architecture notes and ADRs live in the root repo.

## Running it

The API and datastores come from the other two repos:

```bash
cd .. && npm run up          # Mongo, Redis, Meilisearch, Mailpit
npm --prefix back-end run dev # API on :5000
```

Then:

```bash
cp .env.example .env.local
npm install
npm run dev                   # http://localhost:3000
```

There are no passwords — request a sign-in code and read it at
<http://localhost:8025>.

| Script               |                                              |
| -------------------- | -------------------------------------------- |
| `npm run dev`        | Next dev with Turbopack                      |
| `npm run build`      | production build                             |
| `npm run check`      | format, lint, typecheck, test — what CI runs |
| `npm run cf:build`   | build the Cloudflare Worker bundle           |
| `npm run cf:preview` | run the Worker locally in workerd            |
| `npm run cf:deploy`  | deploy to `heastore-web`                     |

## Deployment shapes the architecture

Three Cloudflare constraints were designed around rather than discovered late.

**No Node middleware.** The OpenNext adapter does not support Next 15's Node-runtime
middleware, so **there are no auth checks in `middleware.ts`**. Session gating happens
in Server Components and Route Handlers instead. Adding a `middleware.ts` that reads
the session will work locally and fail once deployed.

**Images go to Cloudinary.** Workers cannot run Next's built-in optimizer, so
`next.config.ts` registers a custom loader emitting Cloudinary transformation URLs
(`f_auto,q_auto,w_…`). Cloudinary also produces the LQIP for `placeholder="blur"`.

**Bundle size is capped** at 3 MiB compressed on the free tier. Currently **783 KiB**.
Check with `npx wrangler deploy --dry-run --outdir=.wrangler/dry` before adding a heavy
dependency to the server bundle. Static assets are served separately and do not count.

## Talking to the API

Two paths, and the difference matters.

**Catalog reads** — Server Components fetch Express directly, server-side, with
tag-based revalidation. No cookie, so no proxy needed.

**Anything session-bearing** — auth, cart, wishlist, checkout, orders — goes through
the `/api/:path*` rewrite in `next.config.ts` so the browser sees one origin. That is
what makes the `__Host-` cookie prefix legal, removes CORS, and avoids `SameSite=None`.
Do not bypass it by calling the API origin directly from the browser.

## Design language

The logo is a serif **H** whose crossbar is a leaf and whose top is a shopping-bag
handle arch, cream on chocolate. Three motifs follow from it and are used consistently:
the **arch** (product frames, category cards, section headers), the **leaf** (dividers,
bullets, in-stock marks), and **paper on wood** (cream cards on the dark ground under a
fixed grain overlay).

Tokens are Tailwind v4 `@theme` variables in `src/app/globals.css`. Type is Fraunces
for display and Karla for interface, self-hosted through `next/font`.

See `docs/DESIGN-SYSTEM.md` in the root repo.
