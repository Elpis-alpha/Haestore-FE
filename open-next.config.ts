import { defineCloudflareConfig } from '@opennextjs/cloudflare';

export default defineCloudflareConfig({
  // Incremental cache is added in Phase 4 alongside ISR, backed by a Workers KV
  // namespace. Left unconfigured here so Phase 0 stays a scaffold.
});
