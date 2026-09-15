import type { ListingCard } from '@/lib/api/types';
import { cn } from '@/lib/cn';
import { Skeleton } from '@/components/ui/skeleton';
import { productTransitionName } from '@/components/motion/shared-element';
import { ProductCard } from './product-card';

/**
 * The shelf.
 *
 * Two columns on a phone rather than one: a general store is a place you scan, and one
 * enormous card per screen turns browsing into paging. The gap widens with the viewport
 * because cards that are further apart need more air to stop reading as a table.
 */
export function ProductGrid({
  products,
  /**
   * Which cards grow into the product page. All of them on the shop; none in a related row,
   * which sits beside the hero it would collide with; and on a composed front page, the
   * slugs named — each product's first card there, since a layout may put one product in two
   * rows and a transition name must be unique on the page.
   */
  shared = true,
  className,
}: {
  products: ListingCard[];
  shared?: boolean | ReadonlySet<string>;
  className?: string;
}) {
  return (
    <ul
      className={cn(
        'grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 md:gap-x-7 xl:gap-x-8',
        className,
      )}
    >
      {products.map((product, index) => (
        <li key={product.id}>
          <ProductCard
            product={product}
            {...(shared === true || (shared !== false && shared.has(product.slug))
              ? { transitionName: productTransitionName(product.slug) }
              : {})}
            priority={index < 3}
          />
        </li>
      ))}
    </ul>
  );
}

/**
 * The shape of the grid before it has any products in it.
 *
 * Deliberately the same arch, the same aspect ratio and the same three lines of text, so
 * nothing moves when the real cards arrive. A skeleton that does not match its content is
 * a second layout shift wearing a costume.
 */
export function ProductGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <ul
      aria-hidden
      className="grid grid-cols-2 gap-x-5 gap-y-9 md:grid-cols-3 md:gap-x-7 xl:gap-x-8"
    >
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="flex flex-col gap-3">
          <Skeleton className="aspect-[4/5] rounded-t-[999px] rounded-b-md" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </li>
      ))}
    </ul>
  );
}
