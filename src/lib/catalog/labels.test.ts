import { describe, expect, it } from 'vitest';
import { describePurchased, prettify } from './labels';

const labels = {
  grind: { label: 'Grind', values: { 'whole-bean': { label: 'Whole bean' } } },
  weight_g: { label: 'Weight', values: { '250': { label: '250 g' } } },
};

describe('describePurchased', () => {
  it('names each axis value in the shop’s words, in the order bought', () => {
    expect(
      describePurchased(
        [
          { key: 'weight_g', value: '250' },
          { key: 'grind', value: 'whole-bean' },
        ],
        labels,
      ),
    ).toBe('250 g, Whole bean');
  });

  it('tidies a slug whose axis no longer has a label', () => {
    expect(describePurchased([{ key: 'glaze', value: 'celadon-green' }], labels)).toBe(
      'Celadon green',
    );
  });

  it('is empty for a product with no variants to speak of', () => {
    expect(describePurchased([], labels)).toBe('');
  });
});

describe('prettify', () => {
  it('turns separators into spaces and capitalises the first letter only', () => {
    expect(prettify('single_origin-ethiopian')).toBe('Single origin ethiopian');
  });
});
