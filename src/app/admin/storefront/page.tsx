import type { Metadata } from 'next';
import { adminRead } from '@/lib/admin/server';
import type {
  AdminCategoryNode,
  AdminProductSummary,
  Paged,
  StorefrontState,
} from '@/lib/admin/types';
import { flattenTree } from '@/lib/admin/tree';
import { PageHeader } from '@/components/admin/ledger';
import { StorefrontComposer } from '@/components/admin/storefront-composer';

export const metadata: Metadata = { title: 'Front page' };

/**
 * The storefront composer.
 *
 * The front page is a list of versions. One is live; at most one is a draft; the rest are
 * the page as it was, any of which can be put back. Nothing on this screen edits the live
 * page — the draft is edited, and publishing swaps it in whole.
 */
export default async function StorefrontPage() {
  const [{ data: state }, { data: tree }, products] = await Promise.all([
    adminRead<{ data: StorefrontState }>('/api/admin/storefront/home', '/admin/storefront'),
    adminRead<{ data: AdminCategoryNode[] }>('/api/admin/catalog/categories', '/admin/storefront'),
    adminRead<Paged<AdminProductSummary>>(
      '/api/admin/catalog/products?status=active&perPage=60',
      '/admin/storefront',
    ),
  ]);

  return (
    <>
      <PageHeader
        title="Front page"
        description="Compose the page in a draft, preview it, and publish it whole. Every earlier version is kept and can be put back."
      />
      <StorefrontComposer
        // Re-seeded from the server whenever the draft moves on — after a save, a publish, or
        // a 409 that means someone else saved first.
        key={`${state.draft?.id ?? 'none'}-${state.draft?.revision ?? 0}-${state.published?.version ?? 0}`}
        state={state}
        categories={flattenTree(tree)
          .filter((c) => c.status === 'active')
          .map((c) => ({ id: c._id, name: c.name, depth: c.depth }))}
        products={products.data.map((p) => ({ id: p.id, title: p.title }))}
      />
    </>
  );
}
