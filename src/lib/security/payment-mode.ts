/**
 * The storefront half of ADR-016: the Worker is not built with a live Stripe key.
 *
 * Called from next.config.ts, so a live publishable key fails `next build` (and so
 * `cf:build`) rather than shipping a checkout that would take real money. The secret
 * half is refused by the API at boot. A PayPal client id carries no mode, so the sandbox
 * is enforced on the API's `PAYPAL_ENV` instead.
 */
export function assertTestModeKeys(env: Record<string, string | undefined>): void {
  const key = env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? '';
  if (key.startsWith('pk_live_')) {
    throw new Error(
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is a live key. Hæstore runs in Stripe test mode only — use a pk_test_ key (ADR-016).',
    );
  }
}
