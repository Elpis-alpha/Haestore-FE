'use client';

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useMemo,
  useOptimistic,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { EMPTY_CART, type Cart } from '@/lib/cart/types';
import { applyLocally, type CartAction } from '@/lib/cart/optimistic';
import * as api from '@/lib/cart/client';

/**
 * The bag's client state.
 *
 * Three things live here and nowhere else: what the server last said, what the shopper
 * has just done and is waiting to hear about, and whether the drawer is open.
 *
 * **The cart is not fetched on mount.** A visitor with no cart is the common case, and a
 * request on every page load to be told "nothing" is a request nobody needed. The count
 * comes from a cookie the API writes (see `readBagCount`), which is enough to render the
 * badge; the lines are fetched the first time something actually needs them — the drawer
 * opening, or the cart page rendering.
 *
 * That also keeps the root layout static. `cookies()` in a layout opts every route
 * beneath it into dynamic rendering, and this layout wraps the whole site.
 */

type CartContextValue = {
  cart: Cart;
  /** The count to show. Comes from the cookie until the cart itself has been read. */
  itemCount: number;
  /** True while the first real read is outstanding, so the drawer can say so. */
  loading: boolean;
  error: string | null;
  open: boolean;
  setOpen: (open: boolean) => void;
  refresh: () => Promise<void>;
  add: (productId: string, variantId: string, quantity?: number) => Promise<void>;
  setQuantity: (lineKey: string, quantity: number) => Promise<void>;
  remove: (lineKey: string) => Promise<void>;
  move: (lineKey: string, to: 'saved' | 'cart') => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside <CartProvider>');
  return context;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<Cart>(EMPTY_CART);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  /**
   * The cookie count, read as what it is: an external store.
   *
   * `useSyncExternalStore` rather than an effect, because `document.cookie` is exactly
   * the thing it exists for — and because it is the only way to have a *different* value
   * on the server (zero, since there is no document) and on the client without a
   * hydration mismatch. It matters only until the first real read; after that `loaded`
   * is true and the server's own count wins.
   *
   * Cookies do not announce themselves, so nothing subscribes. Every cart mutation
   * already re-renders through `setCart`, which is the only time this number moves.
   */
  const cookieCount = useSyncExternalStore(subscribeToNothing, api.readBagCount, () => 0);

  /**
   * The optimistic layer.
   *
   * `useOptimistic` is the right primitive here rather than setting state and rolling
   * back by hand: React discards the optimistic value automatically when the transition
   * that produced it settles, so a failed request cannot leave a phantom quantity behind
   * — which is exactly the bug a hand-rolled rollback produces when two requests
   * overlap.
   */
  const [optimisticCart, applyOptimistic] = useOptimistic(cart, applyLocally);

  /**
   * Guards against an older response overwriting a newer one.
   *
   * Two quick taps on the stepper produce two requests, and they can land out of order:
   * without this the cart would settle on whichever the network happened to finish last
   * rather than on the last thing the shopper asked for.
   */
  const generation = useRef(0);

  const run = useCallback(
    async (work: () => Promise<Cart>, optimistic?: CartAction) => {
      const mine = ++generation.current;
      setError(null);
      if (optimistic) startTransition(() => applyOptimistic(optimistic));

      try {
        const next = await work();
        if (mine !== generation.current) return;
        setCart(next);
        setLoaded(true);
      } catch (cause) {
        if (mine !== generation.current) return;
        setError(cause instanceof Error ? cause.message : 'Something went wrong.');
        // Re-read rather than guess. The optimistic value is already discarded; asking
        // the server is the only way to know what actually happened to the bag.
        await api
          .readCart()
          .then((fresh) => {
            setCart(fresh);
            setLoaded(true);
          })
          .catch(() => undefined);
      }
    },
    [applyOptimistic],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    await run(() => api.readCart());
    setLoading(false);
  }, [run]);

  /**
   * Opening the drawer is the moment the lines are actually needed.
   *
   * Done here, in the handler, rather than in an effect watching `open`. The fetch is a
   * consequence of something the shopper did, not of a state the component drifted into
   * — and an effect for it would re-run on every dependency change, which is how a
   * drawer ends up issuing two requests to open once.
   */
  const openDrawer = useCallback(
    (next: boolean) => {
      setOpen(next);
      if (next && !loaded) void refresh();
    },
    [loaded, refresh],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      cart: optimisticCart,
      // The cookie is the fallback only until a real read has happened; after that the
      // server's own count wins, including the moment it disagrees with the cookie.
      itemCount: loaded ? optimisticCart.itemCount : cookieCount,
      loading,
      error,
      open,
      setOpen: openDrawer,
      refresh,
      add: async (productId, variantId, quantity = 1) => {
        await run(() => api.addLine(productId, variantId, quantity));
        setOpen(true);
      },
      setQuantity: (lineKey, quantity) =>
        run(() => api.setLineQuantity(lineKey, quantity), { kind: 'quantity', lineKey, quantity }),
      remove: (lineKey) => run(() => api.removeLine(lineKey), { kind: 'remove', lineKey }),
      move: (lineKey, to) => run(() => api.moveLine(lineKey, to), { kind: 'move', lineKey, to }),
    }),
    [optimisticCart, loaded, cookieCount, loading, error, open, openDrawer, refresh, run],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/** `useSyncExternalStore` requires a subscribe; a cookie has nothing to subscribe to. */
function subscribeToNothing(): () => void {
  return () => undefined;
}
