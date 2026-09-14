import type { Metadata } from 'next';
import Link from 'next/link';
import { adminRead } from '@/lib/admin/server';
import type { AttributeDefinition, AttributeUsage } from '@/lib/admin/types';
import { FILTER_UI_LABELS, TYPE_LABELS } from '@/lib/admin/attribute-rules';
import { plural } from '@/lib/admin/format';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Empty,
  FilterLinks,
  Ledger,
  LedgerHead,
  PageHeader,
  cellClass,
  rowClass,
} from '@/components/admin/ledger';

export const metadata: Metadata = { title: 'Attributes' };

type PageProps = { searchParams: Promise<{ archived?: string }> };

/**
 * Every kind of fact the shop can record about a product.
 *
 * This list is the adaptable catalogue in one table: each row is something the code has
 * never heard of, defined by an admin, and on the right is where it is already in use.
 */
export default async function AttributesPage({ searchParams }: PageProps) {
  const { archived } = await searchParams;
  const showArchived = archived === 'true';

  const [{ data: definitions }, { data: usage }] = await Promise.all([
    adminRead<{ data: AttributeDefinition[] }>(
      `/api/admin/catalog/attributes${showArchived ? '?includeArchived=true' : ''}`,
      '/admin/catalog/attributes',
    ),
    adminRead<{ data: AttributeUsage }>(
      '/api/admin/catalog/attributes/usage',
      '/admin/catalog/attributes',
    ),
  ]);

  const typeLabel = (type: AttributeDefinition['type']) => TYPE_LABELS[type].label;

  return (
    <>
      <PageHeader
        title="Attributes"
        description="The facts a product can carry. Bind one to a category and every product on that shelf gets a field for it; mark it a filter and the shop gets a way to narrow by it."
        actions={
          <Button asChild>
            <Link href="/admin/catalog/attributes/new">Define an attribute</Link>
          </Button>
        }
      />

      <div className="mb-4">
        <FilterLinks
          items={[
            { href: '/admin/catalog/attributes', label: 'In use', active: !showArchived },
            {
              href: '/admin/catalog/attributes?archived=true',
              label: 'Including archived',
              active: showArchived,
            },
          ]}
        />
      </div>

      {definitions.length === 0 ? (
        <Empty>
          Nothing is defined yet. Start with the fact shoppers most often choose by — a roast, a
          size, a colour.
        </Empty>
      ) : (
        <Ledger>
          <LedgerHead
            columns={[
              { label: 'Attribute' },
              { label: 'Kind' },
              { label: 'As a filter' },
              { label: 'Variants' },
              { label: 'Used by' },
            ]}
          />
          <tbody>
            {definitions.map((definition) => {
              const used = usage[definition.key];
              return (
                <tr key={definition._id} className={rowClass}>
                  <td className={cellClass}>
                    <Link
                      href={`/admin/catalog/attributes/${definition._id}`}
                      className="font-medium hover:underline"
                    >
                      {definition.label}
                    </Link>
                    <span className="mt-0.5 flex items-center gap-2">
                      <code className="font-mono text-xs text-[var(--ink-muted)]">
                        {definition.key}
                      </code>
                      {definition.archivedAt && <Badge tone="neutral">Archived</Badge>}
                    </span>
                  </td>
                  <td className={`${cellClass} text-[var(--ink-muted)]`}>
                    {typeLabel(definition.type)}
                    {definition.options.length > 0 && (
                      <span className="block text-xs">
                        {plural(definition.options.length, 'option')}
                      </span>
                    )}
                  </td>
                  <td className={`${cellClass} text-[var(--ink-muted)]`}>
                    {definition.isFilterable ? FILTER_UI_LABELS[definition.filterUi] : 'No'}
                  </td>
                  <td className={`${cellClass} text-[var(--ink-muted)]`}>
                    {definition.isVariantAxis ? 'Can be an axis' : '—'}
                  </td>
                  <td className={`${cellClass} text-[var(--ink-muted)]`}>
                    {used ? (
                      <>
                        {plural(used.categories, 'category', 'categories')}
                        <span className="block text-xs">{plural(used.products, 'product')}</span>
                      </>
                    ) : (
                      'Nothing yet'
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Ledger>
      )}
    </>
  );
}
