import { minorUnitExponent } from '../money';
import type { AdminProduct, EffectiveAttribute } from './types';

/**
 * The product form's arithmetic, kept out of the component so it can be tested as
 * arithmetic.
 *
 * Two translations happen here. Attribute values go from what inputs hold — strings, a
 * tri-state yes/no, three dimension boxes — to the flat DTO the server validates, with
 * anything left empty **omitted** rather than sent as null or "", because the server's
 * compiled schema treats a present-but-empty value as the wrong shape. And prices go from
 * what a person types, "18.50", to integer minor units, by string arithmetic rather than
 * `parseFloat(text) * 100`, which turns "19.99" into 1998.9999999999998.
 */

export type DimensionDraft = { length: string; width: string; height: string; unit: string };
export type FormValue = string | string[] | boolean | DimensionDraft | undefined;

type StoredAttribute = AdminProduct['attributes'][number];
type StoredVariant = AdminProduct['variants'][number];

export function formValuesFrom(attributes: StoredAttribute[]): Record<string, FormValue> {
  const values: Record<string, FormValue> = {};
  for (const attribute of attributes) {
    switch (attribute.type) {
      case 'multiselect':
        values[attribute.key] = attribute.valueStrings ?? [];
        break;
      case 'number':
        values[attribute.key] =
          attribute.valueNumber === undefined ? undefined : String(attribute.valueNumber);
        break;
      case 'boolean':
        values[attribute.key] = attribute.valueBool;
        break;
      case 'dimension':
        values[attribute.key] = attribute.valueDim
          ? {
              length: String(attribute.valueDim.length),
              width: String(attribute.valueDim.width),
              height: String(attribute.valueDim.height),
              unit: attribute.valueDim.unit,
            }
          : undefined;
        break;
      default:
        values[attribute.key] = attribute.valueString;
    }
  }
  return values;
}

function isEmpty(value: FormValue): boolean {
  if (value === undefined || value === '') return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') {
    return !value.length && !value.width && !value.height;
  }
  return false;
}

/**
 * The flat attribute DTO, and per-field problems found before sending.
 *
 * Only shape is checked here — a number that is not a number, a dimension with a box left
 * blank. Whether a value is one the category allows is the server's decision, and the
 * form shows its answer.
 */
export function attributePayload(
  attributes: EffectiveAttribute[],
  values: Record<string, FormValue>,
): { payload: Record<string, unknown>; errors: Record<string, string> } {
  const payload: Record<string, unknown> = {};
  const errors: Record<string, string> = {};

  for (const attribute of attributes) {
    const value = values[attribute.key];
    if (isEmpty(value)) continue;

    switch (attribute.type) {
      case 'number': {
        const parsed = Number(value);
        if (typeof value !== 'string' || !Number.isFinite(parsed)) {
          errors[attribute.key] = 'Enter a number.';
        } else payload[attribute.key] = parsed;
        break;
      }
      case 'boolean':
        if (typeof value === 'boolean') payload[attribute.key] = value;
        break;
      case 'dimension': {
        const d = value as DimensionDraft;
        const numbers = [d.length, d.width, d.height].map(Number);
        if (numbers.some((n) => !Number.isFinite(n) || n <= 0) || !d.unit.trim()) {
          errors[attribute.key] = 'Fill in all three measurements and a unit.';
        } else {
          payload[attribute.key] = {
            length: numbers[0],
            width: numbers[1],
            height: numbers[2],
            unit: d.unit.trim(),
          };
        }
        break;
      }
      default:
        payload[attribute.key] = typeof value === 'string' ? value.trim() : value;
    }
  }

  return { payload, errors };
}

/**
 * "18.5" → 1850 for USD, "1200" → 1200 for JPY. Null for anything that is not a plain
 * non-negative amount with no more decimals than the currency has — "1,999.99" included,
 * because a thousands separator silently read as a decimal point is how a price becomes
 * one dollar.
 */
export function parseMajorUnits(text: string, currency: string): number | null {
  const exponent = minorUnitExponent(currency);
  const trimmed = text.trim();
  const pattern = exponent === 0 ? /^\d+$/ : new RegExp(`^(\\d+)(?:\\.(\\d{0,${exponent}}))?$`);
  const match = pattern.exec(trimmed);
  if (!match) return null;
  if (exponent === 0) return Number(trimmed);
  const whole = match[1] ?? '0';
  const fraction = (match[2] ?? '').padEnd(exponent, '0');
  return Number(whole) * 10 ** exponent + Number(fraction || '0');
}

export function formatMajorUnits(amount: number, currency: string): string {
  const exponent = minorUnitExponent(currency);
  if (exponent === 0) return String(amount);
  const text = String(amount).padStart(exponent + 1, '0');
  return `${text.slice(0, -exponent)}.${text.slice(-exponent)}`;
}

export type VariantDraft = {
  /** Present on a variant that exists on the server, absent on a newly planned one. */
  id?: string;
  sku: string;
  axisValues: { key: string; value: string }[];
  price: string;
  compareAt: string;
  onHand: string;
  lowStockThreshold: string;
  backorderable: boolean;
  status: 'active' | 'inactive';
  imagePublicIds: string[];
  weightGrams?: number;
  /** Held by orders. Shown so an admin lowering stock can see what is spoken for. */
  reserved: number;
};

export const fingerprint = (axisValues: { key: string; value: string }[]) =>
  axisValues.map((a) => `${a.key}:${a.value}`).join('|');

export function variantDraftsFrom(variants: StoredVariant[]): VariantDraft[] {
  return [...variants]
    .sort((a, b) => a.position - b.position)
    .map((v) => ({
      id: v._id,
      sku: v.sku,
      axisValues: v.axisValues.map((a) => ({ key: a.key, value: a.value })),
      price: formatMajorUnits(v.price.amount, v.price.currency),
      compareAt: v.compareAtPrice
        ? formatMajorUnits(v.compareAtPrice.amount, v.compareAtPrice.currency)
        : '',
      onHand: String(v.stock.onHand),
      lowStockThreshold: String(v.stock.lowStockThreshold),
      backorderable: v.stock.backorderable,
      status: v.status,
      imagePublicIds: v.imagePublicIds,
      ...(v.weightGrams === undefined ? {} : { weightGrams: v.weightGrams }),
      reserved: v.stock.reserved,
    }));
}

/**
 * Folds a planned grid into the variants already on the form.
 *
 * A row already at a grid position keeps everything typed against it; a new position
 * starts from the first row's price and no stock; a row whose position is no longer in the
 * grid is dropped. The plan is a suggestion, and nothing is saved until the form is.
 */
export function mergeGrid(
  current: VariantDraft[],
  planned: { sku: string; axisValues: { key: string; value: string }[] }[],
): VariantDraft[] {
  const byPosition = new Map(current.map((draft) => [fingerprint(draft.axisValues), draft]));
  const template = current[0];

  return planned.map((row) => {
    const kept = byPosition.get(fingerprint(row.axisValues));
    if (kept) return { ...kept, axisValues: row.axisValues };
    return {
      sku: row.sku,
      axisValues: row.axisValues,
      price: template?.price ?? '',
      compareAt: '',
      onHand: '0',
      lowStockThreshold: template?.lowStockThreshold ?? '3',
      backorderable: false,
      status: 'active',
      imagePublicIds: [],
      reserved: 0,
    };
  });
}

export function variantsPayload(
  drafts: VariantDraft[],
  currency: string,
): { variants: Record<string, unknown>[]; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  const variants = drafts.map((draft, index) => {
    const price = parseMajorUnits(draft.price, currency);
    if (price === null) errors[`${index}.price`] = 'Enter a price, like 18.50.';

    const compareAt = draft.compareAt.trim() ? parseMajorUnits(draft.compareAt, currency) : null;
    if (draft.compareAt.trim() && compareAt === null) {
      errors[`${index}.compareAt`] = 'Enter the former price, or leave it empty.';
    }

    const onHand = Number(draft.onHand);
    if (!Number.isInteger(onHand) || onHand < 0) errors[`${index}.onHand`] = 'A whole number.';

    const threshold = Number(draft.lowStockThreshold);
    if (!Number.isInteger(threshold) || threshold < 0) {
      errors[`${index}.lowStockThreshold`] = 'A whole number.';
    }

    return {
      ...(draft.sku.trim() ? { sku: draft.sku.trim() } : {}),
      axisValues: draft.axisValues,
      price: { amount: price ?? 0, currency },
      ...(compareAt !== null ? { compareAtPrice: { amount: compareAt, currency } } : {}),
      stock: {
        onHand: Number.isInteger(onHand) ? onHand : 0,
        lowStockThreshold: Number.isInteger(threshold) ? threshold : 3,
        backorderable: draft.backorderable,
      },
      ...(draft.weightGrams === undefined ? {} : { weightGrams: draft.weightGrams }),
      imagePublicIds: draft.imagePublicIds,
      status: draft.status,
      position: index,
    };
  });

  return { variants, errors };
}

/** How many rows a grid of these axes would make. */
export const gridSize = (axes: { values: string[] }[]) =>
  axes.length === 0 ? 0 : axes.reduce((n, axis) => n * axis.values.length, 1);
