import type { Metadata } from 'next';
import Link from 'next/link';
import { adminRead, queryOf } from '@/lib/admin/server';
import type { AdminProductSummary, Paged } from '@/lib/admin/types';
import { formatDate, plural } from '@/lib/admin/format';
import { formatMoneyRange } from '@/lib/money';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Empty,
  FilterLinks,
  Ledger,
  LedgerHead,
  PageHeader,
  Pager,
  cellClass,
  rowClass,
} from '@/components/admin/ledger';
import { SearchForm } from '@/components/admin/search-form';

export const metadata: Metadata = { title: 'Products' };

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const STATUS = {
  active: { label: 'Live', tone: 'good' },
  draft: { label: 'Draft', tone: 'note' },
  archived: { label: 'Archived', tone: 'neutral' },
} as const;

export default async function AdminProductsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const single = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const status = single('status');
  const q = single('q');
  const needsAttention = single('needsAttention');
  const categoryId = single('categoryId');

  const { data: products, page } = await adminRead<Paged<AdminProductSummary>>(
    `/api/admin/catalog/products${queryOf(params, ['status', 'q', 'needsAttention', 'categoryId', 'page'])}`,
    '/admin/catalog/products',
  );

  const filterHref = (extra: string) =>
    `/admin/catalog/products${extra}${categoryId ? `${extra ? '&' : '?'}categoryId=${categoryId}` : ''}`;

  return (
    <>
      <PageHeader
        title="Products"
        description="Drafts and archived products included. Most recently changed first."
        actions={
          <Button asChild>
            <Link href="/admin/catalog/products/new">Add a product</Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <FilterLinks
          items={[
            { href: filterHref(''), label: 'All', active: !status && !needsAttention },
            { href: filterHref('?status=active'), label: 'Live', active: status === 'active' },
            { href: filterHref('?status=draft'), label: 'Drafts', active: status === 'draft' },
            {
              href: filterHref('?status=archived'),
              label: 'Archived',
              active: status === 'archived',
            },
            {
              href: filterHref('?needsAttention=true'),
              label: 'Needs attention',
              active: needsAttention === 'true',
            },
          ]}
        />
        <SearchForm
          action="/admin/catalog/products"
          label="Find a product"
          placeholder="Title or exact SKU"
          defaultValue={q}
          keep={{ status, needsAttention, categoryId }}
        />
      </div>

      {categoryId && (
        <p className="mb-3 text-sm text-[var(--ink-muted)]">
          Showing one shelf and everything beneath it.{' '}
          <Link href="/admin/catalog/products" className="underline underline-offset-4">
            Show every shelf
          </Link>
        </p>
      )}

      {products.length === 0 ? (
        <Empty>
          {q
            ? `Nothing matches “${q}”.`
            : needsAttention
              ? 'Nothing needs attention.'
              : 'No products here yet.'}
        </Empty>
      ) : (
        <Ledger>
          <LedgerHead
            columns={[
              { label: 'Product' },
              { label: 'Status' },
              { label: 'Variants', align: 'right' },
              { label: 'Available', align: 'right' },
              { label: 'Price', align: 'right' },
              { label: 'Changed' },
            ]}
          />
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className={rowClass}>
                <td className={cellClass}>
                  <Link
                    href={`/admin/catalog/products/${product.id}`}
                    className="font-medium hover:underline"
                  >
                    {product.title}
                  </Link>
                  <span className="block text-xs text-[var(--ink-muted)]">
                    {product.category?.path ?? 'No category'}
                  </span>
                </td>
                <td className={cellClass}>
                  <span className="flex flex-wrap gap-1.5">
                    <Badge tone={STATUS[product.status].tone}>{STATUS[product.status].label}</Badge>
                    {product.needsAttention && (
                      <Badge tone="bad">{plural(product.issueCount, 'issue')}</Badge>
                    )}
                  </span>
                </td>
                <td className={`${cellClass} tabular text-right`}>{product.variantCount}</td>
                <td
                  className={`${cellClass} tabular text-right ${product.variantCount > 0 && product.available === 0 ? 'text-[var(--bad)]' : ''}`}
                >
                  {product.available}
                </td>
                <td className={`${cellClass} tabular text-right whitespace-nowrap`}>
                  {product.priceRange
                    ? formatMoneyRange(
                        { amount: product.priceRange.min, currency: product.priceRange.currency },
                        { amount: product.priceRange.max, currency: product.priceRange.currency },
                      )
                    : '—'}
                </td>
                <td className={`${cellClass} whitespace-nowrap text-[var(--ink-muted)]`}>
                  {formatDate(product.updatedAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </Ledger>
      )}

      <Pager
        page={page.page}
        totalPages={page.totalPages}
        total={page.total}
        basePath="/admin/catalog/products"
        params={{ status, q, needsAttention, categoryId }}
      />
    </>
  );
}
