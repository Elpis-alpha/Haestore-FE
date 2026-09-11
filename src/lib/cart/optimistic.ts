import type { Cart } from './types';

/**
 * What the shopper has just done and is waiting to hear about.
 *
 * Pure, and in `lib/` rather than inside the provider, for the same reason the backend's
 * merge is pure: this is arithmetic on money and counts, and arithmetic that is wrong
 * inside a component is arithmetic nobody can test without rendering one.
 */
export type CartAction =
  | { kind: 'quantity'; lineKey: string; quantity: number }
  | { kind: 'remove'; lineKey: string }
  | { kind: 'move'; lineKey: string; to: 'saved' | 'cart' };

/**
 * The local guess, for the moment between the tap and the answer.
 *
 * It re-computes the subtotal and the count so the numbers move together — a quantity
 * that changes while the total sits still reads as broken, which is worse than waiting.
 * It deliberately does **not** guess about stock: raising a quantity past what is
 * available shows the higher number for an instant and then corrects, because the
 * alternative is a stepper that silently refuses and looks stuck.
 *
 * Adding a line is not here at all. A new line needs a title, a photograph and a price
 * the client does not have, so an optimistic add would be a grey rectangle — the server
 * answers fast enough that the drawer opening on real data is the better trade.
 */
export function applyLocally(cart: Cart, action: CartAction): Cart {
  switch (action.kind) {
    case 'quantity': {
      if (action.quantity <= 0)
        return applyLocally(cart, { kind: 'remove', lineKey: action.lineKey });
      return recount({
        ...cart,
        lines: cart.lines.map((line) =>
          line.lineKey === action.lineKey
            ? {
                ...line,
                quantity: action.quantity,
                sellableQuantity: action.quantity,
                // Currency from the unit price, not from the old total: the amount is
                // derived from the unit price, and taking the two halves of one figure
                // from two places is how a right number ends up in a wrong currency.
                // The server's multiplyMoney does the same.
                lineTotal: {
                  amount: line.unitPrice.amount * action.quantity,
                  currency: line.unitPrice.currency,
                },
              }
            : line,
        ),
      });
    }

    case 'remove':
      return recount({
        ...cart,
        lines: cart.lines.filter((line) => line.lineKey !== action.lineKey),
        savedForLater: cart.savedForLater.filter((line) => line.lineKey !== action.lineKey),
      });

    case 'move': {
      const from = action.to === 'saved' ? cart.lines : cart.savedForLater;
      const moved = from.find((line) => line.lineKey === action.lineKey);
      if (!moved) return cart;

      return recount(
        action.to === 'saved'
          ? {
              ...cart,
              lines: cart.lines.filter((line) => line.lineKey !== action.lineKey),
              savedForLater: [...cart.savedForLater, moved],
            }
          : {
              ...cart,
              savedForLater: cart.savedForLater.filter((line) => line.lineKey !== action.lineKey),
              lines: [...cart.lines, moved],
            },
      );
    }
  }
}

/** Keeps the derived figures in step with the lines, the same way the server does. */
export function recount(cart: Cart): Cart {
  return {
    ...cart,
    itemCount: cart.lines.reduce((total, line) => total + line.sellableQuantity, 0),
    subtotal: {
      ...cart.subtotal,
      amount: cart.lines.reduce((total, line) => total + line.lineTotal.amount, 0),
    },
  };
}
