'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldHint, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Surface } from '@/components/ui/surface';
import { SlabRule } from '@/components/motifs/rule';
import { useCart } from '@/components/cart/cart-provider';
import { isBlocking } from '@/lib/cart/types';
import type { CheckoutError } from '@/lib/checkout/client';
import {
  capturePayPal,
  createSession,
  newIdempotencyKey,
  type CheckoutDetails,
  type PayPalSession,
  type StripeSession,
} from '@/lib/checkout/client';
import type { Order } from '@/lib/checkout/types';
import { normaliseCheckout, validateCheckout, type FieldErrors } from '@/lib/checkout/validate';
import { OrderSummary } from './order-summary';
import { StripePanel } from './stripe-panel';
import { PayPalPanel } from './paypal-panel';

/**
 * Checkout, in two steps on one page.
 *
 * **Details, then payment** — and the step boundary is where the order is created. That
 * is not a UI nicety: creating the order is what reserves the stock and fixes the amount,
 * so it must happen exactly once, after the shopper has committed to an address and
 * before any provider is shown a number. Splitting it any other way means either
 * reserving stock for someone who is still typing, or letting a provider quote a price
 * the server has not agreed to.
 *
 * One page rather than a wizard because there are two things to collect and a wizard
 * over two steps is a wizard that exists to look like a wizard.
 */

type Step =
  | { name: 'details' }
  | { name: 'pay'; order: Order; stripeSecret: string | null; paypalOrderId: string | null };

const EMPTY: CheckoutDetails = {
  email: '',
  shippingAddress: {
    name: '',
    line1: '',
    line2: '',
    city: '',
    region: '',
    postalCode: '',
    country: '',
  },
};

export function CheckoutForm() {
  const { cart, loading, refresh } = useCart();
  const [details, setDetails] = useState<CheckoutDetails>(EMPTY);
  const [step, setStep] = useState<Step>({ name: 'details' });
  const [provider, setProvider] = useState<'stripe' | 'paypal'>('stripe');
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);

  /**
   * One key for the whole attempt, minted on mount and reused across every retry.
   *
   * This is the entire point of the header: a key regenerated per press would make a
   * double-tap two orders, which is exactly what it exists to prevent. It is only
   * replaced when an attempt genuinely fails in a way the shopper must redo — see
   * `place` below.
   */
  const idempotencyKey = useRef(newIdempotencyKey());

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const settling = loading && cart.lines.length === 0;
  const empty = !settling && cart.lines.length === 0;

  /**
   * A line the server will refuse. Phase 6 shipped `isBlocking` with nothing consuming
   * it; this is the consumer. Better to say so here than to let the shopper fill in an
   * address and be refused at the transaction.
   */
  const blocked = cart.lines.filter((line) => line.changes.some(isBlocking));

  function validate(): boolean {
    const found = validateCheckout(details);
    setFieldErrors(found);
    return Object.keys(found).length === 0;
  }

  /** Creates the order and moves to the payment step. */
  async function place(chosen: 'stripe' | 'paypal') {
    if (!validate()) return;

    setSubmitting(true);
    setError('');

    try {
      const clean = normaliseCheckout(details);

      const session = await createSession(clean, chosen, idempotencyKey.current);
      const order = session.order;

      setStep({
        name: 'pay',
        order,
        stripeSecret: (session as StripeSession).stripe?.clientSecret ?? null,
        paypalOrderId: (session as PayPalSession).paypal?.orderId ?? null,
      });

      // The guest's one-time link back to this order, kept for the return page. It is
      // returned exactly once and only the HMAC is stored, so losing it loses access.
      if (order.claimToken) {
        sessionStorage.setItem(`hae_claim_${order.orderNumber}`, order.claimToken);
      }
    } catch (err) {
      const checkoutError = err as CheckoutError;

      if (checkoutError.code === 'INSUFFICIENT_STOCK') {
        setError(
          'Something in your bag sold out while you were checking out. Your bag has been updated.',
        );
        // A fresh key: the next attempt is a genuinely different request, because the
        // bag it is built from has changed.
        idempotencyKey.current = newIdempotencyKey();
        void refresh();
      } else {
        setError(checkoutError.message);
      }
      setSubmitting(false);
    }
  }

  if (settling) {
    return (
      <div className="mt-8 flex flex-col gap-4">
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (empty && step.name === 'details') {
    return (
      <div className="mt-8 flex flex-col items-start gap-4">
        <p className="text-[var(--ink-muted)]">There is nothing in your bag to check out.</p>
        <Button asChild>
          <Link href="/shop">Go to the shop</Link>
        </Button>
      </div>
    );
  }

  if (step.name === 'pay') {
    const returnUrl = `${window.location.origin}/checkout/return?order=${step.order.orderNumber}`;

    return (
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-6">
          <div>
            <h2 className="font-display text-xl [--opsz:24] [--wght:600]">Pay</h2>
            <p className="mt-1 text-sm text-[var(--ink-muted)]">
              Order {step.order.orderNumber}. Your items are held while you pay.
            </p>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-sm border border-[var(--bad)]/40 p-3 text-sm text-[var(--bad)]"
            >
              {error}
            </p>
          )}

          {/*
            **The payment step is paper**, which is Phase 1's rule rather than a
            decoration: the ground is the shop and paper is where you transact. It is
            also what makes the provider widgets legible — Stripe draws its field labels
            on the host background, so a Payment Element mounted straight onto the brown
            ground renders dark ink on dark brown. Found in a browser, not in a test.
          */}
          <Surface tone="paper" className="rounded-sm border border-[var(--edge)] p-5 sm:p-6">
            {step.stripeSecret && (
              <StripePanel
                clientSecret={step.stripeSecret}
                returnUrl={returnUrl}
                onError={setError}
              />
            )}

            {step.paypalOrderId && (
              <PayPalPanel
                createOrder={() => Promise.resolve(step.paypalOrderId!)}
                onApprove={async (paypalOrderId) => {
                  try {
                    await capturePayPal(paypalOrderId, newIdempotencyKey());
                    window.location.assign(returnUrl);
                  } catch (err) {
                    setError((err as CheckoutError).message);
                  }
                }}
                onError={setError}
              />
            )}
          </Surface>

          <p className="text-xs text-[var(--ink-faint)]">
            Changed your mind?{' '}
            <Link href="/cart" className="underline underline-offset-4">
              Go back to your bag
            </Link>
            . Anything you do not pay for is released back to the shop shortly.
          </p>
        </div>

        <aside className="lg:border-l lg:border-[var(--edge)] lg:pl-8">
          <OrderSummary
            lines={step.order.lines}
            subtotal={step.order.totals.subtotal}
            grandTotal={step.order.totals.grandTotal}
          />
        </aside>
      </div>
    );
  }

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_20rem]">
      <form
        className="flex flex-col gap-6"
        onSubmit={(event) => {
          event.preventDefault();
          void place(provider);
        }}
      >
        {blocked.length > 0 && (
          <div className="rounded-sm border border-[var(--bad)]/40 p-3 text-sm text-[var(--bad)]">
            <p>Some items cannot be bought right now:</p>
            <ul className="mt-1 list-disc pl-5">
              {blocked.map((line) => (
                <li key={line.lineKey}>{line.title}</li>
              ))}
            </ul>
            <Link href="/cart" className="mt-2 inline-block underline underline-offset-4">
              Fix this in your bag
            </Link>
          </div>
        )}

        {error && (
          <p
            role="alert"
            className="rounded-sm border border-[var(--bad)]/40 p-3 text-sm text-[var(--bad)]"
          >
            {error}
          </p>
        )}

        <Field invalid={Boolean(fieldErrors.email)}>
          <FieldLabel>Email</FieldLabel>
          <Input
            type="email"
            autoComplete="email"
            value={details.email}
            onChange={(e) => setDetails({ ...details, email: e.target.value })}
          />
          <FieldHint>Your receipt goes here. No account needed.</FieldHint>
          {fieldErrors.email && <FieldError>{fieldErrors.email}</FieldError>}
        </Field>

        <SlabRule />

        <fieldset className="flex flex-col gap-4">
          <legend className="font-display text-xl [--opsz:24] [--wght:600]">Where it goes</legend>

          <Field invalid={Boolean(fieldErrors.name)}>
            <FieldLabel>Full name</FieldLabel>
            <Input
              autoComplete="name"
              value={details.shippingAddress.name}
              onChange={(e) => setAddress('name', e.target.value)}
            />
            {fieldErrors.name && <FieldError>{fieldErrors.name}</FieldError>}
          </Field>

          <Field invalid={Boolean(fieldErrors.line1)}>
            <FieldLabel>Address</FieldLabel>
            <Input
              autoComplete="address-line1"
              value={details.shippingAddress.line1}
              onChange={(e) => setAddress('line1', e.target.value)}
            />
            {fieldErrors.line1 && <FieldError>{fieldErrors.line1}</FieldError>}
          </Field>

          <Field>
            <FieldLabel>Apartment, suite (optional)</FieldLabel>
            <Input
              autoComplete="address-line2"
              value={details.shippingAddress.line2 ?? ''}
              onChange={(e) => setAddress('line2', e.target.value)}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field invalid={Boolean(fieldErrors.city)}>
              <FieldLabel>Town or city</FieldLabel>
              <Input
                autoComplete="address-level2"
                value={details.shippingAddress.city}
                onChange={(e) => setAddress('city', e.target.value)}
              />
              {fieldErrors.city && <FieldError>{fieldErrors.city}</FieldError>}
            </Field>

            <Field>
              <FieldLabel>Region or state (optional)</FieldLabel>
              <Input
                autoComplete="address-level1"
                value={details.shippingAddress.region ?? ''}
                onChange={(e) => setAddress('region', e.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel>Postcode (optional)</FieldLabel>
              <Input
                autoComplete="postal-code"
                value={details.shippingAddress.postalCode ?? ''}
                onChange={(e) => setAddress('postalCode', e.target.value)}
              />
            </Field>

            <Field invalid={Boolean(fieldErrors.country)}>
              <FieldLabel>Country</FieldLabel>
              <Input
                autoComplete="country"
                maxLength={2}
                placeholder="IS"
                className="uppercase"
                value={details.shippingAddress.country}
                onChange={(e) => setAddress('country', e.target.value)}
              />
              <FieldHint>Two letters.</FieldHint>
              {fieldErrors.country && <FieldError>{fieldErrors.country}</FieldError>}
            </Field>
          </div>
        </fieldset>

        <SlabRule />

        <fieldset className="flex flex-col gap-3">
          <legend className="font-display text-xl [--opsz:24] [--wght:600]">How you pay</legend>
          <p className="text-sm text-[var(--ink-muted)]">Nothing is charged until the next step.</p>

          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <Button
              type="submit"
              size="lg"
              disabled={submitting || blocked.length > 0}
              onClick={() => setProvider('stripe')}
            >
              {submitting && provider === 'stripe' ? 'One moment…' : 'Pay by card'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={submitting || blocked.length > 0}
              onClick={() => {
                setProvider('paypal');
                void place('paypal');
              }}
            >
              {submitting && provider === 'paypal' ? 'One moment…' : 'Pay with PayPal'}
            </Button>
          </div>
        </fieldset>
      </form>

      <aside className="lg:border-l lg:border-[var(--edge)] lg:pl-8">
        <OrderSummary
          lines={cart.lines.map((line) => ({
            lineKey: line.lineKey,
            title: line.title,
            axisValues: line.axisValues,
            quantity: line.sellableQuantity,
            lineTotal: line.lineTotal,
          }))}
          subtotal={cart.subtotal}
          grandTotal={cart.subtotal}
          heading="Your bag"
        />
      </aside>
    </div>
  );

  function setAddress(key: keyof CheckoutDetails['shippingAddress'], value: string) {
    setDetails((current) => ({
      ...current,
      shippingAddress: { ...current.shippingAddress, [key]: value },
    }));
  }
}
