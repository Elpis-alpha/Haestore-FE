import Link from 'next/link';
import { Arch } from '@/components/motifs/arch';
import { Mark } from '@/components/motifs/mark';
import { SlabRule } from '@/components/motifs/rule';
import { Button } from '@/components/ui/button';

/**
 * A placeholder until Phase 4 builds the storefront home. It is built from the
 * design system rather than around it, so it stays honest about what exists.
 */
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 px-6 text-center">
      <Arch className="h-9 w-16 text-[var(--ink-muted)]" />
      <Mark className="h-16 w-16" />
      <h1 className="wonk font-display text-5xl leading-none [--opsz:96] [--wght:600]">Hæstore</h1>
      <p className="max-w-md text-balance text-lg text-[var(--ink-muted)]">
        An artisanal general store. Coffee and tea, ceramics, botanicals, textiles, pantry and hand
        tools.
      </p>
      <SlabRule className="my-2 max-w-xs" />
      <p className="text-sm text-[var(--ink-faint)]">
        The shelves are still being built. The design system they are being built from is finished.
      </p>
      <Button asChild variant="outline">
        <Link href="/styleguide">See the specimen sheet</Link>
      </Button>
    </main>
  );
}
