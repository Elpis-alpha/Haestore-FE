'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldHint, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/input';
import { adminSend } from '@/lib/admin/client';
import type { AdminOrderAction } from '@/lib/admin/types';
import { useAdminAction } from './console-provider';

/**
 * The buttons an order offers, rendered from what the server says is possible.
 *
 * The forward path is one press each: packing, shipping and delivery are routine, and a
 * confirmation on routine work teaches people to click through confirmations. The two
 * endings — cancel and refund — each open a dialog first, because they cannot be undone,
 * and the API will also ask for a fresh code if the last one is old.
 */
export function OrderActions({
  orderId,
  actions,
  provider,
  stockReserved,
}: {
  orderId: string;
  actions: AdminOrderAction[];
  provider: string;
  stockReserved: boolean;
}) {
  const { run, pending } = useAdminAction();
  const [ending, setEnding] = useState<'cancel' | 'record_refund' | null>(null);

  if (actions.length === 0) {
    return <p className="text-sm text-[var(--ink-muted)]">Nothing more happens to this order.</p>;
  }

  const advance = (to: 'processing' | 'shipped' | 'delivered', done: string) =>
    run(() => adminSend(`/api/admin/orders/${orderId}/status`, { method: 'POST', body: { to } }), {
      done,
    });

  const reconcile = () =>
    run(
      () =>
        adminSend<{ outcome: string; reason: string | null }>(
          `/api/admin/orders/${orderId}/reconcile`,
          { method: 'POST' },
        ),
      { done: `Asked ${provider}` },
    );

  return (
    <div className="flex flex-col gap-2">
      {actions.includes('start_processing') && (
        <Button disabled={pending} onClick={() => void advance('processing', 'Marked as packing')}>
          Start packing
        </Button>
      )}
      {actions.includes('mark_shipped') && (
        <Button disabled={pending} onClick={() => void advance('shipped', 'Marked as shipped')}>
          Mark shipped
        </Button>
      )}
      {actions.includes('mark_delivered') && (
        <Button disabled={pending} onClick={() => void advance('delivered', 'Marked as delivered')}>
          Mark delivered
        </Button>
      )}
      {actions.includes('reconcile') && (
        <>
          <Button variant="outline" disabled={pending} onClick={() => void reconcile()}>
            Ask {provider} what happened
          </Button>
          <p className="text-xs text-[var(--ink-faint)]">
            If {provider} took the payment and its message to us was lost, this settles the order.
            If not, nothing changes.
          </p>
        </>
      )}

      {(actions.includes('cancel') || actions.includes('record_refund')) && (
        <div className="mt-2 flex flex-col gap-2 border-t border-[var(--rule)] pt-3">
          {actions.includes('cancel') && (
            <Button variant="danger" disabled={pending} onClick={() => setEnding('cancel')}>
              Cancel order
            </Button>
          )}
          {actions.includes('record_refund') && (
            <Button variant="outline" disabled={pending} onClick={() => setEnding('record_refund')}>
              Record a refund
            </Button>
          )}
        </div>
      )}

      <EndOrderDialog
        kind={ending}
        provider={provider}
        stockReserved={stockReserved}
        pending={pending}
        onClose={() => setEnding(null)}
        onConfirm={async (note) => {
          const kind = ending;
          setEnding(null);
          if (kind === 'cancel') {
            await run(
              () =>
                adminSend(`/api/admin/orders/${orderId}/cancel`, {
                  method: 'POST',
                  body: note ? { note } : {},
                }),
              { done: 'Order canceled', description: 'Its stock is back on the shelf.' },
            );
          } else if (kind === 'record_refund') {
            await run(
              () =>
                adminSend(`/api/admin/orders/${orderId}/refund`, {
                  method: 'POST',
                  body: { note },
                }),
              { done: 'Refund recorded' },
            );
          }
        }}
      />
    </div>
  );
}

function EndOrderDialog({
  kind,
  provider,
  stockReserved,
  pending,
  onClose,
  onConfirm,
}: {
  kind: 'cancel' | 'record_refund' | null;
  provider: string;
  stockReserved: boolean;
  pending: boolean;
  onClose: () => void;
  onConfirm: (note: string) => Promise<void>;
}) {
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const refund = kind === 'record_refund';

  return (
    <Dialog
      open={kind !== null}
      onOpenChange={(open) => {
        if (!open) {
          setNote('');
          setError(null);
          onClose();
        }
      }}
    >
      <DialogContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (refund && note.trim().length < 3) {
              setError('Say where the money was returned, so the record explains itself.');
              return;
            }
            void onConfirm(note.trim()).then(() => setNote(''));
          }}
        >
          <DialogHeader>
            <DialogTitle>{refund ? 'Record a refund' : 'Cancel this order'}</DialogTitle>
            <DialogDescription>
              {refund ? (
                <>
                  <strong className="font-medium text-[var(--ink)]">
                    This does not send any money back.
                  </strong>{' '}
                  Issue the refund in the {provider} dashboard first, then record it here.{' '}
                  {stockReserved
                    ? 'The stock held for this order goes back on the shelf.'
                    : 'The goods have already left, so no stock is put back — correct it on the product if they come back fit to sell.'}
                </>
              ) : (
                'No payment has been taken. The stock held for this order goes back on the shelf, and the order cannot be reopened.'
              )}
            </DialogDescription>
          </DialogHeader>

          <Field invalid={Boolean(error)} className="mt-5">
            <FieldLabel>{refund ? 'Where the money went' : 'Reason (optional)'}</FieldLabel>
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={500}
              placeholder={
                refund ? `Refunded in ${provider}, reference re_…` : 'Customer asked by phone'
              }
            />
            <FieldHint>Kept in the order’s history.</FieldHint>
            <FieldError>{error}</FieldError>
          </Field>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Keep the order
            </Button>
            <Button type="submit" variant={refund ? 'primary' : 'danger'} disabled={pending}>
              {refund ? 'Record refund' : 'Cancel order'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
