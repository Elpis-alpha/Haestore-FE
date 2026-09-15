import { defineConfig, devices } from '@playwright/test';

/**
 * The end-to-end suite, against a running shop.
 *
 * It does not start the stack itself. The shop is three repos, four datastores and two
 * servers, and a config that tried to boot them all would be a second, worse copy of
 * LOCAL-DEV.md. Start them as that document says — with the API on `MAIL_DRIVER=console` and
 * `keeper@haestore.test` in `ADMIN_EMAILS` — seed, and run `npm run e2e`.
 *
 * One worker, in order: the flows share one database, and the purchase flow's second half
 * (the console delivering the order, the customer reviewing it) needs its first.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 180_000,
  expect: { timeout: 15_000 },
  outputDir: './test-results',
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    // Reduced motion, because a view transition mid-click is a flaky test rather than a
    // finding — the transitions themselves were checked by hand in Phase 4.
    reducedMotion: 'reduce',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
