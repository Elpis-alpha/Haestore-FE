'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toast, ToastProvider, ToastViewport } from '@/components/ui/toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CodeField } from '@/components/account/code-field';
import { AdminError, StepUpCanceled, withStepUp } from '@/lib/admin/step-up';
import { adminSend } from '@/lib/admin/client';

/**
 * What every console page shares: a way to say something happened, and a way to prove
 * it is you again without leaving the page.
 *
 * Step-up is a promise. An action that gets `STEP_UP_REQUIRED` back awaits
 * `confirmIdentity()`, which opens the code dialog and resolves when the code is verified
 * or the dialog is closed — so the action that asked for it simply continues, with the
 * page, the form and whatever the person had typed exactly as they were. That is the
 * reason the API answers 403 rather than 401: a sign-in would have thrown all of it away.
 */

type Notice = { id: number; title: string; description?: string; tone: 'good' | 'bad' };

type ConsoleContext = {
  confirmIdentity: () => Promise<boolean>;
  notify: (notice: Omit<Notice, 'id'>) => void;
  viewerId: string;
};

const Ctx = createContext<ConsoleContext | null>(null);

export function useConsole(): ConsoleContext {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useConsole must be used inside the admin console');
  return ctx;
}

export function ConsoleProvider({
  email,
  viewerId,
  children,
}: {
  email: string;
  viewerId: string;
  children: React.ReactNode;
}) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [stepUpOpen, setStepUpOpen] = useState(false);
  const resolver = useRef<((confirmed: boolean) => void) | null>(null);
  const nextId = useRef(0);

  const notify = useCallback((notice: Omit<Notice, 'id'>) => {
    nextId.current += 1;
    const id = nextId.current;
    setNotices((list) => [...list, { ...notice, id }]);
  }, []);

  const confirmIdentity = useCallback(
    () =>
      new Promise<boolean>((resolve) => {
        // A second request while one is open settles the first as declined rather than
        // leaving its caller waiting forever.
        resolver.current?.(false);
        resolver.current = resolve;
        setStepUpOpen(true);
      }),
    [],
  );

  const settle = useCallback((confirmed: boolean) => {
    resolver.current?.(confirmed);
    resolver.current = null;
    setStepUpOpen(false);
  }, []);

  const value = useMemo(
    () => ({ confirmIdentity, notify, viewerId }),
    [confirmIdentity, notify, viewerId],
  );

  return (
    <Ctx.Provider value={value}>
      <ToastProvider swipeDirection="right" duration={6000}>
        {children}
        {notices.map((notice) => (
          <Toast
            key={notice.id}
            title={notice.title}
            description={notice.description}
            tone={notice.tone}
            onOpenChange={(open) => {
              if (!open) setNotices((list) => list.filter((n) => n.id !== notice.id));
            }}
          />
        ))}
        <ToastViewport />
      </ToastProvider>

      <Dialog open={stepUpOpen} onOpenChange={(open) => !open && settle(false)}>
        <DialogContent>
          {/* Mounted only while open, so every opening starts from a fresh request. */}
          {stepUpOpen && <StepUpForm email={email} onVerified={() => settle(true)} />}
        </DialogContent>
      </Dialog>
    </Ctx.Provider>
  );
}

function StepUpForm({ email, onVerified }: { email: string; onVerified: () => void }) {
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);

  const requestCode = useCallback(async () => {
    setSending(true);
    setError(null);
    try {
      const data = await adminSend<{ challengeId: string }>('/api/auth/step-up/request', {
        method: 'POST',
      });
      setChallengeId(data.challengeId);
    } catch (err) {
      setError(err instanceof AdminError ? err.message : 'We could not send a code just now.');
    } finally {
      setSending(false);
    }
  }, []);

  async function verify(value: string) {
    if (!challengeId || value.length !== 6) return;
    setChecking(true);
    setError(null);
    try {
      await adminSend('/api/auth/step-up/verify', {
        method: 'POST',
        body: { challengeId, code: value },
      });
      onVerified();
    } catch (err) {
      setError(err instanceof AdminError ? err.message : 'That code did not work.');
      setCode('');
    } finally {
      setChecking(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Confirm it’s you</DialogTitle>
        <DialogDescription>
          This change cannot be taken back, and your last sign-in was a while ago. We’ll send a
          six-digit code to <span className="font-medium text-[var(--ink)]">{email}</span>. Nothing
          on this page is lost while you fetch it.
        </DialogDescription>
      </DialogHeader>

      <div className="mt-6 flex flex-col gap-4">
        {challengeId ? (
          <>
            <CodeField
              value={code}
              onValueChange={setCode}
              onComplete={(value) => void verify(value)}
              disabled={checking}
              invalid={Boolean(error)}
            />
            <p className="text-xs text-[var(--ink-faint)]">
              {checking
                ? 'Checking…'
                : 'The code works for ten minutes. Once confirmed, you won’t be asked again today.'}
            </p>
          </>
        ) : (
          <Button onClick={() => void requestCode()} disabled={sending} className="self-start">
            {sending ? 'Sending…' : 'Send me a code'}
          </Button>
        )}
        {error && (
          <p role="alert" className="text-sm text-[var(--bad)]">
            {error}
          </p>
        )}
        {challengeId && (
          <Button
            variant="link"
            size="sm"
            className="self-start"
            disabled={sending}
            onClick={() => void requestCode()}
          >
            Send a new code
          </Button>
        )}
      </div>
    </>
  );
}

/**
 * Runs an admin mutation with everything a console action needs around it: step-up when
 * the API asks for it, a notice either way, and a server re-read afterwards.
 *
 * `router.refresh()` rather than patching local state. Every console page reads on the
 * server, so after a change the page shows what the database now says — including when
 * the answer was a 409 because someone else got there first, which is exactly when a
 * locally patched copy would be wrong.
 */
export function useAdminAction() {
  const { confirmIdentity, notify } = useConsole();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const run = useCallback(
    async <T,>(
      action: () => Promise<T>,
      options: {
        done: string;
        description?: string;
        /** Return true to say the error was shown some other way, e.g. on a form field. */
        onError?: (error: unknown) => boolean;
        refresh?: boolean;
      },
    ): Promise<{ ok: true; value: T } | { ok: false }> => {
      setPending(true);
      try {
        const value = await withStepUp(action, confirmIdentity);
        notify({
          title: options.done,
          tone: 'good',
          ...(options.description ? { description: options.description } : {}),
        });
        if (options.refresh !== false) router.refresh();
        return { ok: true, value };
      } catch (error) {
        if (error instanceof StepUpCanceled) return { ok: false };
        if (!options.onError?.(error)) {
          notify({
            title:
              error instanceof AdminError
                ? error.message
                : 'The shop did not answer. Check your connection and try again.',
            tone: 'bad',
          });
        }
        // Someone else moved it. Show what is true now rather than the stale page.
        if (error instanceof AdminError && error.status === 409) router.refresh();
        return { ok: false };
      } finally {
        setPending(false);
      }
    },
    [confirmIdentity, notify, router],
  );

  return { run, pending };
}
