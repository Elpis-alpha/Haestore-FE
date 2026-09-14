import { describe, expect, it } from 'vitest';
import type { AdminCategoryNode } from './types';
import { flattenTree, moveTargets } from './tree';

const node = (id: string, ancestors: string[], children: AdminCategoryNode[] = []) =>
  ({
    _id: id,
    name: id,
    slug: id,
    path: ancestors.join('/'),
    parent: ancestors.length > 1 ? ancestors[ancestors.length - 2]! : null,
    ancestors,
    depth: ancestors.length - 1,
    order: 0,
    status: 'active',
    validationMode: 'lenient',
    attributeBindings: [],
    suppressedKeys: [],
    children,
  }) as AdminCategoryNode;

const tree = [
  node(
    'home',
    ['home'],
    [node('ceramics', ['home', 'ceramics'], [node('mugs', ['home', 'ceramics', 'mugs'])])],
  ),
  node('pantry', ['pantry']),
];

describe('flattenTree', () => {
  it('lists depth-first and counts children', () => {
    const flat = flattenTree(tree);
    expect(flat.map((c) => c._id)).toEqual(['home', 'ceramics', 'mugs', 'pantry']);
    expect(flat.map((c) => c.childCount)).toEqual([1, 1, 0, 0]);
    expect(flat[0]).not.toHaveProperty('children');
  });
});

describe('moveTargets', () => {
  it('never offers a category as a home for itself or anything beneath it', () => {
    const targets = moveTargets(flattenTree(tree), 'ceramics').map((c) => c._id);
    expect(targets).toEqual(['home', 'pantry']);
  });
});
