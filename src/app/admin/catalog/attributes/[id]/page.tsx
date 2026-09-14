import type { Metadata } from 'next';
import { adminRead } from '@/lib/admin/server';
import type { AttributeDefinition, AttributeUsage } from '@/lib/admin/types';
import { plural } from '@/lib/admin/format';
import { PageHeader } from '@/components/admin/ledger';
import { AttributeForm } from '@/components/admin/attribute-form';

export const metadata: Metadata = { title: 'Attribute' };

type PageProps = { params: Promise<{ id: string }> };

export default async function AttributePage({ params }: PageProps) {
  const { id } = await params;
  const back = `/admin/catalog/attributes/${id}`;
  const [{ data: definition }, { data: usage }] = await Promise.all([
    adminRead<{ data: AttributeDefinition }>(`/api/admin/catalog/attributes/${id}`, back),
    adminRead<{ data: AttributeUsage }>('/api/admin/catalog/attributes/usage', back),
  ]);
  const used = usage[definition.key] ?? { categories: 0, products: 0 };

  return (
    <>
      <PageHeader
        back={{ href: '/admin/catalog/attributes', label: 'attributes' }}
        title={definition.label}
        description={`Bound to ${plural(used.categories, 'category', 'categories')} and set on ${plural(used.products, 'product')}.`}
      />
      <AttributeForm definition={definition} usage={used} />
    </>
  );
}
