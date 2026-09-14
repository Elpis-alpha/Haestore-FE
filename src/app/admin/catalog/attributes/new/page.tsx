import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/ledger';
import { AttributeForm } from '@/components/admin/attribute-form';

export const metadata: Metadata = { title: 'Define an attribute' };

export default function NewAttributePage() {
  return (
    <>
      <PageHeader
        back={{ href: '/admin/catalog/attributes', label: 'attributes' }}
        title="Define an attribute"
        description="Something the shop should know about its products. The code has never heard of it and does not need to."
      />
      <AttributeForm />
    </>
  );
}
