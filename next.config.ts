import type { NextConfig } from 'next';

const API_ORIGIN = process.env.API_ORIGIN ?? 'http://127.0.0.1:5000';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,

  images: {
    /**
     * Image optimization is delegated to Cloudinary rather than running on Worker CPU.
     *
     * Cloudflare Workers cannot run Next's built-in optimizer, and the alternative
     * (Cloudflare Images) is a second paid service for something Cloudinary already
     * does — including generating the LQIP used for `placeholder="blur"`.
     */
    loader: 'custom',
    loaderFile: './src/lib/images/cloudinary-loader.ts',
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
