import { describe, expect, it } from 'vitest';
import { normaliseCheckout, validateCheckout } from './validate';
import { STATUS_LABELS, statusTone, type OrderStatus } from './types';
import type { CheckoutDetails } from './client';

const good: CheckoutDetails = {
  email: 'shopper@haestore.test',
  shippingAddress: {
    name: 'A Shopper',
    line1: '1 Market Street',
    city: 'Reykjavík',
    country: 'IS',
  },
};

describe('validateCheckout', () => {
  it('accepts a complete address', () => {
    expect(validateCheckout(good)).toEqual({});
  });

  it.each([
    ['name', { ...good.shippingAddress, name: '   ' }],
    ['line1', { ...good.shippingAddress, line1: '' }],
    ['city', { ...good.shippingAddress, city: ' ' }],
  ])('requires %s', (field, shippingAddress) => {
    expect(validateCheckout({ ...good, shippingAddress })).toHaveProperty(field);
  });

  it.each(['', 'not-an-email', 'a@b', 'a b@c.test', '@haestore.test'])(
    'refuses %s as an email',
    (email) => {
      expect(validateCheckout({ ...good, email })).toHaveProperty('email');
    },
  );

  /** A pasted address, which is how most of them arrive. Phase 5's defect, in the UI. */
  it('accepts an email with surrounding whitespace', () => {
    expect(validateCheckout({ ...good, email: '  shopper@haestore.test  ' })).toEqual({});
  });

  it.each(['I', 'ISL', '1S', ''])('refuses %s as a country code', (country) => {
    expect(
      validateCheckout({ ...good, shippingAddress: { ...good.shippingAddress, country } }),
    ).toHaveProperty('country');
  });

  it('accepts a lowercase country code, which the normaliser uppercases', () => {
    expect(
      validateCheckout({ ...good, shippingAddress: { ...good.shippingAddress, country: 'is' } }),
    ).toEqual({});
  });
});

describe('normaliseCheckout', () => {
  it('trims and lowercases the email before it is sent', () => {
    expect(normaliseCheckout({ ...good, email: '  Shopper@Haestore.TEST ' }).email).toBe(
      'shopper@haestore.test',
    );
  });

  it('uppercases the country code', () => {
    const result = normaliseCheckout({
      ...good,
      shippingAddress: { ...good.shippingAddress, country: 'is' },
    });
    expect(result.shippingAddress.country).toBe('IS');
  });

  /**
   * The server's schema is strict, and an empty string is not an absent value. Sending
   * one stores a blank line and prints it on the packing slip.
   */
  it('drops empty optional fields rather than sending empty strings', () => {
    const result = normaliseCheckout({
      ...good,
      shippingAddress: { ...good.shippingAddress, line2: '   ', region: '', postalCode: '' },
    });
    expect(result.shippingAddress).not.toHaveProperty('line2');
    expect(result.shippingAddress).not.toHaveProperty('region');
    expect(result.shippingAddress).not.toHaveProperty('postalCode');
  });

  it('keeps an optional field that has a value, trimmed', () => {
    const result = normaliseCheckout({
      ...good,
      shippingAddress: { ...good.shippingAddress, line2: '  Flat 2  ' },
    });
    expect(result.shippingAddress.line2).toBe('Flat 2');
  });
});

describe('order status presentation', () => {
  const statuses: OrderStatus[] = [
    'pending_payment',
    'paid',
    'processing',
    'shipped',
    'delivered',
    'canceled',
    'refunded',
  ];

  it('names every status a shopper can see', () => {
    for (const status of statuses) {
      expect(STATUS_LABELS[status]).toBeTruthy();
      // Never leak the database's own vocabulary into the page.
      expect(STATUS_LABELS[status]).not.toMatch(/_/);
    }
  });

  it('tones the two endings as bad and the unpaid state as a note', () => {
    expect(statusTone('canceled')).toBe('bad');
    expect(statusTone('refunded')).toBe('bad');
    expect(statusTone('pending_payment')).toBe('note');
    expect(statusTone('paid')).toBe('good');
    expect(statusTone('delivered')).toBe('good');
  });
});
