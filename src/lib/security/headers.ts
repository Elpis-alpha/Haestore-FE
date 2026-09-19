/**
 * Response headers for every page, and the Content-Security-Policy in particular.
 *
 * **`script-src` carries `'unsafe-inline'`, on purpose.** The App Router streams its
 * payload through inline scripts, which a CSP accepts only with a per-request nonce or
 * `'unsafe-inline'`. A nonce means middleware on every page render — and a page that
 * reads a nonce can no longer be cached, which undoes the storefront's ISR. What the
 * policy still does is real: no framing (`frame-ancestors`), no plugins, no `<base>`
 * hijack, forms that post only here, and scripts, frames and connections only from the
 * origins named below. JSON-LD is safe for a different reason — its serialiser
 * (lib/seo/structured-data.ts).
 *
 * Every origin is here because something on the site needs it:
 *   - Stripe.js and its 3-D Secure frames (hooks.stripe.com)
 *   - the PayPal SDK, which loads further scripts, frames and images from paypal.com and
 *     paypalobjects.com, sandbox included
 *   - photographs from Cloudinary and Unsplash (ADR-015)
 *   - the console's signed upload straight to api.cloudinary.com
 */
const STRIPE = ['https://js.stripe.com', 'https://*.js.stripe.com'];
const PAYPAL = ['https://www.paypal.com', 'https://*.paypal.com', 'https://*.paypalobjects.com'];

const POLICY: Record<string, string[]> = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", ...STRIPE, ...PAYPAL],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': [
    "'self'",
    'data:',
    'blob:',
    'https://res.cloudinary.com',
    'https://images.unsplash.com',
    'https://*.stripe.com',
    'https://*.paypal.com',
    'https://*.paypalobjects.com',
  ],
  'font-src': ["'self'", 'data:'],
  'connect-src': ["'self'", 'https://api.cloudinary.com', 'https://api.stripe.com', ...PAYPAL],
  'frame-src': [...STRIPE, 'https://hooks.stripe.com', 'https://*.paypal.com'],
  'frame-ancestors': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
};

export function contentSecurityPolicy(): string {
  return [
    ...Object.entries(POLICY).map(([name, sources]) => `${name} ${sources.join(' ')}`),
    'upgrade-insecure-requests',
  ].join('; ');
}

export function securityHeaders(): { key: string; value: string }[] {
  return [
    { key: 'Content-Security-Policy', value: contentSecurityPolicy() },
    // No includeSubDomains: it would bind every subdomain of whatever domain the shop is
    // deployed under, which this repository does not own the rest of.
    { key: 'Strict-Transport-Security', value: 'max-age=31536000' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), payment=(self)',
    },
  ];
}
