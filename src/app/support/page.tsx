import type { Metadata } from 'next';
import Link from 'next/link';
import { Arch } from '@/components/motifs/arch';
import { SlabRule } from '@/components/motifs/rule';
import { Button } from '@/components/ui/button';
import { Surface } from '@/components/ui/surface';

export const metadata: Metadata = {
  title: 'Help',
  description:
    'How to reach Hæstore about an order, something you bought, or your account — and where to look first.',
  alternates: { canonical: '/support' },
};

/**
 * How to reach the shop.
 *
 * Static, and deliberately so: it reads no session, so it is prerendered and indexable, and
 * "how do I contact them" is a question people ask a search engine. The way in goes through
 * the account area, whose middleware sends a signed-out visitor to sign in and brings them
 * back to the form.
 *
 * **There is no contact form here for signed-out visitors**, which is the decision in ADR-014.
 * This page has to carry that decision in plain words, or it reads as a shop hiding its door:
 * signing in is a code to an address, it makes the account if there is none, and it is what
 * lets a reply reach the person who wrote and a conversation arrive with its order attached.
 *
 * Everything under "Before you write" is true of how the shop actually works — no response
 * times and no policies the code does not enforce.
 */
export default function SupportPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
      <div className="flex flex-col gap-3">
        <Arch className="h-9 w-16 text-[var(--rule)]" />
        <h1 className="font-display text-4xl [--opsz:60] [--wght:600]">Help</h1>
        <p className="max-w-prose text-base leading-relaxed text-[var(--ink-muted)]">
          Write to us about an order, something you bought, or your account. A person reads every
          message and answers in the same place, so the whole conversation stays together.
        </p>
      </div>

      <Surface
        as="section"
        tone="paper"
        aria-labelledby="start-heading"
        className="mt-10 flex flex-col gap-4 rounded-md border border-[var(--edge)] p-6 sm:p-8"
      >
        <h2 id="start-heading" className="font-display text-xl [--opsz:24] [--wght:600]">
          Starting a conversation
        </h2>
        <p className="max-w-prose text-sm leading-relaxed text-[var(--ink-muted)]">
          Conversations are kept in your account. That is how we can see which orders are yours
          without asking you to prove it, and how our reply reaches an address we know you read.
          Signing in is a six-digit code sent to your email — there is no password, and if you have
          not shopped here before, the code makes your account.
        </p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <Button asChild>
            <Link href="/account/support/new">Start a conversation</Link>
          </Button>
          <Link href="/account/support" className="text-sm underline underline-offset-4">
            See the ones you have started
          </Link>
        </div>
      </Surface>

      <section aria-labelledby="before-heading" className="mt-14">
        <h2 id="before-heading" className="font-display text-2xl [--opsz:36] [--wght:600]">
          Before you write
        </h2>
        <SlabRule className="my-4" />
        <dl className="flex flex-col divide-y divide-[var(--rule)]">
          <Question title="Where is my order?">
            Every order has its own page in{' '}
            <Link href="/account/orders" className="underline underline-offset-4">
              your orders
            </Link>
            , with where it is up to — paid, being packed, on its way, delivered.
          </Question>
          <Question title="Something arrived damaged, or not what you ordered">
            Open the order and choose <q>Ask us about this order</q>. The conversation arrives with
            the order attached, so there is nothing for either of us to look up.
          </Question>
          <Question title="I checked out without an account">
            Sign in with the address you used at checkout. Orders placed with it are added to your
            account the moment your code is accepted.
          </Question>
          <Question title="I want to review something I bought">
            Once an order has been delivered, everything in it is waiting in{' '}
            <Link href="/account/reviews" className="underline underline-offset-4">
              your reviews
            </Link>
            . Reviews here only come from orders that reached the person writing them.
          </Question>
          <Question title="I can’t get a sign-in code">
            Codes come from our own address and expire after ten minutes. Check spam, wait a minute,
            and ask for another — a new code replaces the old one.
          </Question>
        </dl>
      </section>
    </main>
  );
}

function Question({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 py-4 first:pt-0">
      <dt className="font-medium text-[var(--ink)]">{title}</dt>
      <dd className="max-w-prose text-sm leading-relaxed text-[var(--ink-muted)]">{children}</dd>
    </div>
  );
}
