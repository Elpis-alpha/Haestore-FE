'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { RequestError } from '@/lib/api/send';
import { deleteReview } from '@/lib/reviews/client';

/**
 * Taking your own review down. Asked once, because the words go with it — the product comes
 * back to "waiting for your review", but what was written does not.
 */
export function DeleteReview({
  productId,
  productTitle,
}: {
  productId: string;
  productTitle: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant="link" size="sm" className="text-xs" onClick={() => setOpen(true)}>
        Delete
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete your review of {productTitle}?</DialogTitle>
          <DialogDescription>
            It comes off the product page and out of its rating. You can write a new one later, but
            this one’s words are not kept.
          </DialogDescription>
        </DialogHeader>
        {error && (
          <p role="alert" className="mt-4 text-sm text-[var(--bad)]">
            {error}
          </p>
        )}
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Keep it
          </Button>
          <Button
            variant="danger"
            disabled={pending}
            onClick={() => {
              setPending(true);
              setError(null);
              void deleteReview(productId)
                .then(() => {
                  setOpen(false);
                  router.refresh();
                })
                .catch((err: unknown) =>
                  setError(err instanceof RequestError ? err.message : 'It could not be deleted.'),
                )
                .finally(() => setPending(false));
            }}
          >
            Delete review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
