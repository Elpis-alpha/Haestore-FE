'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldHint, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { CodeField } from './code-field';

/**
 * Sign in, in two steps and no passwords.
 *
 * **This posts from the browser to `/api/auth/*`, through the Next rewrite, and that
 * is the whole reason the rewrite exists.** The response's `Set-Cookie` has to land on
 * the origin the shopper is browsing, or the `__Host-` prefix — which forbids a
 * `Domain` attribute — makes the cookie unusable. A server action calling Express
 * directly would have to catch the header and re-issue it, reimplementing by hand the
 * one thing the browser already does correctly.
 *
 * There is no "create an account" anywhere in this component, because there is no such
 * operation. The first correct code for an address makes the account.
 */

type Step = { name: 'email' } | { name: 'code'; email: string; challengeId: string };

type ApiError = { error?: { message?: string } };

export function SignInForm({ next }: { next: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>({ name: 'email' });
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  async function requestCode(address: string) {
    setPending(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: address }),
      });
      const body = (await response.json()) as {
        data?: { challengeId: string; cooldownSeconds: number };
      } & ApiError;

      if (!response.ok || !body.data) {
        setError(body.error?.message ?? 'We could not send a code just now.');
        return;
      }

      setStep({ name: 'code', email: address, challengeId: body.data.challengeId });
      setCooldown(body.data.cooldownSeconds);
      setCode('');
    } catch {
      setError('We could not reach the shop. Check your connection and try again.');
    } finally {
      setPending(false);
    }
  }

  async function submitCode(value: string) {
    if (step.name !== 'code' || value.length !== 6) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ challengeId: step.challengeId, code: value }),
      });

      if (!response.ok) {
        const body = (await response.json()) as ApiError;
        setError(body.error?.message ?? 'That code did not work.');
        setCode('');
        return;
      }

      /**
       * `push` first, then `refresh`. The other order silently does nothing: the
       * refresh starts an RSC request for the *current* route, and the push issued
       * in the same tick is dropped while that is in flight — a successful sign-in
       * that sets the cookie and leaves the person on the sign-in form, which is
       * exactly what it looked like when this was the other way round.
       *
       * The refresh still matters afterwards, to discard any cached signed-out tree
       * behind the destination.
       */
      router.push(next);
      router.refresh();
    } catch {
      setError('We could not reach the shop. Check your connection and try again.');
      setCode('');
    } finally {
      setPending(false);
    }
  }

  if (step.name === 'email') {
    return (
      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          void requestCode(email.trim());
        }}
        noValidate
      >
        <Field invalid={Boolean(error)}>
          <FieldLabel>Email</FieldLabel>
          <Input
            type="email"
            name="email"
            autoComplete="email"
            autoFocus
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
          <FieldHint>We send a six-digit code. There is no password to forget.</FieldHint>
          <FieldError>{error}</FieldError>
        </Field>

        <Button type="submit" size="lg" disabled={pending || email.trim().length === 0}>
          {pending ? 'Sending…' : 'Send me a code'}
        </Button>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <Field invalid={Boolean(error)}>
        <FieldLabel>Your code</FieldLabel>
        <p className="text-sm text-[var(--ink-muted)]">
          Sent to <span className="text-[var(--ink)]">{step.email}</span>. It expires in ten
          minutes.
        </p>
        <div className="pt-1">
          <CodeField
            value={code}
            onValueChange={setCode}
            onComplete={(value) => void submitCode(value)}
            disabled={pending}
            invalid={Boolean(error)}
          />
        </div>
        <FieldError>{error}</FieldError>
      </Field>

      {/*
        A submit button, even though `autoSubmit` means almost nobody will press it.
        It is the guaranteed path: any way a value reaches the field without the
        keystrokes Radix hooks — a password manager, an autofill, a future change to
        an `unstable_` component — would otherwise leave a person staring at six
        filled boxes with nothing to press. Cheap insurance against a dead end, and
        the thing a keyboard user tabs to.
      */}
      <Button
        type="button"
        size="lg"
        disabled={pending || code.length !== 6}
        onClick={() => void submitCode(code)}
      >
        {pending ? 'Checking…' : 'Continue'}
      </Button>

      <div className="flex flex-wrap items-center gap-4">
        <ResendButton
          seconds={cooldown}
          onTick={setCooldown}
          disabled={pending}
          onResend={() => void requestCode(step.email)}
        />
        <Button
          variant="link"
          size="sm"
          type="button"
          onClick={() => {
            setStep({ name: 'email' });
            setError(null);
            setCode('');
          }}
        >
          Use a different address
        </Button>
      </div>
    </div>
  );
}

/**
 * The countdown, which exists so the server's silent cooldown is not confusing.
 *
 * The API enforces a 60-second gap per address and says nothing about it — telling a
 * caller "wait 40 seconds for that address" would leak that the address is being
 * throttled, which is a signal about the address. Showing the same countdown to
 * everyone in the browser, where the person already knows they just asked, is the
 * honest half of that: the shopper is never left pressing a button that does nothing.
 */
function ResendButton({
  seconds,
  onTick,
  onResend,
  disabled,
}: {
  seconds: number;
  onTick: (value: number) => void;
  onResend: () => void;
  disabled?: boolean;
}) {
  useEffect(() => {
    if (seconds <= 0) return;
    // `onTick` is the parent's setState, whose identity React guarantees is stable, so
    // naming it as a dependency is honest rather than a re-scheduling loop. The ref
    // this replaced was reading `.current` during render, which is the same mistake in
    // a costume.
    const timer = setTimeout(() => onTick(seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds, onTick]);

  return (
    <Button
      variant="outline"
      size="sm"
      type="button"
      onClick={onResend}
      disabled={disabled || seconds > 0}
    >
      {seconds > 0 ? `Send another in ${seconds}s` : 'Send another code'}
    </Button>
  );
}
