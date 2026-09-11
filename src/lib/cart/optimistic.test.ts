import { describe, expect, it } from 'vitest';
import { applyLocally, recount } from './optimistic';
import { EMPTY_CART, type Cart, type CartLine } from './types';

/**
 * The optimistic layer, as arithmetic.
 *
 * These are the numbers a shopper watches move between tapping a stepper and the server
 * answering. Getting them wrong is not a crash — it is a subtotal that disagrees with
 * the line above it for half a second, which is exactly long enough to be noticed and
 * not long enough to be reported.
 */

const usd = (amount: number) => ({ amount, currency: 'USD' });

function line(overrides: Partial<CartLine> & { lineKey: string }): CartLine {
  return {
    productId: 'p1',
    variantId: 'v1',
    sku: 'SKU-1',
    title: 'House Blend',
    slug: 'house-blend',
    axisValues: [],
    unitPrice: usd(1800),
    lineTotal: usd(1800),
    quantity: 1,
    sellableQuantity: 1,
    available: 10,
    lowStockThreshold: 3,
    backorderable: false,
    maxQuantity: 10,
    changes: [],
    addedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const cart = (lines: CartLine[], savedForLater: CartLine[] = []): Cart =>
  recount({ ...EMPTY_CART, lines, savedForLater });

describe('applyLocally', () => {
  it('moves the quantity, the line total and the subtotal together', () => {
    const before = cart([line({ lineKey: 'a', unitPrice: usd(1800) })]);
    const after = applyLocally(before, { kind: 'quantity', lineKey: 'a', quantity: 3 });

    expect(after.lines[0]?.quantity).toBe(3);
    expect(after.lines[0]?.lineTotal.amount).toBe(5400);
    // A quantity that changes while the total sits still reads as broken.
    expect(after.subtotal.amount).toBe(5400);
    expect(after.itemCount).toBe(3);
  });

  it('treats a quantity of zero as a removal, the way the server does', () => {
    const before = cart([line({ lineKey: 'a' }), line({ lineKey: 'b' })]);
    const after = applyLocally(before, { kind: 'quantity', lineKey: 'a', quantity: 0 });

    expect(after.lines.map((l) => l.lineKey)).toEqual(['b']);
  });

  it('removes from the bag and from the saved list alike', () => {
    const before = cart([line({ lineKey: 'a' })], [line({ lineKey: 'b' })]);

    expect(applyLocally(before, { kind: 'remove', lineKey: 'a' }).lines).toEqual([]);
    expect(applyLocally(before, { kind: 'remove', lineKey: 'b' }).savedForLater).toEqual([]);
  });

  it('drops a removed line out of the totals', () => {
    const before = cart([
      line({ lineKey: 'a', quantity: 2, sellableQuantity: 2, lineTotal: usd(3600) }),
      line({ lineKey: 'b' }),
    ]);
    const after = applyLocally(before, { kind: 'remove', lineKey: 'a' });

    expect(after.subtotal.amount).toBe(1800);
    expect(after.itemCount).toBe(1);
  });

  it('moves a line to saved and out of the count', () => {
    const before = cart([line({ lineKey: 'a', quantity: 2, sellableQuantity: 2 })]);
    const after = applyLocally(before, { kind: 'move', lineKey: 'a', to: 'saved' });

    expect(after.lines).toEqual([]);
    expect(after.savedForLater).toHaveLength(1);
    // A saved line is not in the bag, so the badge must not count it.
    expect(after.itemCount).toBe(0);
    expect(after.subtotal.amount).toBe(0);
  });

  it('moves a line back into the bag and into the count', () => {
    const before = cart(
      [],
      [line({ lineKey: 'a', quantity: 2, sellableQuantity: 2, lineTotal: usd(3600) })],
    );
    const after = applyLocally(before, { kind: 'move', lineKey: 'a', to: 'cart' });

    expect(after.lines).toHaveLength(1);
    expect(after.savedForLater).toEqual([]);
    expect(after.itemCount).toBe(2);
    expect(after.subtotal.amount).toBe(3600);
  });

  it('is a no-op on a line that is not there', () => {
    const before = cart([line({ lineKey: 'a' })]);

    expect(applyLocally(before, { kind: 'move', lineKey: 'zzz', to: 'saved' })).toBe(before);
    expect(applyLocally(before, { kind: 'remove', lineKey: 'zzz' })).toEqual(before);
    expect(applyLocally(before, { kind: 'quantity', lineKey: 'zzz', quantity: 4 })).toEqual(before);
  });

  it('keeps the currency it was given', () => {
    const before: Cart = {
      ...EMPTY_CART,
      currency: 'JPY',
      subtotal: { amount: 0, currency: 'JPY' },
      lines: [line({ lineKey: 'a', unitPrice: { amount: 500, currency: 'JPY' } })],
    };
    const after = applyLocally(before, { kind: 'quantity', lineKey: 'a', quantity: 2 });

    expect(after.subtotal).toEqual({ amount: 1000, currency: 'JPY' });
    expect(after.lines[0]?.lineTotal.currency).toBe('JPY');
  });

  it('does not mutate what it was given', () => {
    const before = cart([line({ lineKey: 'a' })]);
    const snapshot = structuredClone(before);
    applyLocally(before, { kind: 'quantity', lineKey: 'a', quantity: 7 });

    // `useOptimistic` re-applies actions against the base value on every render. A
    // mutation here compounds across renders and the quantity climbs on its own.
    expect(before).toEqual(snapshot);
  });

  it('does not guess about stock', () => {
    // Deliberate: showing the higher number for an instant and correcting beats a
    // stepper that silently refuses and looks stuck.
    const before = cart([line({ lineKey: 'a', available: 2, maxQuantity: 2 })]);
    const after = applyLocally(before, { kind: 'quantity', lineKey: 'a', quantity: 9 });

    expect(after.lines[0]?.quantity).toBe(9);
  });
});

describe('recount', () => {
  it('counts pieces, not rows', () => {
    const result = recount({
      ...EMPTY_CART,
      lines: [
        line({ lineKey: 'a', sellableQuantity: 3, lineTotal: usd(5400) }),
        line({ lineKey: 'b', sellableQuantity: 2, lineTotal: usd(3600) }),
      ],
    });

    expect(result.itemCount).toBe(5);
    expect(result.subtotal.amount).toBe(9000);
  });

  it('counts what can be sold, not what was asked for', () => {
    const result = recount({
      ...EMPTY_CART,
      lines: [line({ lineKey: 'a', quantity: 9, sellableQuantity: 2, lineTotal: usd(3600) })],
    });

    expect(result.itemCount).toBe(2);
  });
});
