import type { StorefrontSection } from './types';

export type SectionKind = StorefrontSection['kind'];

export const SECTION_KINDS: { kind: SectionKind; label: string; hint: string }[] = [
  { kind: 'hero', label: 'Doorway', hint: 'The big heading and a button or two.' },
  { kind: 'shelves', label: 'Shelves', hint: 'A row of categories to walk into.' },
  {
    kind: 'product-row',
    label: 'Row of products',
    hint: 'Newest, from one shelf, or hand-picked.',
  },
  { kind: 'note', label: 'Notice', hint: 'A short piece of writing — hours, a delivery note.' },
];

export const kindLabel = (kind: SectionKind) =>
  SECTION_KINDS.find((entry) => entry.kind === kind)?.label ?? kind;

/**
 * A fresh section of a kind, with an id the server's pattern accepts.
 *
 * The id is what React keys the editor cards on and what a 422 path refers to, so it has to
 * be stable across reorders — which is why sections carry one at all rather than being
 * addressed by position.
 */
export function newSection(
  kind: SectionKind,
  random: () => number = Math.random,
): StorefrontSection {
  const id = `${kind}-${Math.floor(random() * 36 ** 6)
    .toString(36)
    .padStart(6, '0')}`;

  switch (kind) {
    case 'hero':
      return {
        id,
        kind,
        heading: 'A general store, kept the old way',
        body: '',
        primary: { label: 'Browse the shelves', href: '/shop' },
      };
    case 'shelves':
      return { id, kind, title: 'The shelves', note: '', categoryIds: [] };
    case 'product-row':
      return {
        id,
        kind,
        title: 'Just put out',
        note: '',
        source: 'newest',
        productIds: [],
        limit: 6,
      };
    case 'note':
      return { id, kind, heading: '', body: 'Write something the shop should say.' };
  }
}

/** Moves one item by one place, leaving the list untouched at either end. */
export function moveItem<T>(list: T[], index: number, delta: -1 | 1): T[] {
  const target = index + delta;
  if (index < 0 || index >= list.length || target < 0 || target >= list.length) return list;
  const next = [...list];
  [next[index], next[target]] = [next[target] as T, next[index] as T];
  return next;
}

/** The one line an editor card shows while collapsed. */
export function describeSection(section: StorefrontSection): string {
  switch (section.kind) {
    case 'hero':
      return section.heading;
    case 'shelves':
      return section.categoryIds?.length
        ? `${section.title} — ${section.categoryIds.length} chosen`
        : `${section.title} — every top-level shelf`;
    case 'product-row':
      return `${section.title} — ${
        section.source === 'newest'
          ? 'newest'
          : section.source === 'category'
            ? 'from one shelf'
            : `${section.productIds?.length ?? 0} hand-picked`
      }`;
    case 'note':
      return section.heading || section.body.slice(0, 60);
  }
}

/** Whether the composer holds anything the server has not been told. */
export function isDirty(
  saved: { sections: StorefrontSection[]; note: string },
  current: { sections: StorefrontSection[]; note: string },
): boolean {
  return JSON.stringify(saved) !== JSON.stringify(current);
}
