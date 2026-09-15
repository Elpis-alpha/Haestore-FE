'use client';

import { cloudinaryUrl, isUnsplashUrl, unsplashUrl } from './source';

/**
 * Custom next/image loader.
 *
 * Cloudflare Workers cannot run Next's built-in image optimizer, so resizing is delegated to
 * whichever CDN already holds the photograph: Cloudinary for the shop's own, Unsplash's imgix
 * for the seed's hotlinked ones (ADR-015). See ./source.ts.
 *
 * Both beat the 2022 app, which re-encoded every product photo to PNG at `quality: 20` — a
 * lossless format, so the quality setting did almost nothing except make the files large.
 *
 * Local files in `public/` pass through untouched, and so does a public id on a storefront
 * with no Cloudinary cloud name, which renders as a broken image rather than a wrong one.
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

interface LoaderArgs {
  src: string;
  width: number;
  quality?: number;
}

export default function imageLoader({ src, width, quality }: LoaderArgs): string {
  if (src.startsWith('/')) return src;
  if (isUnsplashUrl(src)) return unsplashUrl(src, { width, ...(quality ? { quality } : {}) });
  if (!CLOUD_NAME) return src;
  return cloudinaryUrl(CLOUD_NAME, src, { width, ...(quality ? { quality } : {}) });
}
