import type { Metadata } from 'next';
import { adminRead } from '@/lib/admin/server';
import type { AdminCategoryNode, AdminProduct, EffectiveAttributeSet } from '@/lib/admin/types';
import { flattenTree } from '@/lib/admin/tree';
import { PageHeader } from '@/components/admin/ledger';
import { ProductEditor } from '@/components/admin/product-editor';

export const metadata: Metadata = { title: 'Product' };

type PageProps = { params: Promise<{ id: string }> };

export default async function AdminProductPage({ params }: PageProps) {
  const { id } = await params;
  const here = `/admin/catalog/products/${id}`;

  const [{ data: product }, { data: tree }] = await Promise.all([
    adminRead<{ data: AdminProduct }>(`/api/admin/catalog/products/${id}`, here),
    adminRead<{ data: AdminCategoryNode[] }>('/api/admin/catalog/categories', here),
  ]);
  const { data: set } = await adminRead<{ data: EffectiveAttributeSet }>(
    `/api/admin/catalog/categories/${product.category}/effective-attributes`,
    here,
  );
  const categories = flattenTree(tree);

  return (
    <>
      <PageHeader
        back={{ href: '/admin/catalog/products', label: 'products' }}
        title={product.title}
        description={`On ${categories.find((c) => c._id === product.category)?.name ?? 'an unknown shelf'}.`}
      />
      {/* Keyed on the last write, so a save that changed the shape re-seeds the form. */}
      <ProductEditor
        key={product.updatedAt}
        product={product}
        set={set}
        categories={categories}
        categoryId={product.category}
      />
    </>
  );
}
