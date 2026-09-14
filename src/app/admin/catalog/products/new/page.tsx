import type { Metadata } from 'next';
import Link from 'next/link';
import { adminRead } from '@/lib/admin/server';
import type { AdminCategoryNode, EffectiveAttributeSet } from '@/lib/admin/types';
import { flattenTree } from '@/lib/admin/tree';
import { Empty, PageHeader } from '@/components/admin/ledger';
import { ProductEditor } from '@/components/admin/product-editor';

export const metadata: Metadata = { title: 'Add a product' };

type PageProps = { searchParams: Promise<{ categoryId?: string }> };

/**
 * A product starts with its shelf, because the shelf decides the form. Until one is chosen
 * there is nothing to ask — the fields a teapot needs and the fields a coffee needs are
 * different fields, and neither is known to the code.
 */
export default async function NewProductPage({ searchParams }: PageProps) {
  const { categoryId } = await searchParams;
  const here = `/admin/catalog/products/new${categoryId ? `?categoryId=${categoryId}` : ''}`;
  const { data: tree } = await adminRead<{ data: AdminCategoryNode[] }>(
    '/api/admin/catalog/categories',
    here,
  );
  const flat = flattenTree(tree);
  const category = categoryId ? flat.find((c) => c._id === categoryId) : undefined;

  if (!category) {
    return (
      <>
        <PageHeader
          back={{ href: '/admin/catalog/products', label: 'products' }}
          title="Add a product"
          description="Which shelf does it go on? The shelf decides what the form asks for."
        />
        {flat.length === 0 ? (
          <Empty>
            There are no shelves yet.{' '}
            <Link href="/admin/catalog/categories" className="underline underline-offset-4">
              Add one first
            </Link>
            .
          </Empty>
        ) : (
          <ul className="surface-paper flex max-w-xl flex-col rounded-md border border-[var(--edge)] p-2">
            {flat.map((c) => (
              <li key={c._id}>
                <Link
                  href={`/admin/catalog/products/new?categoryId=${c._id}`}
                  style={{ paddingLeft: `${0.75 + c.depth * 1}rem` }}
                  className="block rounded-sm py-2 pr-3 text-sm transition-colors hover:bg-[var(--groove)]"
                >
                  {c.name}
                  <span className="ml-2 text-xs text-[var(--ink-faint)]">{c.path}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </>
    );
  }

  const { data: set } = await adminRead<{ data: EffectiveAttributeSet }>(
    `/api/admin/catalog/categories/${category._id}/effective-attributes`,
    here,
  );

  return (
    <>
      <PageHeader
        back={{ href: '/admin/catalog/products/new', label: 'choosing a shelf' }}
        title="Add a product"
        description={`On ${category.name}. It is saved as a draft until you put it on the shelves.`}
      />
      <ProductEditor set={set} categories={flat} categoryId={category._id} />
    </>
  );
}
