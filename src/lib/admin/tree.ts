import type { AdminCategory, AdminCategoryNode } from './types';

/** A category as a row of an indented list: the node without its children, and how many. */
export type FlatCategory = AdminCategory & { childCount: number };

/** The tree as an indented list, depth-first, in the tree's own order. */
export function flattenTree(nodes: AdminCategoryNode[]): FlatCategory[] {
  return nodes.flatMap(({ children, ...category }) => [
    { ...category, childCount: children.length },
    ...flattenTree(children),
  ]);
}

export function findNode(nodes: AdminCategoryNode[], id: string): AdminCategoryNode | null {
  for (const node of nodes) {
    if (node._id === id) return node;
    const found = findNode(node.children, id);
    if (found) return found;
  }
  return null;
}

/**
 * Where a category may be moved to.
 *
 * `ancestors` includes self, so "not this node and nothing beneath it" is one test against
 * the materialised ancestry — the same test the server makes before it refuses the move.
 */
export function moveTargets(flat: FlatCategory[], id: string): FlatCategory[] {
  return flat.filter((category) => !category.ancestors.includes(id));
}
