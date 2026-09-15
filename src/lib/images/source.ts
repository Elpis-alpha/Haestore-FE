/**
 * Where a photograph's bytes come from, from the storefront's side.
 *
 * The API stores one of two things in an image's `publicId` (ADR-015):
 *
 * - **A Cloudinary public id**, for the shop's own photographs — resized by a Cloudinary
 *   transformation URL.
 * - **A hotlinked Unsplash address**, for the seed's — resized by the imgix parameters
 *   Unsplash supports on its own CDN. Unsplash requires its images to be served from there,
 *   so a view is counted for the photographer, and asks that the `ixid` parameter it issued
 *   survives; setting parameters on the URL it gave us keeps it.
 *
 * Both paths end in a URL a browser fetches directly. Neither puts image work on the Worker.
 */

const UNSPLASH_HOST = 'images.unsplash.com';

export function isUnsplashUrl(src: string): boolean {
  try {
    const url = new URL(src);
    return url.protocol === 'https:' && url.hostname === UNSPLASH_HOST;
  } catch {
    return false;
  }
}

export type PhotographSize = { width: number; height?: number; quality?: number };

/**
 * An Unsplash photograph at a size. With a height it is cropped to fill; without one it is
 * scaled to the width and never enlarged past the original.
 */
export function unsplashUrl(src: string, size: PhotographSize): string {
  const url = new URL(src);
  url.searchParams.set('w', String(size.width));
  if (size.height) {
    url.searchParams.set('h', String(size.height));
    url.searchParams.set('fit', 'crop');
  } else {
    url.searchParams.set('fit', 'max');
  }
  url.searchParams.set('q', String(size.quality ?? 75));
  url.searchParams.set('auto', 'format');
  return url.toString();
}

/** A Cloudinary delivery URL. `f_auto` negotiates AVIF or WebP; `c_limit` never upscales. */
export function cloudinaryUrl(cloudName: string, publicId: string, size: PhotographSize): string {
  const transforms = [
    'f_auto',
    `q_${size.quality ?? 'auto'}`,
    `w_${size.width}`,
    ...(size.height ? [`h_${size.height}`, 'c_fill'] : ['c_limit']),
  ].join(',');
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transforms}/${publicId.replace(/^\/+/, '')}`;
}

/**
 * An absolute URL for a photograph at a size — for Open Graph and structured data, which
 * need a URL rather than a `next/image` — or null where none can be built, which is a
 * Cloudinary id on a storefront with no cloud name configured.
 */
export function photographUrl(
  src: string,
  size: PhotographSize,
  cloudName: string | undefined = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
): string | null {
  if (isUnsplashUrl(src)) return unsplashUrl(src, size);
  if (!cloudName) return null;
  return cloudinaryUrl(cloudName, src, size);
}
