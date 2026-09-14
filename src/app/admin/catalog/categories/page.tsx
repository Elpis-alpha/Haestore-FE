import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { adminRead } from '@/lib/admin/server';
import type {
  AdminCategoryNode,
  AttributeDefinition,
  EffectiveAttributeSet,
} from '@/lib/admin/types';
import { findNode, flattenTree, moveTargets } from '@/lib/admin/tree';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/badge';
import { Empty, PageHeader } from '@/components/admin/ledger';
import { CategoryEditor, NewCategoryForm } from '@/components/admin/category-editor';

export const metadata: Metadata = { title: 'Categories' };

type PageProps = { searchParams: Promise<{ id?: string }> };

/**
 * The shelves, and what each one asks of the products on it.
 *
 * The tree on the left is the whole shop; choosing a shelf opens it on the right, where the
 * interesting part is the attribute table — every fact products here must or may carry,
 * each saying whether this shelf set it or inherited it from one above. That inheritance
 * is the adaptable catalogue's central idea, and this is the one screen that shows it.
 */
export default async function CategoriesPage({ searchParams }: PageProps) {
  const { id } = await searchParams;
  const here = id ? `/admin/catalog/categories?id=${id}` : '/admin/catalog/categories';

  const [{ data: tree }, { data: definitions }] = await Promise.all([
    adminRead<{ data: AdminCategoryNode[] }>('/api/admin/catalog/categories', here),
    adminRead<{ data: AttributeDefinition[] }>('/api/admin/catalog/attributes', here),
  ]);
  const flat = flattenTree(tree);

  const node = id ? findNode(tree, id) : null;
  if (id && !node) notFound();

  const effective = node
    ? (
        await adminRead<{ data: EffectiveAttributeSet }>(
          `/api/admin/catalog/categories/${node._id}/effective-attributes`,
          here,
        )
      ).data
    : null;

  return (
    <>
      <PageHeader
        title="Categories"
        description="Attributes bound to a shelf apply to every shelf beneath it, unless a lower shelf hides or changes them."
      />

      <div className="grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[16rem_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          {flat.length === 0 ? (
            <Empty>No shelves yet.</Empty>
          ) : (
            <nav aria-label="Category tree">
              <ul className="surface-well flex flex-col rounded-lg p-2">
                {flat.map((category) => (
                  <li key={category._id}>
                    <Link
                      href={`/admin/catalog/categories?id=${category._id}`}
                      aria-current={category._id === id ? 'page' : undefined}
                      style={{ paddingLeft: `${0.625 + category.depth * 0.875}rem` }}
                      className={cn(
                        'flex items-center justify-between gap-2 rounded-sm py-1.5 pr-2 text-sm transition-colors',
                        category._id === id
                          ? 'bg-[var(--ink)]/10 font-medium text-[var(--ink)]'
                          : 'text-[var(--ink-muted)] hover:bg-[var(--ink)]/6 hover:text-[var(--ink)]',
                      )}
                    >
                      <span className="truncate">{category.name}</span>
                      {category.status === 'hidden' && <Badge tone="neutral">Hidden</Badge>}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          )}
          <NewCategoryForm />
        </div>

        {node && effective ? (
          <CategoryEditor
            // Remounted per shelf, so one shelf's half-typed edits never appear on another.
            key={node._id}
            category={{ ...node, childCount: node.children.length }}
            effective={effective}
            definitions={definitions}
            moveOptions={moveTargets(flat, node._id)}
            parentName={flat.find((c) => c._id === node.parent)?.name ?? null}
          />
        ) : (
          <Empty>Choose a shelf to see what it asks of its products.</Empty>
        )}
      </div>
    </>
  );
}
