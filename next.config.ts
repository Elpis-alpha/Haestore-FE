import type { NextConfig } from 'next';
import { securityHeaders } from './src/lib/security/headers';
import { assertWorkerApiOrigin } from './src/lib/proxy/api-origin';
import { assertTestModeKeys } from './src/lib/security/payment-mode';

const API_ORIGIN = process.env.API_ORIGIN ?? 'http://127.0.0.1:5000';

// A live Stripe key fails the build rather than shipping a checkout that takes real
// money (ADR-016).
assertTestModeKeys(process.env);
// A Worker build with no API_ORIGIN, or one with a port, would proxy every /api call to
// a 500 (lib/proxy/api-origin.ts).
assertWorkerApiOrigin(process.env);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  experimental: {
    /**
     * Enables React's <ViewTransition>, which is how the product card grows into the
     * product page rather than the page simply being replaced.
     *
     * It is flagged experimental in Next 15 but the underlying API is the browser's
     * own: without it, `startViewTransition` never wraps the App Router's navigation,
     * so a cross-page shared element is not expressible at all. The fallback is not a
     * broken animation, it is no animation — see src/components/motion/transition.tsx.
     */
    viewTransition: true,
  },

  images: {
    /**
     * Image optimization is delegated to Cloudinary rather than running on Worker CPU.
     *
     * Cloudflare Workers cannot run Next's built-in optimizer, and the alternative
     * (Cloudflare Images) is a second paid service for something Cloudinary already
     * does — including generating the LQIP used for `placeholder="blur"`.
     */
    loader: 'custom',
    loaderFile: './src/lib/images/image-loader.ts',
  },

  async headers() {
    /**
     * Production only: the development server needs `eval` for Fast Refresh, and a CSP
     * that has to be loosened to work in development is one nobody trusts when it
     * reports. `next build` — and so the Worker — always runs as production.
     */
    if (process.env.NODE_ENV !== 'production') return [];
    return [{ source: '/:path*', headers: securityHeaders() }];
  },

  async rewrites() {
    return [
      /**
       * Session-bearing calls are proxied so the browser only ever sees one origin.
       *
       * This is load-bearing, not a convenience: it is what makes the `__Host-` cookie
       * prefix legal, removes CORS entirely, avoids SameSite=None (which
       * third-party-cookie blocking breaks), and prevents auth working locally but
       * failing in production. See docs/ARCHITECTURE.md.
       */
      { source: '/api/:path*', destination: `${API_ORIGIN}/api/:path*` },
    ];
  },
};

export default nextConfig;
