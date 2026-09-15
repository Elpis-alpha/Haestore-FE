import { describe, expect, it } from 'vitest';
import imageLoader from './image-loader';
import { cloudinaryUrl, isUnsplashUrl, photographUrl, unsplashUrl } from './source';

const UNSPLASH =
  'https://images.unsplash.com/photo-1511920170033-f8396924c348?ixid=M3w2NTk2fDB8MXxzZWFyY2h8MXx8&ixlib=rb-4.1.0';

describe('isUnsplashUrl', () => {
  it('knows a hotlinked photograph from a public id', () => {
    expect(isUnsplashUrl(UNSPLASH)).toBe(true);
    expect(isUnsplashUrl('haestore/products/abc')).toBe(false);
    expect(isUnsplashUrl('http://images.unsplash.com/photo-1')).toBe(false);
    expect(isUnsplashUrl('https://images.unsplash.com.evil.test/photo-1')).toBe(false);
  });
});

describe('unsplashUrl', () => {
  it('resizes with imgix parameters and keeps the ixid Unsplash issued', () => {
    const url = new URL(unsplashUrl(UNSPLASH, { width: 640 }));
    expect(url.origin).toBe('https://images.unsplash.com');
    expect(url.searchParams.get('ixid')).toBe('M3w2NTk2fDB8MXxzZWFyY2h8MXx8');
    expect(url.searchParams.get('w')).toBe('640');
    expect(url.searchParams.get('fit')).toBe('max');
    expect(url.searchParams.get('auto')).toBe('format');
    expect(url.searchParams.get('q')).toBe('75');
  });

  it('crops to fill when given a height', () => {
    const url = new URL(unsplashUrl(UNSPLASH, { width: 1200, height: 630 }));
    expect(url.searchParams.get('h')).toBe('630');
    expect(url.searchParams.get('fit')).toBe('crop');
  });

  it('sets a parameter once, however many times it is resized', () => {
    const twice = unsplashUrl(unsplashUrl(UNSPLASH, { width: 640 }), { width: 320 });
    expect(new URL(twice).searchParams.getAll('w')).toEqual(['320']);
  });
});

describe('cloudinaryUrl', () => {
  it('limits by width, or fills a box', () => {
    expect(cloudinaryUrl('shop', 'haestore/products/x', { width: 800 })).toBe(
      'https://res.cloudinary.com/shop/image/upload/f_auto,q_auto,w_800,c_limit/haestore/products/x',
    );
    expect(cloudinaryUrl('shop', 'x', { width: 1200, height: 630 })).toContain(
      'w_1200,h_630,c_fill',
    );
  });
});

describe('photographUrl', () => {
  it('builds either kind, and nothing for a public id with no cloud to find it in', () => {
    expect(photographUrl(UNSPLASH, { width: 1600 }, undefined)).toContain('images.unsplash.com');
    expect(photographUrl('haestore/x', { width: 1600 }, 'shop')).toContain(
      'res.cloudinary.com/shop',
    );
    expect(photographUrl('haestore/x', { width: 1600 }, undefined)).toBeNull();
  });
});

describe('the next/image loader', () => {
  it('sends Unsplash photographs to Unsplash, at the width next/image asks for', () => {
    const url = new URL(imageLoader({ src: UNSPLASH, width: 384 }));
    expect(url.hostname).toBe('images.unsplash.com');
    expect(url.searchParams.get('w')).toBe('384');
  });

  it('leaves local files alone', () => {
    expect(imageLoader({ src: '/og/default.png', width: 640 })).toBe('/og/default.png');
  });
});
