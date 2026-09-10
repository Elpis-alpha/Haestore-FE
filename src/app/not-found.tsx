import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Arch } from '@/components/motifs/arch';

/**
 * A page that is not here.
 *
 * Says what happened and offers the way back in. No apology and no oversized "404" —
 * the number is for a log, not for a person standing at the wrong door.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-5 px-6 py-28 text-center">
      <Arch className="h-10 w-20 text-[var(--rule)]" />
      <h1 className="font-display text-3xl [--opsz:48] [--wght:600]">Nothing on this shelf</h1>
      <p className="text-sm text-[var(--ink-muted)]">
        The page you asked for is not here. It may have been a product we no longer stock, or a link
        that lost a character on the way.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/shop">Browse the shelves</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Back to the front</Link>
        </Button>
      </div>
    </main>
  );
}
