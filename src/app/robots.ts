import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/seo/site';

/**
 * What a crawler may walk.
 *
 * Disallowed: the places with nothing public in them — the API, the admin console, the
 * account area and checkout, all of which either redirect a crawler to the sign-in page or
 * answer with somebody's session. Everything else is crawlable, and the pages that should not
 * be *indexed* — the sign-in page, the bag, a filtered or searched shelf — say so with their
 * own `noindex`. That split is deliberate: a disallowed URL is never fetched, so its `noindex`
 * is never read, and a page linked from everywhere can then be indexed from its links alone.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin', '/account', '/checkout'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
