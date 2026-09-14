import { describe, expect, it } from 'vitest';
import type { EffectiveAttribute } from './types';
import {
  attributePayload,
  formatMajorUnits,
  formValuesFrom,
  gridSize,
  mergeGrid,
  parseMajorUnits,
  variantsPayload,
  type VariantDraft,
} from './product-form';

const attribute = (key: string, type: EffectiveAttribute['type']): EffectiveAttribute => ({
  key,
  defId: 'd',
  label: key,
  type,
  options: [],
  isFilterable: false,
  isSearchable: false,
  isAxisEligible: false,
  filterUi: 'checkbox',
  validation: {},
  required: false,
  order: 0,
  inheritedFrom: null,
});

describe('parseMajorUnits', () => {
  it('reads what a person types, exactly', () => {
    expect(parseMajorUnits('19.99', 'USD')).toBe(1999);
    expect(parseMajorUnits('18.5', 'USD')).toBe(1850);
    expect(parseMajorUnits('0.07', 'USD')).toBe(7);
    expect(parseMajorUnits(' 32 ', 'USD')).toBe(3200);
    expect(parseMajorUnits('1200', 'JPY')).toBe(1200);
  });

  it('refuses anything it would have to guess at', () => {
    for (const text of ['1,999.99', '19.999', '-5', '', 'abc', '1e3', '12.']) {
      expect(parseMajorUnits(text, 'USD'), text).toBe(text === '12.' ? 1200 : null);
    }
    expect(parseMajorUnits('12.5', 'JPY')).toBeNull();
  });

  it('round-trips with formatMajorUnits', () => {
    for (const amount of [0, 7, 70, 1999, 250000]) {
      expect(parseMajorUnits(formatMajorUnits(amount, 'USD'), 'USD')).toBe(amount);
    }
    expect(formatMajorUnits(7, 'USD')).toBe('0.07');
  });
});

describe('attributePayload', () => {
  const set = [
    attribute('origin', 'text'),
    attribute('weight_g', 'number'),
    attribute('dishwasher_safe', 'boolean'),
    attribute('notes', 'multiselect'),
    attribute('size', 'dimension'),
  ];

  it('omits what was left empty rather than sending null', () => {
    const { payload, errors } = attributePayload(set, {
      origin: '',
      weight_g: undefined,
      notes: [],
      size: { length: '', width: '', height: '', unit: 'cm' },
    });
    expect(payload).toEqual({});
    expect(errors).toEqual({});
  });

  it('turns inputs into the types the server validates', () => {
    const { payload } = attributePayload(set, {
      origin: ' Huila ',
      weight_g: '250',
      dishwasher_safe: false,
      notes: ['cocoa'],
      size: { length: '10', width: '8', height: '12.5', unit: 'cm' },
    });
    expect(payload).toEqual({
      origin: 'Huila',
      weight_g: 250,
      dishwasher_safe: false,
      notes: ['cocoa'],
      size: { length: 10, width: 8, height: 12.5, unit: 'cm' },
    });
  });

  it('reports a malformed value against its field', () => {
    const { errors } = attributePayload(set, {
      weight_g: 'heavy',
      size: { length: '10', width: '', height: '2', unit: 'cm' },
    });
    expect(Object.keys(errors).sort()).toEqual(['size', 'weight_g']);
  });

  it('reads stored values back into the form', () => {
    const values = formValuesFrom([
      { key: 'weight_g', type: 'number', valueNumber: 500, displayValue: '500 g', order: 0 },
      { key: 'dishwasher_safe', type: 'boolean', valueBool: false, displayValue: 'No', order: 1 },
    ]);
    expect(values).toEqual({ weight_g: '500', dishwasher_safe: false });
  });
});

const draft = (value: string, price = '18.00'): VariantDraft => ({
  sku: `SKU-${value}`,
  axisValues: [{ key: 'grind', value }],
  price,
  compareAt: '',
  onHand: '4',
  lowStockThreshold: '3',
  backorderable: false,
  status: 'active',
  imagePublicIds: [],
  reserved: 1,
});

describe('the variant grid', () => {
  it('keeps what was typed against rows that stay, and starts new rows from the first', () => {
    const merged = mergeGrid(
      [draft('whole', '21.00'), draft('ground')],
      [
        { sku: 'NEW-WHOLE', axisValues: [{ key: 'grind', value: 'whole' }] },
        { sku: 'NEW-FINE', axisValues: [{ key: 'grind', value: 'fine' }] },
      ],
    );
    expect(merged.map((m) => [m.sku, m.price, m.onHand])).toEqual([
      ['SKU-whole', '21.00', '4'],
      ['NEW-FINE', '21.00', '0'],
    ]);
  });

  it('counts rows before anything is built', () => {
    expect(gridSize([{ values: ['a', 'b'] }, { values: ['1', '2', '3'] }])).toBe(6);
    expect(gridSize([])).toBe(0);
  });

  it('builds the payload in grid order and names each bad cell', () => {
    const { variants, errors } = variantsPayload(
      [draft('a'), { ...draft('b'), price: '1,50' }],
      'USD',
    );
    expect(variants[0]).toMatchObject({ price: { amount: 1800, currency: 'USD' }, position: 0 });
    expect(errors).toEqual({ '1.price': 'Enter a price, like 18.50.' });
  });
});
