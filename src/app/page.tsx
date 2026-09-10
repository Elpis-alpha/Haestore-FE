import Image from 'next/image';
import Link from 'next/link';
import type { Category } from '@/lib/api/types';
import { getCategories, getProducts, softly } from '@/lib/api/client';
import { topLevel } from '@/lib/catalog/tree';
import { Button } from '@/components/ui/button';
import { ArchFrame } from '@/components/motifs/arch';
import { Leaf } from '@/components/motifs/leaf';
import { VineRule } from '@/components/motifs/rule';
import { ProductGrid } from '@/components/catalog/product-grid';
import { Doorway } from '@/components/site/doorway';

/**
 * The front of the shop.
 *
 * One bold thing — the doorway you read the shop's name through — and then quiet: the
 * shelves, and what has just been put out. No carousel, no countdown, no autoplaying
 * anything. The 2022 app opened with a hero that fetched the entire product collection
 * to display four items.
 *
 * Every section here is real catalogue data or it is not rendered at all. A shop with no
 * categories yet says so plainly rather than showing six placeholder tiles.
 */

export const revalidate = 300;

export default async function HomePage() {
  // Read together rather than in sequence: two round trips one after the other is a
  // wholly avoidable second wait on the page a visitor sees first.
  const [categories, listing] = await Promise.all([
    softly(getCategories(), []),
    softly(
      getProducts(new URLSearchParams({ sort: 'newest', per_page: '6' }), {
        revalidate: 300,
        tags: ['products'],
      }),
      null,
    ),
  ]);

  const roots = topLevel(categories);
  const newest = listing?.data ?? [];

  return (
    <main>
      <section className="mx-auto max-w-7xl px-4 pt-10 pb-16 sm:px-6 sm:pt-16 lg:px-8">
        <Doorway className="mx-auto max-w-3xl px-6 pt-16 pb-12 text-center sm:px-12 sm:pt-24 sm:pb-16">
          <h1 className="wonk font-display text-4xl leading-[0.95] text-balance [--opsz:96] [--wght:600] sm:text-5xl lg:text-6xl">
            A general store, kept the old way
          </h1>

          <p className="mx-auto mt-6 max-w-md text-base leading-relaxed text-pretty text-[var(--ink-muted)]">
            Coffee and tea, ceramics, botanicals, textiles, pantry and hand tools. We keep a small
            range and know where each of it comes from.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/shop">Browse the shelves</Link>
            </Button>
            {roots[0] && (
              <Button asChild size="lg" variant="outline">
                <Link href={`/shop/${roots[0].path}`}>
                  Start with {roots[0].name.toLowerCase()}
                </Link>
              </Button>
            )}
          </div>
        </Doorway>
      </section>

      {roots.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading
            title="The shelves"
            note="Everything the shop stocks, in the order it was put out."
          />
          {/* Flex with a fixed basis rather than a column count: the shop decides how
              many shelves it has, and a `grid-cols-6` would stretch three of them across
              the page or crush eight of them. */}
          <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-8">
            {roots.map((root) => (
              <li
                key={root._id}
                className="basis-[calc(50%-0.625rem)] sm:basis-[calc(33.333%-0.834rem)] lg:basis-44"
              >
                <ShelfCard category={root} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {newest.length > 0 && (
        <section className="mx-auto mt-20 max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Just put out" note="The most recent things on the shelves." />
          <ProductGrid products={newest} className="mt-8" />
          <div className="mt-10 flex justify-center">
            <Button asChild variant="outline">
              <Link href="/shop?sort=newest">Everything in the shop</Link>
            </Button>
          </div>
        </section>
      )}

      {roots.length === 0 && newest.length === 0 && (
        <section className="mx-auto max-w-md px-6 pb-10 text-center">
          <VineRule className="mb-6" />
          <p className="text-sm text-[var(--ink-muted)]">
            The shelves are empty at the moment. Run the seed, or add a category and a product in
            the admin console, and they will appear here.
          </p>
        </section>
      )}
    </main>
  );
}

function SectionHeading({ title, note }: { title: string; note: string }) {
  return (
    <div className="flex flex-col gap-3">
      <VineRule />
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 className="font-display text-2xl [--opsz:36] [--wght:600]">{title}</h2>
        <p className="text-sm text-[var(--ink-faint)]">{note}</p>
      </div>
    </div>
  );
}

/**
 * A shelf, as a doorway you can see through.
 *
 * The same arch as the product card, at the same aspect ratio, because a category and a
 * product are the same kind of object in this shop — a thing on a shelf you can walk up
 * to. Giving categories their own visual language would be inventing a second grammar
 * for no gain.
 */
function ShelfCard({ category }: { category: Category }) {
  return (
    <article className="group relative flex flex-col gap-2.5">
      <ArchFrame className="relative aspect-[3/4] bg-[var(--groove)] transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:-translate-y-1">
        {category.imagePublicId ? (
          <Image
            src={category.imagePublicId}
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
        <Link href={`/shop/${category.path}`} className="after:absolute after:inset-0">
          {category.name}
        </Link>
      </h3>
    </article>
  );
}
