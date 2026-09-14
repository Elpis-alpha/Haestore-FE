import { describe, expect, it } from 'vitest';
import { ADMIN_STATUS_LABELS, adminStatusTone, describeActor, plural } from './format';

describe('describeActor', () => {
  it('says "You" for the viewer’s own actions and "An admin" for anyone else’s', () => {
    expect(describeActor('admin:abc', 'abc')).toBe('You');
    expect(describeActor('admin:abc', 'xyz')).toBe('An admin');
    expect(describeActor('admin:abc')).toBe('An admin');
  });

  it('names the automatic actors', () => {
    expect(describeActor('webhook')).toBe('The payment provider');
    expect(describeActor('sweeper')).toBe('The reservation expired');
  });

  it('passes an unknown actor through rather than hiding it', () => {
    expect(describeActor('migration-2027')).toBe('migration-2027');
  });
});

describe('order status in the console', () => {
  it('has a label for every status', () => {
    expect(Object.keys(ADMIN_STATUS_LABELS)).toHaveLength(7);
  });

  it('marks what is waiting on the shop, and treats closed orders as closed rather than failed', () => {
    expect(adminStatusTone('paid')).toBe('note');
    expect(adminStatusTone('shipped')).toBe('good');
    expect(adminStatusTone('refunded')).toBe('neutral');
  });
});

describe('plural', () => {
  it('writes counts into sentences', () => {
    expect(plural(1, 'order')).toBe('1 order');
    expect(plural(3, 'order')).toBe('3 orders');
    expect(plural(2, 'variant', 'variants')).toBe('2 variants');
  });
});
