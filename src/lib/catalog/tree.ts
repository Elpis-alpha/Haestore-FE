import type { Category } from '@/lib/api/types';

/**
 * Shaping the flat category list the API returns.
 *
 * `/api/catalog/categories` returns every active category sorted depth-first by
 * `{depth, order, name}`, with `parent` and a root-first `ancestors` array that includes
 * the category itself. Everything the storefront needs — a nav tree, a breadcrumb, a
 * child list — is a rearrangement of that one document, which is why it is fetched once
 * and shared rather than queried per shape.
 */

export type CategoryNode = Category & { children: CategoryNode[] };

/**
 * Builds the tree.
 *
 * A category whose parent is missing from the list is attached at the root rather than
 * dropped. That happens when an ancestor is archived while its child is still active —
 * an admin mistake the storefront should make visible by still showing the goods, not
 * one it should hide by silently losing a branch.
 */
export function buildTree(categories: Category[]): CategoryNode[] {
  const nodes = new Map<string, CategoryNode>(
    categories.map((c) => [c._id, { ...c, children: [] }]),
  );
  const roots: CategoryNode[] = [];

  for (const category of categories) {
    const node = nodes.get(category._id);
    if (!node) continue;
    const parent = category.parent ? nodes.get(category.parent) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }

  return roots;
}

/**
 * The trail from the root down to `path`, derived from the path itself rather than from
 * `ancestors`.
 *
 * `ancestors` holds ids, and a breadcrumb needs links. The path is already the slugs
 * joined with `/` — `coffee-tea/beans` — so each prefix of it is a category URL, and
 * looking each one up by path gives names without a second request.
 */
export function breadcrumbFor(categories: Category[], path: string): Category[] {
  const byPath = new Map(categories.map((c) => [c.path, c]));
  const segments = path.split('/').filter(Boolean);
  const trail: Category[] = [];

  for (let i = 0; i < segments.length; i += 1) {
    const category = byPath.get(segments.slice(0, i + 1).join('/'));
    if (category) trail.push(category);
  }

  return trail;
}

export function shopHref(path: string): string {
  return `/shop/${path}`;
}

/** Roots only, for the header nav and the home page's shelves. */
export function topLevel(categories: Category[]): Category[] {
  return categories.filter((c) => c.depth === 0);
}

export function childrenOf(categories: Category[], parentId: string): Category[] {
  return categories.filter((c) => c.parent === parentId);
}
