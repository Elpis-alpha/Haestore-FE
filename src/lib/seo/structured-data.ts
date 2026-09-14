import { minorUnitExponent, type Money } from '../money';

/**
 * Structured data for search engines — the product, its offers, its rating and where it sits
 * in the shop — and the serialiser that makes it safe to put in a page.
 *
 * **The serialiser is the part that matters.** JSON-LD is inlined in a `<script>` element,
 * and `JSON.stringify` does not escape `<`. A product title, or a review somebody wrote,
 * containing `</script><script>…` would close the element and run whatever followed — on
 * the product page, for every visitor. React's escaping does not reach inside
 * `dangerouslySetInnerHTML`, which is the only way to emit the block. So every `<`, `>` and
 * `&` becomes a `\u` escape, which a JSON parser reads back as the same character and an HTML
 * parser never sees as markup.
 *
 * The builders take structural inputs rather than the generated API types, so they stay pure
 * and testable without a response to hand.
 */

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/** A decimal string in major units — "18.00", or "1800" for yen — as schema.org expects. */
export function decimalPrice(money: Money): string {
  const exponent = minorUnitExponent(money.currency);
  const negative = money.amount < 0;
  const digits = String(Math.abs(money.amount)).padStart(exponent + 1, '0');
  const whole = exponent === 0 ? digits : digits.slice(0, -exponent);
  const fraction = exponent === 0 ? '' : `.${digits.slice(-exponent)}`;
  return `${negative ? '-' : ''}${whole}${fraction}`;
}

type VariantInput = {
  sku: string;
  price: Money;
  status: 'active' | 'inactive';
  stock: { available: number; backorderable: boolean };
};

type ReviewInput = {
  rating: number;
  title?: string;
  body?: string;
  authorName: string;
  createdAt: string;
};

export type ProductStructuredDataInput = {
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  imageUrls: string[];
  variants: VariantInput[];
  ratingAverage: number;
  ratingCount: number;
  reviews?: ReviewInput[];
};

const SCHEMA = 'https://schema.org';

function availabilityOf(variants: VariantInput[]): string {
  if (variants.some((v) => v.stock.available > 0)) return `${SCHEMA}/InStock`;
  if (variants.some((v) => v.stock.backorderable)) return `${SCHEMA}/BackOrder`;
  return `${SCHEMA}/OutOfStock`;
}

/**
 * A `Product` with its offers, and its rating only where one exists.
 *
 * Only active variants are offered: an inactive $2 variant would otherwise become the
 * "from" price a search result shows, which is the same mistake the listing's `priceRange`
 * was built to avoid. One variant is an `Offer`; several are an `AggregateOffer` with the
 * range. `aggregateRating` is omitted rather than zero when nobody has reviewed the product,
 * because a rating of 0 from 0 reviews is a claim, and a false one.
 */
export function productStructuredData(input: ProductStructuredDataInput) {
  const sellable = input.variants.filter((v) => v.status === 'active');
  const currency = sellable[0]?.price.currency;
  const amounts = sellable.map((v) => v.price.amount);

  const offers =
    sellable.length === 0 || !currency
      ? undefined
      : sellable.length === 1
        ? {
            '@type': 'Offer',
            url: input.url,
            sku: sellable[0]!.sku,
            price: decimalPrice(sellable[0]!.price),
            priceCurrency: currency,
            availability: availabilityOf(sellable),
          }
        : {
            '@type': 'AggregateOffer',
            url: input.url,
            lowPrice: decimalPrice({ amount: Math.min(...amounts), currency }),
            highPrice: decimalPrice({ amount: Math.max(...amounts), currency }),
            priceCurrency: currency,
            offerCount: sellable.length,
            availability: availabilityOf(sellable),
          };

  const description = input.subtitle ?? input.description?.slice(0, 500);

  return {
    '@context': SCHEMA,
    '@type': 'Product',
    name: input.title,
    ...(description ? { description } : {}),
    url: input.url,
    ...(input.imageUrls.length > 0 ? { image: input.imageUrls } : {}),
    ...(sellable.length === 1 ? { sku: sellable[0]!.sku } : {}),
    ...(offers ? { offers } : {}),
    ...(input.ratingCount > 0
      ? {
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: input.ratingAverage,
            reviewCount: input.ratingCount,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    ...(input.reviews && input.reviews.length > 0
      ? {
          review: input.reviews.slice(0, 5).map((review) => ({
            '@type': 'Review',
            reviewRating: { '@type': 'Rating', ratingValue: review.rating, bestRating: 5 },
            author: { '@type': 'Person', name: review.authorName },
            datePublished: review.createdAt.slice(0, 10),
            ...(review.title ? { name: review.title } : {}),
            ...(review.body ? { reviewBody: review.body } : {}),
          })),
        }
      : {}),
  };
}

/** The trail from the shop down to the page, as a `BreadcrumbList`. */
export function breadcrumbStructuredData(items: { name: string; url: string }[]) {
  return {
    '@context': SCHEMA,
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
