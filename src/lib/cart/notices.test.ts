import { describe, expect, it } from 'vitest';
import { describeChange, isBlocking } from './types';
import { formatMoney } from '../money';
import type { LineChange } from './types';

/**
 * The one place a backend *fact* becomes a sentence a shopper reads.
 *
 * The API names what happened — `clamped`, `price_changed` — and deliberately does not
 * decide how loudly to say it. These assertions are what stop the same fact reading
 * three different ways in the drawer, on the cart page and in the merge report.
 */

const usd = (amount: number) => ({ amount, currency: 'USD' });
const say = (change: LineChange) => describeChange(change, formatMoney);

describe('describeChange', () => {
  it('names both numbers on a price change, so the shopper can see the difference', () => {
    expect(say({ kind: 'price_changed', from: usd(1800), to: usd(2000) })).toBe(
      'The price changed from $18.00 to $20.00',
    );
  });

  it('explains a raised quantity as the merge rule, not as an addition', () => {
    // 2 and 3 became 3, never 5. Saying "raised from 2 to 3" is what makes the rule
    // legible enough for somebody who wanted 5 to fix it in one edit.
    expect(say({ kind: 'quantity_raised', from: 2, to: 3 })).toBe('Quantity raised from 2 to 3');
  });

  it('distinguishes a clamp from a sell-out', () => {
    expect(say({ kind: 'clamped', from: 9, to: 2, available: 2 })).toContain('Only 2 left');
    expect(say({ kind: 'clamped', from: 9, to: 0, available: 0 })).toContain('sold out');
  });

  it('says why a line is gone, rather than letting it vanish', () => {
    expect(say({ kind: 'dropped', reason: 'unavailable' })).toBe('This is no longer for sale');
    expect(say({ kind: 'dropped', reason: 'currency' })).toContain('shop currency');
  });

  it('has a sentence for every kind the contract can produce', () => {
    const every: LineChange[] = [
      { kind: 'added' },
      { kind: 'quantity_raised', from: 1, to: 2 },
      { kind: 'price_changed', from: usd(1), to: usd(2) },
      { kind: 'clamped', from: 2, to: 1, available: 1 },
      { kind: 'saved_for_later', reason: 'out_of_stock' },
      { kind: 'dropped', reason: 'unavailable' },
    ];

    // A kind added to the backend's union with no sentence here would otherwise reach a
    // shopper as an empty line under a cart row.
    for (const change of every) {
      expect(say(change)).toMatch(/\S/);
    }
  });
});

describe('isBlocking', () => {
  it('blocks on the changes that alter what is bought, not on the ones that inform', () => {
    expect(isBlocking({ kind: 'dropped', reason: 'unavailable' })).toBe(true);
    expect(isBlocking({ kind: 'clamped', from: 2, to: 1, available: 1 })).toBe(true);
    expect(isBlocking({ kind: 'added' })).toBe(false);
    expect(isBlocking({ kind: 'price_changed', from: usd(1), to: usd(2) })).toBe(false);
  });
});
