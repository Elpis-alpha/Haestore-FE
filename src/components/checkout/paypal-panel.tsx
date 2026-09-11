'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * The PayPal step.
 *
 * The SDK script is loaded by hand rather than through `@paypal/react-paypal-js`. The
 * wrapper is mostly a script loader and a context, and this file is the only place in
 * the repo that needs one — the same argument that kept the Stripe *server* integration
 * on plain `fetch`. Loading it once at module scope and resolving the same promise for
 * every mount is what the wrapper's context does, and is ten lines.
 *
 * **Neither callback here reports an amount or a status to our server.** `createOrder`
 * asks our API for a PayPal order id; `onApprove` asks our API to capture. The browser's
 * own `data` object is deliberately unused except for the id, because it is the browser's
 * word — and taking the browser's word is exactly what made the 2022 endpoint free money.
 */

type PayPalNamespace = {
  Buttons: (options: Record<string, unknown>) => {
    render: (container: HTMLElement) => Promise<void>;
    close: () => void;
  };
};

declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

let sdkPromise: Promise<PayPalNamespace | null> | null = null;

function loadPayPal(): Promise<PayPalNamespace | null> {
  if (sdkPromise) return sdkPromise;

  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  if (!clientId) return Promise.resolve(null);

  sdkPromise = new Promise((resolve) => {
    if (window.paypal) {
      resolve(window.paypal);
      return;
    }
    const script = document.createElement('script');
    const params = new URLSearchParams({
      'client-id': clientId,
      currency: 'USD',
      // The order is created and captured on our server, so the SDK only needs to run
      // the approval window.
      intent: 'capture',
      components: 'buttons',
      // No card fields from PayPal: cards go through Stripe, and offering two card
      // forms on one page is a way to make a shopper wonder which one is real.
      'disable-funding': 'card',
    });
    script.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
    script.async = true;
    script.onload = () => resolve(window.paypal ?? null);
    script.onerror = () => {
      // Cleared so a later mount can retry rather than resolving null forever from a
      // cached rejected promise.
      sdkPromise = null;
      resolve(null);
    };
    document.head.appendChild(script);
  });

  return sdkPromise;
}

export function PayPalPanel({
  createOrder,
  onApprove,
  onError,
}: {
  createOrder: () => Promise<string>;
  onApprove: (paypalOrderId: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'unavailable'>('loading');

  /**
   * The callbacks are held in a ref and read at call time.
   *
   * The SDK captures whatever it is handed when `Buttons()` is constructed, so a button
   * rendered once would hold the first render's closures forever — and this component's
   * `createOrder` closes over the address form's current values. Re-rendering the button
   * on every change instead would tear down PayPal's iframe mid-interaction.
   */
  const handlers = useRef({ createOrder, onApprove, onError });

  /**
   * Updated in an effect rather than during render. Mutating a ref while rendering is
   * unsafe under concurrent rendering — React may render a component and discard the
   * result, leaving the ref holding callbacks from a render that never committed.
   */
  useEffect(() => {
    handlers.current = { createOrder, onApprove, onError };
  }, [createOrder, onApprove, onError]);

  useEffect(() => {
    let cancelled = false;
    let instance: { close: () => void } | null = null;

    void loadPayPal().then((paypal) => {
      if (cancelled || !container.current) return;
      if (!paypal) {
        setState('unavailable');
        return;
      }

      const buttons = paypal.Buttons({
        style: { layout: 'vertical', shape: 'rect', label: 'paypal', height: 48 },
        createOrder: () => handlers.current.createOrder(),
        onApprove: (data: { orderID: string }) => handlers.current.onApprove(data.orderID),
        onError: () =>
          handlers.current.onError('PayPal could not complete that. Try again, or pay by card.'),
        // Not an error: the shopper closed the window. Saying nothing is correct — their
        // order is still pending and the buttons are still there.
        onCancel: () => handlers.current.onError(''),
      });

      instance = buttons;
      void buttons.render(container.current).then(() => {
        if (!cancelled) setState('ready');
      });
    });

    return () => {
      cancelled = true;
      try {
        instance?.close();
      } catch {
        // The SDK throws if the container is already gone, which is exactly when this
        // runs. Nothing to recover from.
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-3">
      {state === 'loading' && <p className="text-sm text-[var(--ink-muted)]">Loading PayPal…</p>}
      {state === 'unavailable' && (
        <p className="text-sm text-[var(--bad)]">
          PayPal is unavailable right now. You can still pay by card.
        </p>
      )}
      <div ref={container} />
    </div>
  );
}
