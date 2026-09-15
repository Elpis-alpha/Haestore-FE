import Image from 'next/image';
import Link from 'next/link';
import type { components } from '@/lib/api/schema';
import { Button } from '@/components/ui/button';
import { ArchFrame } from '@/components/motifs/arch';
import { Leaf } from '@/components/motifs/leaf';
import { VineRule } from '@/components/motifs/rule';
import { ProductGrid } from '@/components/catalog/product-grid';
import { Doorway } from '@/components/site/doorway';

export type ResolvedSection = components['schemas']['ResolvedSection'];
type Shelf = Extract<ResolvedSection, { kind: 'shelves' }>['shelves'][number];

/**
 * The front page, drawn from a composed layout.
 *
 * One renderer serves the storefront and the composer's preview, so a preview cannot
 * disagree with the page it previews. It is the Phase 4 home page taken apart into the four
 * kinds of section the composer offers, with the same rules: one bold thing — the doorway —
 * and then quiet; and a section with nothing real to show is not rendered at all, rather
 * than rendering placeholder tiles.
 */
export function StorefrontSections({ sections }: { sections: ResolvedSection[] }) {
  const firstHero = sections.findIndex((s) => s.kind === 'hero');
  const hasGoods = sections.some(
    (s) =>
      (s.kind === 'shelves' && s.shelves.length > 0) ||
      (s.kind === 'product-row' && s.products.length > 0),
  );

  // A layout may show one product in two rows — the house espresso hand-picked and again in
  // the coffee row. Only its first card on the page carries the transition name, because two
  // elements claiming one name break the transition for both.
  const firstCards = new Map<string, ReadonlySet<string>>();
  const named = new Set<string>();
  for (const section of sections) {
    if (section.kind !== 'product-row') continue;
    const fresh = section.products.map((p) => p.slug).filter((slug) => !named.has(slug));
    for (const slug of fresh) named.add(slug);
    firstCards.set(section.id, new Set(fresh));
  }

  return (
    <>
      {sections.map((section, index) => {
        switch (section.kind) {
          case 'hero':
            return <HeroSection key={section.id} section={section} primary={index === firstHero} />;
          case 'shelves':
            return section.shelves.length > 0 ? (
              <ShelvesSection key={section.id} section={section} />
            ) : null;
          case 'product-row':
            return section.products.length > 0 ? (
              <ProductRowSection
                key={section.id}
                section={section}
                named={firstCards.get(section.id) ?? new Set()}
              />
            ) : null;
          case 'note':
            return <NoteSection key={section.id} section={section} />;
        }
      })}

      {!hasGoods && (
        <section className="mx-auto mt-10 max-w-md px-6 pb-10 text-center">
          <VineRule className="mb-6" />
          <p className="text-sm text-[var(--ink-muted)]">
            The shelves are empty at the moment. Run the seed, or add a category and a product in
            the admin console, and they will appear here.
          </p>
        </section>
      )}
    </>
  );
}

function HeroSection({
  section,
  primary,
}: {
  section: Extract<ResolvedSection, { kind: 'hero' }>;
  /** Only the first doorway is the page's h1. */
  primary: boolean;
}) {
  const Heading = primary ? 'h1' : 'h2';
  return (
    <section className="mx-auto max-w-7xl px-4 pt-10 pb-16 sm:px-6 sm:pt-16 lg:px-8">
      <Doorway className="mx-auto max-w-3xl px-6 pt-16 pb-12 text-center sm:px-12 sm:pt-24 sm:pb-16">
        <Heading className="wonk font-display text-4xl leading-[0.95] text-balance [--opsz:96] [--wght:600] sm:text-5xl lg:text-6xl">
          {section.heading}
        </Heading>

        {section.body && (
          <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-pretty text-[var(--ink-muted)]">
            {section.body}
          </p>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href={section.primary.href}>{section.primary.label}</Link>
          </Button>
          {section.secondary && (
            <Button asChild size="lg" variant="outline">
              <Link href={section.secondary.href}>{section.secondary.label}</Link>
            </Button>
          )}
        </div>
      </Doorway>
    </section>
  );
}

function SectionHeading({
  title,
  note,
  more,
}: {
  title: string;
  note?: string;
  more?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <VineRule />
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 className="font-display text-2xl [--opsz:36] [--wght:600]">{title}</h2>
        {note ? <p className="text-sm text-[var(--ink-faint)]">{note}</p> : more}
      </div>
    </div>
  );
}

function ShelvesSection({ section }: { section: Extract<ResolvedSection, { kind: 'shelves' }> }) {
  return (
    <section className="mx-auto mb-20 max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHeading title={section.title} note={section.note} />
      {/* Flex with a fixed basis rather than a column count: the shop decides how many
          shelves it has, and a grid-cols-6 would stretch three of them or crush eight. */}
      <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-8">
        {section.shelves.map((shelf) => (
          <li
            key={shelf.id}
            className="basis-[calc(50%-0.625rem)] sm:basis-[calc(33.333%-0.834rem)] lg:basis-44"
          >
            <ShelfCard shelf={shelf} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * A shelf, as a doorway you can see through — the same arch as the product card, because a
 * category and a product are the same kind of object here: a thing on a shelf.
 */
function ShelfCard({ shelf }: { shelf: Shelf }) {
  return (
    <article className="group relative flex flex-col gap-2.5">
      <ArchFrame className="relative aspect-[3/4] bg-[var(--groove)] transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:-translate-y-1">
        {shelf.imagePublicId ? (
          <Image
            src={shelf.imagePublicId}
            alt=""
            fill
            sizes="(min-width: 1024px) 12rem, (min-width: 768px) 25vw, 45vw"
            className="object-cover"
          />
        ) : (
          <span className="grid h-full place-items-center text-[var(--ink-faint)]">
            <Leaf aria-hidden className="size-8" />
          </span>
        )}
      </ArchFrame>
      <h3 className="font-display text-sm leading-snug [--wght:600]">
        <Link href={`/shop/${shelf.path}`} className="after:absolute after:inset-0">
          {shelf.name}
        </Link>
      </h3>
    </article>
  );
}

function ProductRowSection({
  section,
  named,
}: {
  section: Extract<ResolvedSection, { kind: 'product-row' }>;
  /** The products whose first card on the page is in this row. */
  named: ReadonlySet<string>;
}) {
  const more =
    section.source === 'newest'
      ? { href: '/shop?sort=newest', label: 'Everything in the shop' }
      : section.source === 'category' && section.category
        ? { href: `/shop/${section.category.path}`, label: `All of ${section.category.name}` }
        : null;

  return (
    <section className="mx-auto mb-20 max-w-7xl px-4 sm:px-6 lg:px-8">
      <SectionHeading title={section.title} note={section.note} />
      <ProductGrid products={section.products} shared={named} className="mt-8" />
      {more && (
        <div className="mt-10 flex justify-center">
          <Button asChild variant="outline">
            <Link href={more.href}>{more.label}</Link>
          </Button>
        </div>
      )}
    </section>
  );
}

function NoteSection({ section }: { section: Extract<ResolvedSection, { kind: 'note' }> }) {
  return (
    <section className="mx-auto mb-20 max-w-prose px-6 text-center">
      <VineRule className="mb-6" />
      {section.heading && (
        <h2 className="font-display text-xl [--opsz:24] [--wght:600]">{section.heading}</h2>
      )}
      <div className="mt-3 font-display text-base leading-relaxed text-[var(--ink-muted)] [--opsz:14] [--wght:400]">
        {section.body.split(/\n{2,}/).map((paragraph, index) => (
          <p key={index} className="mt-3 first:mt-0">
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  );
}
