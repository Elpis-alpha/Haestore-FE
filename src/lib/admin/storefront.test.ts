import { describe, expect, it } from 'vitest';
import type { StorefrontSection } from './types';
import { describeSection, isDirty, moveItem, newSection } from './storefront';

describe('newSection', () => {
  it('mints an id the server’s pattern accepts, for every kind', () => {
    for (const kind of ['hero', 'shelves', 'product-row', 'note'] as const) {
      const section = newSection(kind, () => 0.5);
      expect(section.kind).toBe(kind);
      expect(section.id).toMatch(/^[a-z0-9-]{4,40}$/);
    }
  });

  it('gives two sections of one kind different ids', () => {
    const values = [0.1, 0.9];
    const [a, b] = [newSection('note', () => values[0]!), newSection('note', () => values[1]!)];
    expect(a.id).not.toBe(b.id);
  });
});

describe('moveItem', () => {
  it('swaps with the neighbour and leaves the ends alone', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c']);
    expect(moveItem(['a', 'b', 'c'], 2, -1)).toEqual(['a', 'c', 'b']);
    const list = ['a', 'b'];
    expect(moveItem(list, 0, -1)).toBe(list);
    expect(moveItem(list, 1, 1)).toBe(list);
  });
});

describe('describeSection', () => {
  it('summarises a collapsed card in words', () => {
    expect(describeSection(newSection('shelves'))).toBe('The shelves — every top-level shelf');
    expect(
      describeSection({
        ...newSection('product-row'),
        source: 'handpicked',
        productIds: ['x', 'y'],
      } as StorefrontSection),
    ).toBe('Just put out — 2 hand-picked');
  });
});

describe('isDirty', () => {
  it('notices an edit and an edited note, and nothing else', () => {
    const hero = newSection('hero', () => 0.2);
    const saved = { sections: [hero], note: '' };
    expect(isDirty(saved, { sections: [hero], note: '' })).toBe(false);
    expect(
      isDirty(saved, {
        sections: [{ ...hero, heading: 'Changed' } as StorefrontSection],
        note: '',
      }),
    ).toBe(true);
    expect(isDirty(saved, { sections: [hero], note: 'Autumn' })).toBe(true);
  });
});
