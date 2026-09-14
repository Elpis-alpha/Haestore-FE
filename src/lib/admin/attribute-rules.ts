import type { AttributeType, FilterUi } from './types';

/**
 * The attribute builder's rules, stated where the form can use them as someone types.
 *
 * **The server is the authority on every one of these** — it refuses a reserved key, an
 * axis that cannot produce a grid, a select with no options. They are repeated here so the
 * form can say so before the button is pressed, and the tests pin them to the same cases
 * the backend's tests use, so the two cannot quietly drift apart.
 */

export const ATTRIBUTE_TYPES = [
  'select',
  'multiselect',
  'color',
  'number',
  'boolean',
  'text',
  'dimension',
] as const satisfies readonly AttributeType[];

export const TYPE_LABELS: Record<AttributeType, { label: string; hint: string }> = {
  select: { label: 'One choice', hint: 'Roast level: light, medium or dark.' },
  multiselect: { label: 'Several choices', hint: 'Suitable for: tea, coffee, soup.' },
  color: { label: 'Colour', hint: 'Glaze: celadon, tenmoku — each with a swatch.' },
  number: { label: 'Number', hint: 'Weight in grams, or a fixed set like 250 / 500 / 1000.' },
  boolean: { label: 'Yes or no', hint: 'Dishwasher safe.' },
  text: { label: 'Free text', hint: 'Origin farm. Shown on the product, never a filter.' },
  dimension: { label: 'Dimensions', hint: 'Length × width × height. Shown, never a filter.' },
};

export const FILTER_UI_LABELS: Record<FilterUi, string> = {
  checkbox: 'Tick boxes',
  swatch: 'Colour swatches',
  select: 'Drop-down',
  range: 'From–to range',
  toggle: 'On/off switch',
};

/** Mirrors RESERVED_ATTRIBUTE_KEYS on the server: names the shop's URLs already use. */
export const RESERVED_KEYS = new Set([
  'q',
  'sort',
  'page',
  'per_page',
  'price',
  'in_stock',
  'view',
  'cursor',
  'category',
  'id',
  'slug',
]);

export const hasOptions = (type: AttributeType) =>
  type === 'select' || type === 'multiselect' || type === 'color';

/** Whether the storefront can offer a filter for this type at all. */
export const isFilterableType = (type: AttributeType) => type !== 'text' && type !== 'dimension';

/**
 * Whether this type can be a variant axis. An axis needs a finite set of values: a number
 * qualifies only when its values are listed, and several-choices never does, because one
 * variant cannot sit at two positions on one axis.
 */
export function canBeVariantAxis(type: AttributeType, optionCount: number): boolean {
  if (type === 'boolean') return true;
  if (type === 'select' || type === 'color' || type === 'number') return optionCount > 0;
  return false;
}

/** The filter controls that make sense for a type, the most natural first. */
export function filterUisFor(type: AttributeType, optionCount: number): FilterUi[] {
  switch (type) {
    case 'select':
      return ['checkbox', 'select'];
    case 'multiselect':
      return ['checkbox'];
    case 'color':
      return ['swatch', 'checkbox'];
    case 'number':
      return optionCount > 0 ? ['checkbox', 'select'] : ['range'];
    case 'boolean':
      return ['toggle'];
    default:
      return [];
  }
}

/** A key suggestion from a label: "Weight (g)" → `weight_g`. */
export function keyFromLabel(label: string): string {
  const key = label
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/^[^a-z]+/, '')
    .slice(0, 40)
    .replace(/_+$/, '');
  return key;
}

/** Why a key would be refused, or null. The same two rules the server applies. */
export function keyProblem(key: string): string | null {
  if (!key) return 'A key is needed.';
  if (!/^[a-z][a-z0-9_]{1,39}$/.test(key)) {
    return 'Use 2–40 characters: a letter first, then lowercase letters, digits or underscores.';
  }
  if (RESERVED_KEYS.has(key)) {
    return `“${key}” is already a word in the shop’s own URLs, so a filter by that name could never be told apart from it.`;
  }
  return null;
}

/** An option value from its label: "Espresso fine" → `espresso-fine`. */
export function optionValueFromLabel(label: string): string {
  return label
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}
