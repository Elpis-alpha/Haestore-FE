import { describe, expect, it } from 'vitest';
import { safeNextPath } from './next-path';

describe('safeNextPath', () => {
  it('keeps an ordinary path, query and all', () => {
    expect(safeNextPath('/shop/coffee-tea/beans?roast=dark')).toBe(
      '/shop/coffee-tea/beans?roast=dark',
    );
  });

  it('falls back when there is nowhere to go back to', () => {
    expect(safeNextPath(undefined)).toBe('/account');
    expect(safeNextPath('')).toBe('/account');
  });

  it('refuses an absolute URL pointing at another site', () => {
    expect(safeNextPath('https://evil.test/phish')).toBe('/account');
    expect(safeNextPath('http://evil.test')).toBe('/account');
  });

  it('refuses a protocol-relative URL, which passes a naive slash check', () => {
    // This is the whole reason the value is validated rather than sanitised:
    // `//evil.test` starts with a slash and is an absolute address on another host.
    expect(safeNextPath('//evil.test/phish')).toBe('/account');
  });

  it('refuses the backslash variant, which browsers normalise to a slash', () => {
    expect(safeNextPath('/\\evil.test')).toBe('/account');
  });

  it('refuses a value carrying a control character', () => {
    expect(safeNextPath('/shop\r\nLocation: https://evil.test')).toBe('/account');
    expect(safeNextPath('/shop\u0000')).toBe('/account');
  });

  it('refuses to bounce back into sign-in, which would loop', () => {
    expect(safeNextPath('/sign-in')).toBe('/account');
    expect(safeNextPath('/sign-in?next=/sign-in')).toBe('/account');
  });
});
