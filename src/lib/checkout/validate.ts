import type { CheckoutDetails } from './client';

/**
 * The checkout form's own validation.
 *
 * **A convenience, never the authority.** The server validates the same fields with a
 * strict Zod schema and would refuse anything this let through; the only job here is to
 * say so before the shopper has committed to an order, because the server's refusal
 * arrives after stock has been considered and reads as a failure rather than a typo.
 *
 * Kept out of the component so it can be tested as a function. The email pattern is
 * deliberately permissive — the one rule worth enforcing in a browser is "this could
 * plausibly receive mail", and every stricter regex on the internet rejects addresses
 * that are valid. The receipt arriving is the real test, and nothing here can perform it.
 */

export type FieldErrors = Partial<Record<'email' | 'name' | 'line1' | 'city' | 'country', string>>;

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function validateCheckout(details: CheckoutDetails): FieldErrors {
  const errors: FieldErrors = {};
  const address = details.shippingAddress;

  if (!EMAIL.test(details.email.trim())) {
    errors.email = 'We need an address that can receive your receipt.';
  }
  if (!address.name.trim()) errors.name = 'Who should we address it to?';
  if (!address.line1.trim()) errors.line1 = 'We need a street address.';
  if (!address.city.trim()) errors.city = 'We need a town or city.';
  if (!/^[A-Za-z]{2}$/.test(address.country.trim())) {
    errors.country = 'Two-letter country code, like IS or GB.';
  }

  return errors;
}

/**
 * The details as the API wants them.
 *
 * Two things happen here and both matter. Whitespace is trimmed **before** the value is
 * sent, because Phase 5 found that a `z.email().transform(trim)` on the server runs its
 * transform on the way *out* — so a pasted address with a trailing space fails validation
 * and the shopper is told their address is not an address.
 *
 * And an empty optional field is **dropped rather than sent as `''`**. The server's
 * schema is strict, and an empty string is not an absent value — sending one would
 * store a blank second address line and print it on the packing slip.
 */
export function normaliseCheckout(details: CheckoutDetails): CheckoutDetails {
  const address = details.shippingAddress;
  const optional = (value: string | undefined) => value?.trim() || undefined;

  return {
    email: details.email.trim().toLowerCase(),
    shippingAddress: {
      name: address.name.trim(),
      line1: address.line1.trim(),
      city: address.city.trim(),
      country: address.country.trim().toUpperCase(),
      ...(optional(address.line2) ? { line2: optional(address.line2) } : {}),
      ...(optional(address.region) ? { region: optional(address.region) } : {}),
      ...(optional(address.postalCode) ? { postalCode: optional(address.postalCode) } : {}),
      ...(optional(address.phone) ? { phone: optional(address.phone) } : {}),
    },
  };
}
