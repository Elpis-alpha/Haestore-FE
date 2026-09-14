'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RadioGroup } from 'radix-ui';
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
import { Input, Textarea } from '@/components/ui/input';
import { fieldErrorsOf, RequestError } from '@/lib/api/send';
import { saveReview } from '@/lib/reviews/client';
import { cn } from '@/lib/cn';

/** The word for each star, shown beside the choice so a rating is a statement, not a shape. */
const WORDS = ['', 'Poor', 'Disappointing', 'Fine', 'Good', 'Excellent'] as const;

type Existing = { rating: number; title?: string; body?: string };

/**
 * Writing or rewriting a review.
 *
 * The rating is a radio group, because that is what it is: one choice from five. Radix gives
 * it roving focus and arrow keys, each star is labelled "4 stars" for a screen reader, and the
 * word beside the row says what the choice means. A rewrite of a hidden review is sent back to
 * the shop to read again — the dialog says so, rather than leaving the author to wonder why
 * their edit did not appear.
 */
export function ReviewDialog({
  productId,
  productTitle,
  authorName,
  existing,
  hidden = false,
  defaultOpen = false,
  triggerLabel,
  triggerVariant = 'primary',
}: {
  productId: string;
  productTitle: string;
  /** How the byline will read, so nobody is surprised by it after publishing. */
  authorName: string;
  existing?: Existing;
  hidden?: boolean;
  defaultOpen?: boolean;
  triggerLabel: string;
  triggerVariant?: 'primary' | 'outline' | 'link';
}) {
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);
  const [rating, setRating] = useState<number>(existing?.rating ?? 0);
  const [title, setTitle] = useState(existing?.title ?? '');
  const [body, setBody] = useState(existing?.body ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (rating < 1) {
      setErrors({ rating: 'Choose from one to five stars.' });
      return;
    }
    setSaving(true);
    setErrors({});
    setMessage(null);
    try {
      await saveReview(productId, {
        rating,
        ...(title.trim() ? { title: title.trim() } : {}),
        ...(body.trim() ? { body: body.trim() } : {}),
      });
      setOpen(false);
      // The page lists what is waiting and what is written, both read on the server.
      router.refresh();
    } catch (error) {
      setErrors(fieldErrorsOf(error));
      setMessage(error instanceof RequestError ? error.message : 'Your review could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant={triggerVariant}
        size="sm"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        {triggerLabel}
      </Button>

      <DialogContent>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {existing ? 'Edit your review' : 'Review'} {productTitle}
            </DialogTitle>
            <DialogDescription>
              Published as <span className="font-medium text-[var(--ink)]">{authorName}</span>, with
              the option you bought. Nothing else about you is shown.
              {hidden && ' The shop hid this review; saving it sends it back to be read again.'}
            </DialogDescription>
          </DialogHeader>

          <fieldset className="mt-6 flex flex-col gap-2">
            <legend className="text-sm font-medium text-[var(--ink)]">Your rating</legend>
            <div className="flex flex-wrap items-center gap-3">
              <RadioGroup.Root
                value={rating ? String(rating) : ''}
                onValueChange={(value) => {
                  setRating(Number(value));
                  setErrors((current) => ({ ...current, rating: '' }));
                }}
                orientation="horizontal"
                aria-invalid={Boolean(errors.rating) || undefined}
                className="flex gap-0.5"
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <RadioGroup.Item
                    key={star}
                    value={String(star)}
                    aria-label={`${star} ${star === 1 ? 'star' : 'stars'}, ${WORDS[star]!.toLowerCase()}`}
                    className="grid size-10 place-items-center rounded-sm text-[var(--ink)] transition-colors hover:bg-[var(--ink)]/8"
                  >
                    <Star filled={star <= rating} />
                  </RadioGroup.Item>
                ))}
              </RadioGroup.Root>
              <span aria-hidden className="text-sm text-[var(--ink-muted)]">
                {rating ? WORDS[rating] : 'Not chosen'}
              </span>
            </div>
            {errors.rating && (
              <p role="alert" className="text-xs font-medium text-[var(--bad)]">
                {errors.rating}
              </p>
            )}
          </fieldset>

          <Field invalid={Boolean(errors.title)} className="mt-5">
            <FieldLabel>Headline (optional)</FieldLabel>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
            />
            <FieldError>{errors.title}</FieldError>
          </Field>

          <Field invalid={Boolean(errors.body)} className="mt-4">
            <FieldLabel>Review (optional)</FieldLabel>
            <Textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              maxLength={4000}
              rows={5}
            />
            <FieldHint>What would you tell a friend who was about to buy it?</FieldHint>
            <FieldError>{errors.body}</FieldError>
          </Field>

          {message && (
            <p role="alert" className="mt-4 text-sm text-[var(--bad)]">
              {message}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : existing ? 'Save changes' : 'Publish review'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden className={cn('size-6', !filled && 'opacity-60')}>
      <path
        d="M8 1.6l1.9 4 4.3.6-3.1 3 .7 4.3L8 11.5l-3.8 2 .7-4.3-3.1-3 4.3-.6z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}
