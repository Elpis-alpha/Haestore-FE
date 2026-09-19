import { describe, expect, it } from 'vitest';
import { assertTestModeKeys } from './payment-mode';

describe('assertTestModeKeys', () => {
  it('accepts a test publishable key and an empty one', () => {
    expect(() =>
      assertTestModeKeys({ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_test_x' }),
    ).not.toThrow();
    expect(() => assertTestModeKeys({})).not.toThrow();
  });

  it('refuses a live publishable key, by name', () => {
    expect(() => assertTestModeKeys({ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: 'pk_live_x' })).toThrow(
      /NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.*ADR-016/,
    );
  });
});
