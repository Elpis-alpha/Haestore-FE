import { describe, expect, it } from 'vitest';
import {
  breadcrumbStructuredData,
  decimalPrice,
  productStructuredData,
  serializeJsonLd,
  type ProductStructuredDataInput,
} from './structured-data';

const variant = (amount: number, available = 5, overrides = {}) => ({
  sku: `SKU-${amount}`,
  price: { amount, currency: 'USD' },
  status: 'active' as const,
  stock: { available, backorderable: false },
  ...overrides,
});

const base: ProductStructuredDataInput = {
  title: 'Celadon bowl',
  url: 'https://haestore.test/product/celadon-bowl',
  imageUrls: [],
  variants: [variant(3400)],
  ratingAverage: 0,
  ratingCount: 0,
};

describe('serializeJsonLd', () => {
  it('cannot close the script element it is written into', () => {
    const hostile = { name: '</script><script>alert(1)</script>', note: 'a & b > c' };
    const text = serializeJsonLd(hostile);

    expect(text).not.toMatch(/<\/?script/i);
    expect(text).not.toContain('<');
    expect(text).not.toContain('>');
    expect(text).not.toContain('&');
    // …and still means exactly what it meant.
    expect(JSON.parse(text)).toEqual(hostile);
  });

  it('escapes the two line terminators JSON allows and JavaScript once did not', () => {
    const text = serializeJsonLd({ body: 'one\u2028two\u2029three' });
    expect(text).toContain('\\u2028');
    expect(text).toContain('\\u2029');
    expect(JSON.parse(text)).toEqual({ body: 'one\u2028two\u2029three' });
  });
});

describe('decimalPrice', () => {
  it('writes major units with the currency’s own number of places', () => {
    expect(decimalPrice({ amount: 1800, currency: 'USD' })).toBe('18.00');
    expect(decimalPrice({ amount: 5, currency: 'USD' })).toBe('0.05');
    expect(decimalPrice({ amount: 1800, currency: 'JPY' })).toBe('1800');
    expect(decimalPrice({ amount: 12345, currency: 'KWD' })).toBe('12.345');
  });
});

describe('productStructuredData', () => {
  it('offers a single variant as an Offer', () => {
    const data = productStructuredData(base);
    expect(data.offers).toEqual({
      '@type': 'Offer',
      url: base.url,
      sku: 'SKU-3400',
      price: '34.00',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    });
    expect(data.sku).toBe('SKU-3400');
  });

  it('offers several as a range, ignoring any variant not on sale', () => {
    const data = productStructuredData({
      ...base,
      variants: [variant(1800), variant(3200), variant(200, 5, { status: 'inactive' })],
    });
    expect(data.offers).toMatchObject({
      '@type': 'AggregateOffer',
      lowPrice: '18.00',
      highPrice: '32.00',
      offerCount: 2,
    });
  });

  it('says out of stock, or on back order, in schema.org’s words', () => {
    expect(productStructuredData({ ...base, variants: [variant(1800, 0)] }).offers).toMatchObject({
      availability: 'https://schema.org/OutOfStock',
    });
    expect(
      productStructuredData({
        ...base,
        variants: [variant(1800, 0, { stock: { available: 0, backorderable: true } })],
      }).offers,
    ).toMatchObject({ availability: 'https://schema.org/BackOrder' });
  });

  it('claims no rating for a product nobody has reviewed', () => {
    expect(productStructuredData(base)).not.toHaveProperty('aggregateRating');
    expect(productStructuredData(base)).not.toHaveProperty('review');
  });

  it('carries the rating and at most five reviews when there are some', () => {
    const reviews = Array.from({ length: 7 }, (_, i) => ({
      rating: 4,
      authorName: `Person ${i}`,
      createdAt: '2026-09-01T10:00:00.000Z',
      body: 'Good.',
    }));
    const data = productStructuredData({ ...base, ratingAverage: 4.33, ratingCount: 7, reviews });

    expect(data.aggregateRating).toEqual({
      '@type': 'AggregateRating',
      ratingValue: 4.33,
      reviewCount: 7,
      bestRating: 5,
      worstRating: 1,
    });
    expect(data.review).toHaveLength(5);
    expect(data.review?.[0]).toMatchObject({
      author: { '@type': 'Person', name: 'Person 0' },
      datePublished: '2026-09-01',
      reviewBody: 'Good.',
    });
  });

  it('offers nothing when nothing is on sale, rather than a price of nothing', () => {
    const data = productStructuredData({
      ...base,
      variants: [variant(1800, 5, { status: 'inactive' })],
    });
    expect(data).not.toHaveProperty('offers');
  });
});

describe('breadcrumbStructuredData', () => {
  it('numbers the trail from one', () => {
    const data = breadcrumbStructuredData([
      { name: 'Shop', url: 'https://haestore.test/shop' },
      { name: 'Ceramics', url: 'https://haestore.test/shop/ceramics' },
    ]);
    expect(data.itemListElement.map((item) => [item.position, item.name])).toEqual([
      [1, 'Shop'],
      [2, 'Ceramics'],
    ]);
  });
});
