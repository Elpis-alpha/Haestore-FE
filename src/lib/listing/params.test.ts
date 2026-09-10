import { describe, expect, it } from 'vitest';
import {
  activeFilterCount,
  canonicalise,
  canonicalQuery,
  clearFilters,
  DEFAULT_PAGE_SIZE,
  formatRange,
  listingHref,
  maxReachablePage,
  parseListingParams,
  respell,
  parseRange,
  setFacetRange,
  setInStock,
  setPage,
  setPrice,
  setSort,
  toggleFacetValue,
  type RawSearchParams,
} from './params';

/**
 * The canonicaliser is the only thing standing between "one page" and "the same page
 * under six URLs". These are the properties the shop route's redirect depends on, so
 * they are asserted rather than assumed.
 */

describe('canonicalQuery', () => {
  it('drops every default, so the shop front page has no query string', () => {
    expect(canonicalise({})).toBe('');
    expect(canonicalise({ page: '1', per_page: '24', in_stock: 'false', sort: 'newest' })).toBe('');
  });

  it('keeps sort=newest on a search, where the default is relevance', () => {
    expect(canonicalise({ q: 'kettle', sort: 'newest' })).toBe('?q=kettle&sort=newest');
    expect(canonicalise({ q: 'kettle', sort: 'relevance' })).toBe('?q=kettle');
  });

  it('sorts keys, so a hand-written URL and a clicked one agree', () => {
    expect(canonicalise({ sort: 'price_asc', roast: 'dark', page: '2', in_stock: 'true' })).toBe(
      '?in_stock=true&page=2&roast=dark&sort=price_asc',
    );
  });

  /**
   * The property the whole file exists for. Ticking dark then medium and ticking medium
   * then dark are the same shop, so they must be the same URL — otherwise the CDN holds
   * two copies and a crawler indexes two pages of identical products.
   */
  it('produces one spelling however the filters were clicked', () => {
    const clickedOneWay: RawSearchParams = { roast: 'medium,dark', origin: 'peru,ethiopia' };
    const clickedTheOther: RawSearchParams = { origin: 'ethiopia,peru', roast: 'dark,medium' };
    const repeatedParams: RawSearchParams = {
      roast: ['dark', 'medium'],
      origin: ['peru', 'ethiopia'],
    };

    const expected = '?origin=ethiopia,peru&roast=dark,medium';
    expect(canonicalise(clickedOneWay)).toBe(expected);
    expect(canonicalise(clickedTheOther)).toBe(expected);
    expect(canonicalise(repeatedParams)).toBe(expected);
  });

  it('sorts numeric values as numbers, so a weight filter reads in order', () => {
    expect(canonicalise({ weight_g: '1000,250,500' })).toBe('?weight_g=250,500,1000');
  });

  it('de-duplicates a value repeated across both spellings', () => {
    expect(canonicalise({ roast: ['dark,medium', 'dark'] })).toBe('?roast=dark,medium');
  });

  it('writes the joining comma literally rather than percent-encoded', () => {
    expect(canonicalise({ roast: 'medium,dark' })).not.toContain('%2C');
  });

  /**
   * The shop route redirects anything non-canonical to its canonical form. If
   * canonicalising twice could change the answer, that redirect would bounce forever.
   */
  it('is idempotent, which is what keeps the route redirect from looping', () => {
    const inputs: RawSearchParams[] = [
      {},
      { roast: 'dark,medium', page: '3' },
      { q: '  two   words ', sort: 'rating', price: '4000-1500' },
      { weight_g: '250-', in_stock: 'true', per_page: '48' },
      { unknown_attribute: 'a,b', sort: 'nonsense', page: 'banana' },
    ];

    for (const input of inputs) {
      const once = canonicalise(input);
      const twice = canonicalQuery(parseListingParams(fromQueryString(once)));
      expect(twice).toBe(once);
    }
  });
});

/**
 * The middleware's redirect terminates only if re-spelling a canonical query returns that
 * same query. The first version compared against the request's own query string instead,
 * and NextURL's encoding disagreed with the canonical form's about the comma — so
 * `?roast=dark,light` was permanently redirected to `?roast=dark,light` and the browser
 * looped until it gave up. These are the properties that stop it coming back.
 */
describe('respell', () => {
  it('leaves a canonical query untouched, which is what makes the 308 terminate', () => {
    const canonicalForms = [
      '?roast=dark,light',
      '?roast=dark,light&sort=price_asc',
      '?in_stock=true&page=2&price=1500-4000&weight_g=250-1000',
      '?q=cast+iron',
      '',
    ];

    for (const query of canonicalForms) {
      const raw = fromQueryString(query);
      expect(canonicalQuery(parseListingParams(raw))).toBe(query);
      expect(respell(raw)).toBe(query);
    }
  });

  it('re-spells without reordering or dropping, so only encoding is compared', () => {
    // Order kept, page=1 kept: respell says how it was written, canonicalQuery says how
    // it should be. The middleware redirects on the difference between the two.
    expect(respell({ sort: 'price_asc', page: '1' })).toBe('?sort=price_asc&page=1');
  });

  it('writes a repeated parameter as it arrived, so it differs from the canonical form', () => {
    const raw = { roast: ['dark', 'light'] };
    expect(respell(raw)).toBe('?roast=dark&roast=light');
    expect(canonicalQuery(parseListingParams(raw))).toBe('?roast=dark,light');
  });
});

describe('parseListingParams', () => {
  it('repairs rather than rejects, because the URL may be an old bookmark', () => {
    const params = parseListingParams({ page: 'banana', sort: 'cheapest', per_page: '9999' });
    expect(params.page).toBe(1);
    expect(params.sort).toBeNull();
    expect(params.perPage).toBe(60);
  });

  it('carries an unknown attribute through untouched', () => {
    // The API answers with it in `ignoredFilters` and the storefront says which filters
    // no longer apply — which it can only do if the filter reaches the API.
    const params = parseListingParams({ retired_attribute: 'x' });
    expect(params.attributes.retired_attribute).toEqual(['x']);
  });

  it('treats only the canonical literal as in_stock being on', () => {
    expect(parseListingParams({ in_stock: 'true' }).inStock).toBe(true);
    expect(parseListingParams({ in_stock: '0' }).inStock).toBe(false);
    expect(parseListingParams({ in_stock: 'false' }).inStock).toBe(false);
  });

  it('collapses whitespace in a query and caps its length', () => {
    expect(parseListingParams({ q: '  cast   iron  ' }).q).toBe('cast iron');
    expect(parseListingParams({ q: 'x'.repeat(400) }).q).toHaveLength(200);
  });

  it('ignores a reserved name that would otherwise look like an attribute', () => {
    expect(parseListingParams({ view: 'grid' }).attributes).toEqual({});
  });
});

describe('parseRange', () => {
  it.each([
    ['250-1000', { min: 250, max: 1000 }],
    ['250-', { min: 250, max: null }],
    ['-1000', { min: null, max: 1000 }],
    ['250', { min: 250, max: 250 }],
    ['250..1000', { min: 250, max: 1000 }],
  ])('reads %s', (input, expected) => {
    expect(parseRange(input)).toEqual(expected);
  });

  it('swaps reversed bounds instead of returning nothing', () => {
    expect(parseRange('4000-1500')).toEqual({ min: 1500, max: 4000 });
  });

  it.each(['', 'cheap', '--', null, undefined])('rejects %s', (input) => {
    expect(parseRange(input)).toBeNull();
  });

  it('drops an empty range on the way back out', () => {
    expect(formatRange({ min: null, max: null })).toBeNull();
    expect(formatRange({ min: 250, max: null })).toBe('250-');
  });
});

describe('refinements', () => {
  const onPageSeven = parseListingParams({ page: '7', roast: 'dark' });

  /**
   * Page 7 of an unfiltered listing is rarely page 7 of a narrowed one, and a shopper
   * who lands on an empty page reads it as "no matches" rather than "wrong page".
   */
  it('returns to page one whenever the result set changes', () => {
    expect(toggleFacetValue(onPageSeven, 'roast', 'medium').page).toBe(1);
    expect(setPrice(onPageSeven, { min: 1000, max: null }).page).toBe(1);
    expect(setInStock(onPageSeven, true).page).toBe(1);
    expect(setFacetRange(onPageSeven, 'weight_g', { min: 250, max: 1000 }).page).toBe(1);
    expect(clearFilters(onPageSeven).page).toBe(1);
  });

  it('keeps the page when only the order changes', () => {
    expect(setSort(onPageSeven, 'price_asc').page).toBe(7);
  });

  it('unticking the last value removes the parameter rather than emptying it', () => {
    const off = toggleFacetValue(onPageSeven, 'roast', 'dark');
    expect(off.attributes.roast).toBeUndefined();
    expect(canonicalQuery(off)).toBe('');
  });

  it('keeps the query when filters are cleared', () => {
    const searched = parseListingParams({ q: 'kettle', roast: 'dark', in_stock: 'true' });
    const cleared = clearFilters(searched);
    expect(cleared.q).toBe('kettle');
    expect(canonicalQuery(cleared)).toBe('?q=kettle');
  });

  it('counts each control once, however many of its boxes are ticked', () => {
    const params = parseListingParams({
      roast: 'dark,medium,light',
      price: '1000-',
      in_stock: 'true',
    });
    expect(activeFilterCount(params)).toBe(3);
  });

  it('clamps a page past the depth either engine will serve', () => {
    expect(setPage(parseListingParams({}), 99999).page).toBe(1000);
    expect(setPage(parseListingParams({}), 0).page).toBe(1);
  });
});

describe('maxReachablePage', () => {
  /**
   * Meilisearch bounds depth at 1000 documents and the Mongo fallback honours the same
   * bound, so a pager must not offer a page the API refuses.
   */
  it('stops at the depth bound rather than at the reported page count', () => {
    expect(maxReachablePage(DEFAULT_PAGE_SIZE, 500)).toBe(41);
    expect(maxReachablePage(DEFAULT_PAGE_SIZE, 3)).toBe(3);
  });
});

describe('listingHref', () => {
  it('leaves a defaulted listing as a bare path', () => {
    expect(listingHref('/shop/coffee-tea', parseListingParams({}))).toBe('/shop/coffee-tea');
  });

  it('appends the canonical query', () => {
    expect(listingHref('/shop', parseListingParams({ roast: 'dark' }))).toBe('/shop?roast=dark');
  });
});

/** Reads a canonical query string back into the raw shape a Next page receives. */
function fromQueryString(query: string): RawSearchParams {
  const out: RawSearchParams = {};
  for (const [key, value] of new URLSearchParams(query)) out[key] = value;
  return out;
}
