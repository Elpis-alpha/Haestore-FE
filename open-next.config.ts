import { defineCloudflareConfig } from '@opennextjs/cloudflare';
import kvIncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache';
import memoryQueue from '@opennextjs/cloudflare/overrides/queue/memory-queue';

/**
 * Pages and fetches are cached in Workers KV (`NEXT_INC_CACHE_KV`), and OpenNext keys
 * every entry by build id — so a deploy never serves a page rendered against the
 * previous API contract, which is what crashed a product page in Phase 9.
 *
 * Time-based revalidation (60s products, 300s home, 3600s sitemap) runs through the
 * memory queue, which asks the Worker itself (`WORKER_SELF_REFERENCE`) to re-render.
 *
 * **There is no tag cache**, deliberately: `revalidateTag` has one caller — the
 * composer's Publish — and a tag cache would cost a database read on every cached page
 * to make that one action instant rather than within five minutes. docs/DEPLOYMENT.md
 * says how to add one (D1) if that trade changes.
 */
export default defineCloudflareConfig({
  incrementalCache: kvIncrementalCache,
  queue: memoryQueue,
});
