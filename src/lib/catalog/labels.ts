/**
 * Turning the admin's slugs back into words.
 *
 * Variant axis values are stored as slugs — `whole-bean`, not "Whole bean" — because the grid
 * is built from values. Anything that shows a variant to a person (the product page's picker,
 * a review's "bought as" line) maps them through the axis labels the product endpoint returns,
 * and falls back to tidying the slug only for an axis that no longer applies.
 */

export type AxisLabelMap = Record<
  string,
  { label: string; values: Record<string, { label: string; swatchHex?: string }> }
>;

export function prettify(value: string): string {
  const spaced = value.replace(/[-_]+/g, ' ').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** "250 g, whole bean" — the variant as bought, in the shop's own words. */
export function describePurchased(
  purchased: { key: string; value: string }[],
  labels: AxisLabelMap,
): string {
  return purchased
    .map((axis) => labels[axis.key]?.values[axis.value]?.label ?? prettify(axis.value))
    .join(', ');
}
