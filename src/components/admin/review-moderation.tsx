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
import { useAdminAction } from './console-provider';

/**
 * What can be done to one review, which is decided by its state and nothing else.
 *
 * "Read" is one press and the common case. "Hide" asks for a reason first, and says who will
 * see it: the author does, on their own review page. That is the check on hiding — a note
 * written to the person whose words are being taken down is harder to write about a review
 * that is merely unkind than about one that is abusive.
 */
export function ReviewModeration({
  reviewId,
  status,
  needsReview,
  productTitle,
}: {
  reviewId: string;
  status: 'published' | 'hidden';
  needsReview: boolean;
  productTitle: string;
}) {
  const { run, pending } = useAdminAction();
  const [hiding, setHiding] = useState(false);

  const post = (action: 'keep' | 'restore' | 'hide', body?: object) =>
    adminSend(`/api/admin/reviews/${reviewId}/${action}`, {
      method: 'POST',
      ...(body ? { body } : {}),
    });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {needsReview && (
        <Button
          size="sm"
          disabled={pending}
          onClick={() => void run(() => post('keep'), { done: 'Marked as read' })}
        >
          {status === 'hidden' ? 'Read — keep hidden' : 'Read — leave it up'}
        </Button>
      )}
      {status === 'published' && (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => setHiding(true)}>
          Hide
        </Button>
      )}
      {status === 'hidden' && (
        <Button
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() =>
            void run(() => post('restore'), {
              done: 'Review restored',
              description: 'It is back on the product page and in the rating.',
            })
          }
        >
          Restore
        </Button>
      )}

      <HideDialog
        open={hiding}
        productTitle={productTitle}
        pending={pending}
        onClose={() => setHiding(false)}
        onConfirm={async (note) => {
          setHiding(false);
          await run(() => post('hide', { note }), {
            done: 'Review hidden',
            description: 'Its author can see why on their account.',
          });
        }}
      />
    </div>
  );
}

function HideDialog({
  open,
  productTitle,
  pending,
  onClose,
  onConfirm,
}: {
  open: boolean;
  productTitle: string;
  pending: boolean;
  onClose: () => void;
  onConfirm: (note: string) => Promise<void>;
}) {
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
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
            if (note.trim().length < 3) {
              setError('Say why. The person who wrote it will read this.');
              return;
            }
            void onConfirm(note.trim()).then(() => setNote(''));
          }}
        >
          <DialogHeader>
            <DialogTitle>Hide this review of {productTitle}</DialogTitle>
            <DialogDescription>
              It comes off the product page and out of the product’s rating straight away. Nothing
              is deleted, and it can be restored.
            </DialogDescription>
          </DialogHeader>

          <Field invalid={Boolean(error)} className="mt-5">
            <FieldLabel>Why it is hidden</FieldLabel>
            <Textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              maxLength={500}
              placeholder="It names another customer. Edit that out and we will read it again."
            />
            <FieldHint>
              Shown to the review’s author on their account. If they edit it, it comes back to this
              list.
            </FieldHint>
            <FieldError>{error}</FieldError>
          </Field>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Leave it up
            </Button>
            <Button type="submit" variant="danger" disabled={pending}>
              Hide review
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
