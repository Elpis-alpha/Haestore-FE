'use client';

/**
 * Custom next/image loader.
 *
 * Cloudflare Workers cannot run Next's built-in image optimizer, so transformation is
 * delegated to Cloudinary, which already stores the originals.
 *
 * `f_auto` negotiates AVIF/WebP from the Accept header and `q_auto` picks a quality
 * per image. Both beat the 2022 app, which re-encoded every product photo to PNG at
 * `quality: 20` — a lossless format, so the quality setting did almost nothing except
 * make the files large.
 *
 * Non-Cloudinary sources (local files in `public/`) pass through untouched.
 */

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

interface LoaderArgs {
  src: string;
  width: number;
  quality?: number;
}

export default function cloudinaryLoader({ src, width, quality }: LoaderArgs): string {
  if (src.startsWith('/') || !CLOUD_NAME) return src;

  const transforms = [
    'f_auto',
    `q_${quality ?? 'auto'}`,
    `w_${width}`,
    'c_limit', // never upscale past the original
  ].join(',');

  // `src` is a Cloudinary public id, e.g. "haestore/products/guji-natural-01".
  const publicId = src.replace(/^\/+/, '');
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transforms}/${publicId}`;
}
