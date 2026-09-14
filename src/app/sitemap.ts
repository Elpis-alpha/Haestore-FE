import type { MetadataRoute } from 'next';
import { getSitemapEntries, softly } from '@/lib/api/client';
import { absoluteUrl } from '@/lib/seo/site';

/**
 * The shop, as a list of pages worth indexing.
 *
 * **Shelves and products, and nothing combinatorial.** A shelf with filters ticked, a search
 * result and a later page of a listing are all `noindex` (see FRONTEND.md, "Indexing"), and a
 * sitemap is the one document where the shop states which of its URLs matter — listing one
 * of those here would contradict the page's own meta tag. The API only knows how to return
 * live shelves and live products, so this cannot drift into listing anything else.
 *
 * Read with `softly`: if the API is unreachable when this is generated, the sitemap is the
 * handful of fixed pages until the next revalidation, rather than a 500 that a search engine
 * remembers.
 */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await softly(getSitemapEntries(), { categories: [], products: [] });

  return [
    { url: absoluteUrl('/'), changeFrequency: 'daily', priority: 1 },
    { url: absoluteUrl('/shop'), changeFrequency: 'daily', priority: 0.8 },
    { url: absoluteUrl('/support'), changeFrequency: 'yearly', priority: 0.3 },
    ...entries.categories.map((category) => ({
      url: absoluteUrl(`/shop/${category.path}`),
      lastModified: category.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
    ...entries.products.map((product) => ({
      url: absoluteUrl(`/product/${product.slug}`),
      lastModified: product.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ];
}
