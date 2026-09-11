'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SlabRule } from '@/components/motifs/rule';
import { reconcile } from '@/lib/checkout/client';
import type { CheckoutError } from '@/lib/checkout/client';
import { STATUS_LABELS, type Order } from '@/lib/checkout/types';
import { OrderSummary } from './order-summary';
import { useCart } from '@/components/cart/cart-provider';

/**
 * The page a shopper lands on after paying.
 *
 * **This is where the demo's whole payment story is proved.** It asks our server to ask
 * the provider what actually happened, and the answer funnels into the same
 * `markOrderPaid` a webhook would call — so a purchase completes with zero webhooks
 * delivered, which is what makes the happy path runnable on a laptop behind NAT. If the
 * webhook *did* arrive first, this finds the order already settled and says the same
 * thing.
 *
 * It retries a few times before giving up, because some payment methods settle a second
 * or two after the redirect. The retry is bounded and then says something true rather
 * than spinning forever — "we have not seen the payment yet" is a better answer than a
 * spinner that never resolves.
 */

const ATTEMPTS = [0, 1500, 3000, 5000];

export function ReturnView({ orderNumber }: { orderNumber: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [state, setState] = useState<'checking' | 'paid' | 'pending' | 'error'>('checking');
  const [message, setMessage] = useState('');
  const { refresh } = useCart();
  const started = useRef(false);

  const check = useCallback(async () => {
    // The token a guest was handed when the order was created. An account holder has a
    // session instead and needs none.
    const claimToken = sessionStorage.getItem(`hae_claim_${orderNumber}`);

    for (const [index, delay] of ATTEMPTS.entries()) {
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));

      try {
        const result = await reconcile(orderNumber, claimToken);
        setOrder(result.order);

        if (result.order.payment.paid) {
          setState('paid');
          // The bag was retired server-side when the order was created; this is what
          // makes the header's badge agree.
          void refresh();
          return;
        }

        if (index === ATTEMPTS.length - 1) setState('pending');
      } catch (err) {
        const error = err as CheckoutError;
        // A 404 here means the order number is not ours, or the claim token is gone —
        // a shopper who cleared their tab storage, most likely.
        setMessage(
          error.status === 404
            ? 'We could not find that order. If you have an account, it will be in your order history.'
            : error.message,
        );
        setState('error');
        return;
      }
    }
  }, [orderNumber, refresh]);

  useEffect(() => {
    // Effects run twice in development's strict mode, and this one is a network call
    // against a payment. Once.
    if (started.current) return;
    started.current = true;
    void check();
  }, [check]);

  if (state === 'checking' && !order) {
    return (
      <div className="mt-8 flex flex-col gap-4">
        <p className="text-[var(--ink-muted)]">Confirming your payment…</p>
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="mt-8 flex flex-col items-start gap-4">
        <p className="text-[var(--bad)]">{message}</p>
        <Button asChild variant="outline">
          <Link href="/shop">Back to the shop</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-8">
      <div>
        <p
          className={
            state === 'paid'
              ? 'font-display text-2xl [--opsz:32] [--wght:600] text-[var(--good)]'
              : 'font-display text-2xl [--opsz:32] [--wght:600] text-[var(--note)]'
          }
        >
          {state === 'paid'
            ? 'Thank you — your order is confirmed.'
            : 'We have not seen your payment yet.'}
        </p>
        <p className="mt-2 text-[var(--ink-muted)]">
          {state === 'paid' ? (
            <>
              Order {orderNumber}. A receipt is on its way to {order?.email}.
            </>
          ) : (
            <>
              Order {orderNumber} is held for a short while. If you did pay, this page will catch up
              — refresh in a moment, or check your email for the receipt.
            </>
          )}
        </p>
      </div>

      {order && (
        <>
          <SlabRule />
          <div className="grid gap-8 sm:grid-cols-[1fr_18rem]">
            <OrderSummary
              lines={order.lines}
              subtotal={order.totals.subtotal}
              grandTotal={order.totals.grandTotal}
              heading="What you bought"
            />
            <div className="flex flex-col gap-4 text-sm">
              <div>
                <p className="text-[var(--ink-faint)]">Status</p>
                <p>{STATUS_LABELS[order.status]}</p>
              </div>
              <div>
                <p className="text-[var(--ink-faint)]">Shipping to</p>
                <address className="not-italic leading-relaxed">
                  {order.shippingAddress.name}
                  <br />
                  {order.shippingAddress.line1}
                  <br />
                  {order.shippingAddress.line2 && (
                    <>
                      {order.shippingAddress.line2}
                      <br />
                    </>
                  )}
                  {order.shippingAddress.city}
                  {order.shippingAddress.region ? `, ${order.shippingAddress.region}` : ''}{' '}
                  {order.shippingAddress.postalCode}
                  <br />
                  {order.shippingAddress.country}
                </address>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="flex gap-3">
        <Button asChild>
          <Link href="/shop">Keep shopping</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/account/orders">Your orders</Link>
        </Button>
      </div>
    </div>
  );
}
