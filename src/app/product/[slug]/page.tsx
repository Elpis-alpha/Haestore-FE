import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import type { Category, Product, ProductAttribute } from '@/lib/api/types';
import {
  ApiError,
  getCategories,
  getProduct,
  getProductReviews,
  getProducts,
  softly,
  type ReviewPage,
} from '@/lib/api/client';
import { breadcrumbFor } from '@/lib/catalog/tree';
import { photographUrl } from '@/lib/images/source';
import { absoluteUrl } from '@/lib/seo/site';
import {
  breadcrumbStructuredData,
  productStructuredData,
  serializeJsonLd,
} from '@/lib/seo/structured-data';
import { Button } from '@/components/ui/button';
import { SlabRule, VineRule } from '@/components/motifs/rule';
import { ProductGrid, ProductGridSkeleton } from '@/components/catalog/product-grid';
import { ProductView, type AxisLabels } from '@/components/catalog/product-view';
import { ProductReviews } from '@/components/reviews/product-reviews';

/**
 * One product.
 *
 * Served from MongoDB rather than the search index (ADR-003): the index holds a listing
 * projection, and this page needs the whole document — every variant, every attribute,
 * the description. It is also the only storefront page whose content is fixed per URL,
 * which is why it is the only one that caches.
 *
 * The specification table needs no attribute lookup at all. `displayValue` is rendered at
 * write time and the API returns the attributes already sorted into the category's own
 * group order, so what would classically be a `$lookup` per attribute is a single
 * document read.
 *
 * **There is deliberately no `loading.tsx` here, and there must not be one.** A
 * `loading.tsx` wraps the route in a Suspense boundary, which lets Next flush the shell —
 * and commit a 200 — before this component has decided whether the product exists. The
 * page still renders `not-found.tsx`, but under a 200: a soft 404, which is exactly what
 * a crawler is told not to trust. Verified by removing the file and watching
 * `/product/nope` go from 200 to 404.
 *
 * Streaming is not given up, only aimed: the Suspense boundary below sits *under* the
 * existence check, so the related-products query never delays first paint and never
 * touches the status.
 */

type PageProps = { params: Promise<{ slug: string }> };

export const revalidate = 60;

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await softly(getProduct(slug), null);
  if (!product) return { title: 'Not found' };

  const image = product.images[0];
  const card = image ? photographUrl(image.publicId, { width: 1200, height: 630 }) : null;

  return {
    title: product.title,
    description: product.subtitle ?? product.description?.slice(0, 160),
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      type: 'website',
      title: product.title,
      description: product.subtitle ?? product.description?.slice(0, 200),
      // The same Cloudinary transformation the page's own images use, at the size link
      // previews actually render, rather than shipping an original. A page's `openGraph`
      // replaces the layout's whole object, so a product with no photograph states the
      // shop's own card again rather than inheriting nothing.
      images: image && card ? [{ url: card, alt: image.alt }] : [DEFAULT_OG_IMAGE],
    },
  };
}

const DEFAULT_OG_IMAGE = {
  url: '/og/haestore.png',
  width: 1200,
  height: 630,
  alt: 'Hæstore — an artisanal general store',
};

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;

  const product = await getProduct(slug).catch((error: unknown) => {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  });
  if (!product) notFound();

  // The first page of reviews is part of this page's content, so it is read here rather than
  // streamed: it belongs in the HTML a crawler and a slow connection receive. Softly, because
  // a review read that fails is a product page with one section fewer, not an error page.
  const [categories, reviews] = await Promise.all([
    softly(getCategories(), []),
    softly(getProductReviews(product.slug), null),
  ]);
  const shelf = categories.find((c) => c._id === product.category);

  // Names and swatches for every axis come with the product since Phase 8. They were
  // recovered from the category's filter list before, which lost any axis that was not
  // also a filter — the one gap FRONTEND.md recorded.

  const axisLabels = buildAxisLabels(product.axes);
  const trail = shelf ? breadcrumbFor(categories, shelf.path) : [];
  const groups = groupAttributes(product.attributes);

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <StructuredData product={product} trail={trail} reviews={reviews} />
      <Breadcrumb trail={trail} title={product.title} />

      {/* Narrower than the page. The details column is a measure to read, not a space
          to fill: at full width a specification row set "Roast level ....... Medium"
          across 700px and stopped reading as a pair. */}
      <div className="mt-6 max-w-5xl">
        <ProductView
          product={product}
          axisLabels={axisLabels}
          specification={<Specification groups={groups} labels={axisLabels} />}
        />
      </div>

      {product.description && (
        <section className="mt-16 max-w-prose">
          <h2 className="font-display text-xl [--opsz:24] [--wght:600]">About this</h2>
          <SlabRule className="my-4" />
          {/* Serif body copy at a measure it can hold, with the looser leading the type
              scale already gives it. */}
          <div className="font-display text-base leading-relaxed text-[var(--ink-muted)] [--opsz:14] [--wght:400]">
            {product.description.split(/\n{2,}/).map((paragraph, index) => (
              <p key={index} className="mt-4 first:mt-0">
                {paragraph}
              </p>
            ))}
          </div>
        </section>
      )}

      {reviews && <ProductReviews slug={product.slug} reviews={reviews} labels={axisLabels} />}

      {shelf && (
        <section className="mt-20">
          <VineRule />
          <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2 className="font-display text-2xl [--opsz:36] [--wght:600]">
              More from {shelf.name}
            </h2>
            <Button asChild variant="link" size="sm">
              <Link href={`/shop/${shelf.path}`}>See the whole shelf</Link>
            </Button>
          </div>
          <Suspense fallback={<ProductGridSkeleton count={3} />}>
            <MoreFromShelf shelfPath={shelf.path} exclude={product.slug} />
          </Suspense>
        </section>
      )}
    </main>
  );
}

/**
 * What it is, in the admin's own words.
 *
 * No attribute lookup: `displayValue` is rendered at write time and the API returns the
 * attributes already sorted into the category's group order, so this walks a list.
 */
function Specification({ groups, labels }: { groups: AttributeGroup[]; labels: AxisLabels }) {
  if (groups.length === 0) return null;

  return (
    <section className="mt-2">
      <h2 className="font-display text-base [--opsz:18] [--wght:600]">Specification</h2>
      <SlabRule className="my-3" />
      <div className="flex flex-col gap-5">
        {groups.map(({ group, attributes }) => (
          <div key={group ?? '__ungrouped__'}>
            {group && <h3 className="mb-1.5 text-xs text-[var(--ink-faint)]">{group}</h3>}
            <dl className="flex flex-col">
              {attributes.map((attribute) => (
                <div
                  key={attribute.key}
                  className="flex justify-between gap-6 border-b border-[var(--rule)] py-2 text-sm last:border-b-0"
                >
                  {/* The definition's label, returned with the product. The slug, tidied, only
                      for a value whose attribute no longer applies to this category. */}
                  <dt className="text-[var(--ink-muted)]">
                    {attribute.label ?? labels[attribute.key]?.label ?? prettify(attribute.key)}
                  </dt>
                  {/* No unit appended: `displayValue` is rendered at write time and
                      already reads "500 g". Adding `unit` again printed "500 g g". */}
                  <dd className="text-right text-[var(--ink)]">{attribute.displayValue}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * A second shelf's worth of products, streamed in after the page.
 *
 * Its own component so it can suspend on its own: nobody scrolls past the specification
 * table before this resolves, so it has no business holding up the photograph and the
 * price. Read with `softly` — a related row that fails is a page with one section fewer.
 */
async function MoreFromShelf({ shelfPath, exclude }: { shelfPath: string; exclude: string }) {
  const related = await softly(
    getProducts(new URLSearchParams({ category: shelfPath, per_page: '6' })),
    null,
  );
  const siblings = (related?.data ?? []).filter((p) => p.slug !== exclude).slice(0, 3);
  if (siblings.length === 0) return null;

  /*
    `shared` is off here. These cards are on the same page as the hero image, and two
    elements claiming one view-transition name is a broken transition rather than a
    nicer one.
  */
  return <ProductGrid products={siblings} shared={false} className="mt-8" />;
}

/**
 * Axis value names and swatches, keyed for the picker.
 *
 * A variant's `axisValues` carry the admin's raw slugs — `whole-bean`, not "Whole bean" —
 * because the grid is built from values, not labels. The product response carries each
 * axis with its options' labels and swatches, so every axis is named whether or not it is
 * also a filter. `ProductView` still prettifies a slug with no entry, which now only happens
 * for an axis whose attribute has since been unbound from the category.
 */
function buildAxisLabels(
  filters: {
    key: string;
    label: string;
    options: { value: string; label: string; swatchHex?: string }[];
  }[],
): AxisLabels {
  const labels: AxisLabels = {};
  for (const filter of filters) {
    labels[filter.key] = {
      label: filter.label,
      values: Object.fromEntries(
        filter.options.map((option) => [
          option.value,
          { label: option.label, ...(option.swatchHex ? { swatchHex: option.swatchHex } : {}) },
        ]),
      ),
    };
  }
  return labels;
}

/**
 * Keeps the API's ordering and only breaks it into headings.
 *
 * The attributes arrive sorted into the category's own group order, so this walks them
 * once and starts a new section whenever the group changes — rather than bucketing by
 * group name, which would silently re-order the table to whatever `Object.keys` felt
 * like.
 */
type AttributeGroup = { group?: string; attributes: ProductAttribute[] };

function groupAttributes(attributes: ProductAttribute[]): AttributeGroup[] {
  const groups: AttributeGroup[] = [];
  for (const attribute of attributes) {
    const last = groups[groups.length - 1];
    if (last && last.group === attribute.group) last.attributes.push(attribute);
    else
      groups.push({
        ...(attribute.group ? { group: attribute.group } : {}),
        attributes: [attribute],
      });
  }
  return groups;
}

function Breadcrumb({ trail, title }: { trail: Category[]; title: string }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--ink-faint)]">
        <li>
          <Link href="/shop" className="transition-colors hover:text-[var(--ink)]">
            Shop
          </Link>
        </li>
        {trail.map((entry) => (
          <li key={entry._id} className="flex items-center gap-2">
            <span aria-hidden>/</span>
            <Link
              href={`/shop/${entry.path}`}
              className="transition-colors hover:text-[var(--ink)]"
            >
              {entry.name}
            </Link>
          </li>
        ))}
        <li className="flex items-center gap-2">
          <span aria-hidden>/</span>
          <span aria-current="page" className="text-[var(--ink-muted)]">
            {title}
          </span>
        </li>
      </ol>
    </nav>
  );
}

function prettify(value: string): string {
  const spaced = value.replace(/[-_]+/g, ' ').trim();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/**
 * The product, its offers, its rating and its place in the shop, for search engines.
 *
 * Emitted through `serializeJsonLd`, never `JSON.stringify` directly: the block holds a
 * product title and the text of reviews strangers wrote, and a `</script>` in either would
 * otherwise end the element and run whatever came after it. See lib/seo/structured-data.ts.
 */
function StructuredData({
  product,
  trail,
  reviews,
}: {
  product: Product;
  trail: Category[];
  reviews: ReviewPage | null;
}) {
  const url = absoluteUrl(`/product/${product.slug}`);
  const data = [
    productStructuredData({
      title: product.title,
      ...(product.subtitle ? { subtitle: product.subtitle } : {}),
      ...(product.description ? { description: product.description } : {}),
      url,
      imageUrls: product.images.flatMap((image) => {
        const src = photographUrl(image.publicId, { width: 1600 });
        return src ? [src] : [];
      }),
      variants: product.variants,
      ratingAverage: product.ratingAverage,
      ratingCount: product.ratingCount,
      reviews: reviews?.data ?? [],
    }),
    breadcrumbStructuredData([
      { name: 'Shop', url: absoluteUrl('/shop') },
      ...trail.map((entry) => ({ name: entry.name, url: absoluteUrl(`/shop/${entry.path}`) })),
      { name: product.title, url },
    ]),
  ];

  return (
    <script
      type="application/ld+json"
      // Safe because of the serialiser, which escapes every character that could end the
      // element; the content is data, never markup.
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
