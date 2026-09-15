'use client';

import { useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { AdminError, adminSend } from '@/lib/admin/client';
import type { UploadedPhotograph, UploadTicket } from '@/lib/admin/types';
import { useConsole } from './console-provider';

/** Cloudinary's ceiling for an image on the shop's plan. Checked here so the refusal is instant. */
const MAX_BYTES = 10 * 1024 * 1024;

class UploadRefused extends Error {}

/**
 * Photographs, from the admin's computer to the product form.
 *
 * Three steps per file, and the order is the design. The API signs a ticket for the shop's
 * products folder; the browser sends the file straight to Cloudinary with it, so a
 * photograph never passes through the API; and the API reads the result back from
 * Cloudinary, so the width, height and placeholder stored with the product are Cloudinary's
 * account of the file rather than the browser's. Nothing is on the shelf until the product
 * is saved.
 */
export function PhotoUpload({
  onUploaded,
}: {
  onUploaded: (photograph: UploadedPhotograph) => void;
}) {
  const { notify } = useConsole();
  const input = useRef<HTMLInputElement>(null);
  const id = useId();
  const [pending, setPending] = useState<{ done: number; of: number } | null>(null);

  async function upload(files: File[]) {
    if (files.length === 0) return;
    let done = 0;
    setPending({ done, of: files.length });

    try {
      for (const file of files) {
        if (file.size > MAX_BYTES) {
          throw new UploadRefused(`${file.name} is over 10 MB. Export it smaller and try again.`);
        }

        const ticket = await adminSend<UploadTicket>('/api/admin/media/uploads', {
          method: 'POST',
        });

        const form = new FormData();
        form.append('file', file);
        form.append('api_key', ticket.apiKey);
        form.append('timestamp', String(ticket.timestamp));
        form.append('folder', ticket.folder);
        form.append('allowed_formats', ticket.allowedFormats);
        form.append('signature', ticket.signature);

        const response = await fetch(ticket.uploadUrl, { method: 'POST', body: form });
        const body = (await response.json().catch(() => null)) as {
          public_id?: string;
          error?: { message?: string };
        } | null;
        if (!response.ok || !body?.public_id) {
          throw new UploadRefused(
            body?.error?.message
              ? `Cloudinary refused ${file.name}: ${body.error.message}`
              : `Cloudinary refused ${file.name}. Try a JPEG, PNG, WebP or AVIF.`,
          );
        }

        onUploaded(
          await adminSend<UploadedPhotograph>('/api/admin/media/uploads/confirm', {
            method: 'POST',
            body: { publicId: body.public_id },
          }),
        );
        done += 1;
        setPending({ done, of: files.length });
      }

      notify({
        title: done === 1 ? 'Photograph uploaded' : `${done} photographs uploaded`,
        description: 'Describe each one, then save the product to put them on the shelf.',
        tone: 'good',
      });
    } catch (error) {
      notify({
        title:
          error instanceof AdminError || error instanceof UploadRefused
            ? error.message
            : 'The upload did not finish. Check your connection and try again.',
        ...(done > 0 ? { description: `${done} of ${files.length} made it before that.` } : {}),
        tone: 'bad',
      });
    } finally {
      setPending(null);
      if (input.current) input.current.value = '';
    }
  }

  return (
    <>
      <input
        ref={input}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(event) => void upload(Array.from(event.target.files ?? []))}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pending !== null}
        onClick={() => input.current?.click()}
      >
        {pending ? `Uploading ${pending.done + 1} of ${pending.of}…` : 'Upload photographs'}
      </Button>
    </>
  );
}
