import type { components, paths } from '@/lib/api/schema';

/**
 * The bag's shapes, taken from the generated contract rather than described again.
 *
 * Phase 5 shipped an account page that read `data.account` from a response whose field
 * is `data.user`, and it typechecked, because the type was written next to the fetch as
 * a guess. Every shape here comes from `schema.d.ts`; a rename on the backend is a
 * compile error in this repo, which is the whole argument of ADR-001.
 */

export type Cart = components['schemas']['Cart'];
export type CartLine = components['schemas']['CartLine'];
export type LineChange = components['schemas']['LineChange'];
export type MergeReport = components['schemas']['MergeReport'];
export type WishlistEntry = components['schemas']['WishlistEntry'];

export type CartResponse =
  paths['/api/cart']['get']['responses'][200]['content']['application/json'];

/** An empty bag, so a signed-out first render has something real to show. */
export const EMPTY_CART: Cart = {
  lines: [],
  savedForLater: [],
  subtotal: { amount: 0, currency: 'USD' },
  itemCount: 0,
  currency: 'USD',
  needsAttention: false,
};

/**
 * A line's problems, in the words a shopper uses.
 *
 * The backend names *facts* — `clamped`, `price_changed` — and deliberately does not
 * decide how loudly to say them. This is where that decision lives, once, so a notice
 * reads the same in the drawer, on the cart page and in the merge report.
 */
export function describeChange(change: LineChange, formatPrice: (money: Money) => string): string {
  switch (change.kind) {
    case 'added':
      return 'Added from the bag you had before signing in';
    case 'quantity_raised':
      return `Quantity raised from ${change.from as number} to ${change.to as number}`;
    case 'price_changed':
      return `The price changed from ${formatPrice(change.from as Money)} to ${formatPrice(
        change.to as Money,
      )}`;
    case 'clamped':
      return change.available === 0
        ? 'This has sold out since you added it'
        : `Only ${change.available ?? 0} left, so we lowered the quantity`;
    case 'saved_for_later':
      return 'Sold out for now — we moved it to your saved items';
    case 'dropped':
      return change.reason === 'currency'
        ? 'This is no longer priced in the shop currency'
        : 'This is no longer for sale';
  }
}

type Money = components['schemas']['Money'];

/** True for the changes that should stop somebody paying before they have read them. */
export function isBlocking(change: LineChange): boolean {
  return change.kind === 'dropped' || change.kind === 'clamped';
}
