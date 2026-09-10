/**
 * Money is an integer count of minor units plus a currency — never a float, and
 * never a formatted string that has to be parsed back.
 *
 * The 2022 cart stored each line's *extended total* in a field called `price` and
 * recovered the unit price by dividing by quantity, so three items at $9.99
 * round-tripped to $9.99 only by luck. Keeping the smallest unit as an integer
 * makes that class of bug unrepresentable.
 */

export type Money = {
  /** Minor units: 1999 is $19.99, and 1999 is also ¥1999. */
  amount: number;
  /** ISO 4217, uppercase. */
  currency: string;
};

const exponents = new Map<string, number>();

/**
 * Minor units per major unit for a currency — 2 for USD, 0 for JPY, 3 for KWD.
 * Read from Intl rather than hardcoded, because the exceptions are the whole
 * problem and a hand-written table is a list of the ones you remembered.
 */
export function minorUnitExponent(currency: string): number {
  const key = currency.toUpperCase();
  const cached = exponents.get(key);
  if (cached !== undefined) return cached;

  // Intl throws RangeError on an unknown currency rather than returning nothing,
  // so the ?? is only satisfying the lib's loose type. Two is right for all but a
  // handful of currencies if it ever did fire.
  const resolved =
    new Intl.NumberFormat('en', { style: 'currency', currency: key }).resolvedOptions()
      .maximumFractionDigits ?? 2;

  exponents.set(key, resolved);
  return resolved;
}

export function toMajorUnits({ amount, currency }: Money): number {
  return amount / 10 ** minorUnitExponent(currency);
}

export function formatMoney(money: Money, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: money.currency.toUpperCase(),
  }).format(toMajorUnits(money));
}

/** "$18 – $32" for a product whose variants span a range. */
export function formatMoneyRange(low: Money, high: Money, locale = 'en-US'): string {
  if (low.amount === high.amount) return formatMoney(low, locale);
  return `${formatMoney(low, locale)} – ${formatMoney(high, locale)}`;
}
