'use client';

import { useState } from 'react';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';

/**
 * The card step.
 *
 * Stripe's Payment Element, not a hand-built card form: the fields are iframes served by
 * Stripe, so the card number never touches this origin and the shop stays out of PCI
 * scope. That is also why the two `@stripe/*` packages are the only payment dependencies
 * in this repo — everything server-side is plain `fetch` (ADR-012), but a compliant card
 * field is not something to hand-roll.
 *
 * **The amount is not passed in and cannot be.** The client secret authorises confirming
 * one specific PaymentIntent, whose amount was fixed on the server inside the same
 * transaction that reserved the stock. There is nothing on this screen that could change
 * what is charged.
 */

/**
 * Loaded once per page load, at module scope, because `loadStripe` injects a script tag
 * and calling it inside a component re-runs it on every render.
 */
const stripePromise: Promise<Stripe | null> | null = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

export function StripePanel({
  clientSecret,
  returnUrl,
  onError,
}: {
  clientSecret: string;
  returnUrl: string;
  onError: (message: string) => void;
}) {
  if (!stripePromise) {
    return (
      <p className="text-sm text-[var(--bad)]">
        Card payment is not configured. Set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.
      </p>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          /**
           * Matched to `.surface-paper`'s tokens, because that is the surface the panel
           * is mounted on — see the Surface wrapper in checkout-form.tsx.
           *
           * **`colorText` must be the paper surface's ink, not the ground's.** Stripe
           * renders its field *labels* on the host background with `colorText` while the
           * inputs use `colorTextSecondary`-ish values inside `colorBackground`. Pointing
           * colorText at the dark ink while the panel sat on the brown ground put
           * dark-on-dark labels on the payment form — legible in a screenshot only if you
           * already knew what they said. Caught in a real browser, not in a unit test.
           */
          variables: {
            colorPrimary: '#2c1d13', // --color-bark-800, the paper focus ring
            colorBackground: '#f6efe5', // --color-paper-100, the paper --field
            colorText: '#17100a', // --color-bark-950, paper --ink
            colorTextSecondary: '#66452f', // --color-bark-500, paper --ink-muted
            colorTextPlaceholder: '#7e5b41', // --color-bark-400, paper --ink-faint
            colorDanger: '#8e3624', // --color-madder-600, paper --bad
            fontFamily: 'Karla, ui-sans-serif, system-ui, sans-serif',
            borderRadius: '3px',
            spacingUnit: '4px',
          },
          rules: {
            '.Input': { border: '1px solid #d9c8b0', boxShadow: 'none' },
            '.Input:focus': {
              border: '1px solid #2c1d13',
              boxShadow: 'none',
              outline: '2px solid #2c1d13',
              outlineOffset: '1px',
            },
            '.Tab': { border: '1px solid #d9c8b0', boxShadow: 'none' },
            '.Tab--selected': { border: '1px solid #2c1d13', boxShadow: 'none' },
          },
        },
      }}
    >
      <StripeForm returnUrl={returnUrl} onError={onError} />
    </Elements>
  );
}

function StripeForm({ returnUrl, onError }: { returnUrl: string; onError: (m: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    onError('');

    /**
     * `redirect: 'if_required'` keeps a plain card payment on this page and only leaves
     * for the methods that genuinely need it (3-D Secure, a bank redirect). Either way
     * the shopper ends up on the return page, which reconciles — so the happy path never
     * depends on a webhook having been delivered.
     */
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: 'if_required',
    });

    if (result.error) {
      // Stripe's messages are already written for shoppers, and are more specific than
      // anything this layer could say — "your card was declined" beats "payment failed".
      onError(result.error.message ?? 'That payment could not be completed.');
      setSubmitting(false);
      return;
    }

    // No redirect was required, so nothing has navigated. Go to the return page, which
    // asks the server what actually happened rather than trusting this result object.
    window.location.assign(returnUrl);
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <PaymentElement options={{ layout: 'tabs' }} />
      <Button type="submit" size="lg" disabled={!stripe || submitting}>
        {submitting ? 'Paying…' : 'Pay now'}
      </Button>
    </form>
  );
}
