import { describe, expect, it } from 'vitest';
import { formatMoney, formatMoneyRange, minorUnitExponent, toMajorUnits } from './money';

describe('minor units', () => {
  it('knows the exponent varies by currency', () => {
    expect(minorUnitExponent('USD')).toBe(2);
    expect(minorUnitExponent('JPY')).toBe(0);
    expect(minorUnitExponent('KWD')).toBe(3);
  });

  it('is case insensitive', () => {
    expect(minorUnitExponent('usd')).toBe(2);
  });

  it('converts without floating-point surprises at the values a shop actually uses', () => {
    expect(toMajorUnits({ amount: 1999, currency: 'USD' })).toBe(19.99);
    expect(toMajorUnits({ amount: 7, currency: 'USD' })).toBe(0.07);
    expect(toMajorUnits({ amount: 1999, currency: 'JPY' })).toBe(1999);
  });
});

describe('formatting', () => {
  it('formats the smallest and largest amounts a cart will hold', () => {
    expect(formatMoney({ amount: 0, currency: 'USD' })).toBe('$0.00');
    expect(formatMoney({ amount: 10, currency: 'USD' })).toBe('$0.10');
    expect(formatMoney({ amount: 199999, currency: 'USD' })).toBe('$1,999.99');
  });

  it('does not invent decimals for a zero-exponent currency', () => {
    expect(formatMoney({ amount: 1999, currency: 'JPY' })).toBe('¥1,999');
  });

  it('collapses a range whose ends are equal', () => {
    const m = { amount: 1800, currency: 'USD' };
    expect(formatMoneyRange(m, m)).toBe('$18.00');
    expect(formatMoneyRange(m, { amount: 3200, currency: 'USD' })).toBe('$18.00 – $32.00');
  });
});
