import Image from 'next/image';
import Link from 'next/link';
import type { ListingCard } from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { Price } from '@/components/ui/price';
import { Rating } from '@/components/ui/rating';
import { Badge } from '@/components/ui/badge';
import { ArchFrame } from '@/components/motifs/arch';
import { Leaf } from '@/components/motifs/leaf';
import { SharedElement } from '@/components/motion/shared-element';

/**
 * One item on the shelf.
 *
 * The card is the paper label from the palette at its largest size — the same object as
 * the primary button and the `Tag`, which is why it takes no colour of its own. The
 * image sits in an arch because the arch is the shop doorway, and a product photographed
 * through one reads as goods on a shelf rather than as a tile in a grid.
 *
 * The whole card is one link with one accessible name. Two links to the same place (the
 * image and the title, as most card implementations end up) means every product is
 * announced twice and tabbed through twice.
 */
export function ProductCard({
  product,
  transitionName,
  priority,
  sizes = '(min-width: 1280px) 20rem, (min-width: 768px) 33vw, 50vw',
}: {
  product: ListingCard;
  /** Set only where this card is the one that grows into the product page. */
  transitionName?: string;
  /** Above the fold on first paint. Set on the first row only. */
  priority?: boolean;
  sizes?: string;
}) {
  const price = product.priceRange;
  const soldOut = !product.inStock;

  return (
    <article className="group relative flex flex-col gap-3">
      <SharedElement name={transitionName}>
        <ArchFrame
          className={cn(
            'relative aspect-[4/5] bg-[var(--groove)]',
            'transition-transform duration-300 ease-[var(--ease-out-soft)]',
            'group-hover:-translate-y-1',
            soldOut && 'opacity-70',
          )}
        >
          {product.image ? (
            <Image
              src={product.image.publicId}
              alt={product.image.alt}
              fill
              sizes={sizes}
              priority={priority}
              className="object-cover"
              {...(product.image.blurDataUrl
                ? { placeholder: 'blur' as const, blurDataURL: product.image.blurDataUrl }
                : {})}
            />
          ) : (
            /* No photograph yet. The mark stands in for it rather than a grey box with
               a camera icon, so an unphotographed product still looks like this shop's. */
            <span className="grid h-full place-items-center text-[var(--ink-faint)]">
              <Leaf aria-hidden className="size-10" />
            </span>
          )}

          {soldOut && (
            <span className="absolute inset-x-0 bottom-0 flex justify-center pb-3">
              <Badge tone="bad" className="bg-[var(--surface)]">
                Sold out
              </Badge>
            </span>
          )}
        </ArchFrame>
      </SharedElement>

      <div className="flex flex-col gap-1">
        <h3 className="font-display text-base leading-snug [--opsz:18] [--wght:600]">
          {/* The overlay is what makes the whole card clickable while keeping one link
              in the accessibility tree. */}
          <Link href={`/product/${product.slug}`} className="after:absolute after:inset-0">
            {product.title}
          </Link>
        </h3>

        {product.subtitle && (
          <p className="line-clamp-1 text-sm text-[var(--ink-muted)]">{product.subtitle}</p>
        )}

        <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          {price ? (
            <Price
              value={{ amount: price.min, currency: price.currency }}
              {...(price.max !== price.min
                ? { to: { amount: price.max, currency: price.currency } }
                : {})}
            />
          ) : (
            <span className="text-sm text-[var(--ink-faint)]">Price on request</span>
          )}

          {product.ratingCount > 0 && (
            <Rating value={product.ratingAverage} count={product.ratingCount} />
          )}
        </div>
      </div>
    </article>
  );
}
