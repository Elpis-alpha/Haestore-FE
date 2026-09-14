import { describe, expect, it } from 'vitest';
import {
  canBeVariantAxis,
  filterUisFor,
  isFilterableType,
  keyFromLabel,
  keyProblem,
  optionValueFromLabel,
} from './attribute-rules';

describe('keys', () => {
  it('suggests a key a URL can carry', () => {
    expect(keyFromLabel('Roast level')).toBe('roast_level');
    expect(keyFromLabel('Weight (g)')).toBe('weight_g');
    expect(keyFromLabel('Crème  brûlée!')).toBe('creme_brulee');
    expect(keyFromLabel('250g size')).toBe('g_size');
  });

  it('refuses what the server refuses', () => {
    expect(keyProblem('roast')).toBeNull();
    expect(keyProblem('sort')).toMatch(/URLs/);
    expect(keyProblem('in_stock')).toMatch(/URLs/);
    expect(keyProblem('Roast')).toMatch(/lowercase/);
    expect(keyProblem('9lives')).toMatch(/letter first/);
    expect(keyProblem('r')).toMatch(/2–40/);
  });
});

describe('what a type can do', () => {
  it('makes an axis only of a finite set of values', () => {
    expect(canBeVariantAxis('select', 3)).toBe(true);
    expect(canBeVariantAxis('select', 0)).toBe(false);
    expect(canBeVariantAxis('number', 0)).toBe(false);
    expect(canBeVariantAxis('number', 3)).toBe(true);
    expect(canBeVariantAxis('boolean', 0)).toBe(true);
    expect(canBeVariantAxis('multiselect', 5)).toBe(false);
    expect(canBeVariantAxis('text', 0)).toBe(false);
  });

  it('never offers a filter for free text or dimensions', () => {
    expect(isFilterableType('text')).toBe(false);
    expect(isFilterableType('dimension')).toBe(false);
    expect(filterUisFor('text', 0)).toEqual([]);
    expect(filterUisFor('dimension', 0)).toEqual([]);
  });

  it('offers a range for an open number and choices for a listed one', () => {
    expect(filterUisFor('number', 0)).toEqual(['range']);
    expect(filterUisFor('number', 3)).toEqual(['checkbox', 'select']);
    expect(filterUisFor('color', 2)[0]).toBe('swatch');
  });
});

describe('option values', () => {
  it('are slug-shaped, because they appear in URLs', () => {
    expect(optionValueFromLabel('Espresso fine')).toBe('espresso-fine');
    expect(optionValueFromLabel('  Tenmoku / Iron  ')).toBe('tenmoku-iron');
    expect(optionValueFromLabel('250 g')).toBe('250-g');
  });
});
