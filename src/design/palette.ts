/**
 * A runtime-safe mirror of the colour tokens in globals.css.
 *
 * globals.css is the source of truth — Tailwind v4 needs `@theme` to be statically
 * present, so it cannot be generated from here. But the styleguide has to print
 * each swatch's real hex and its measured contrast, and reading the CSS off disk is
 * not available on a Worker. So: mirror the values, and let tokens.test.ts fail the
 * build the moment the two disagree.
 */

export type Swatch = { readonly step: string; readonly hex: string };

export const palette = {
  bark: [
    { step: '950', hex: '#17100a' },
    { step: '900', hex: '#21160e' },
    { step: '800', hex: '#2c1d13' },
    { step: '700', hex: '#3d2718' },
    { step: '600', hex: '#523523' },
    { step: '500', hex: '#66452f' },
    { step: '400', hex: '#7e5b41' },
    { step: '300', hex: '#a8845f' },
  ],
  paper: [
    { step: '50', hex: '#fcf8f4' },
    { step: '100', hex: '#f6efe5' },
    { step: '200', hex: '#eadfce' },
    { step: '300', hex: '#d9c8b0' },
    { step: '400', hex: '#bea88c' },
  ],
  verdigris: [
    { step: '200', hex: '#b7d3be' },
    { step: '500', hex: '#4e7a66' },
    { step: '600', hex: '#3b6151' },
  ],
  madder: [
    { step: '200', hex: '#f0b4a6' },
    { step: '300', hex: '#e59481' },
    { step: '500', hex: '#b2452f' },
    { step: '600', hex: '#8e3624' },
  ],
  weld: [
    { step: '200', hex: '#f0ce8c' },
    { step: '300', hex: '#e5b65c' },
  ],
} as const satisfies Record<string, readonly Swatch[]>;

export type Family = keyof typeof palette;

/** `token('bark-600')` -> '#523523'. Throws on a name that is not in the CSS. */
const flat: Record<string, string> = Object.fromEntries(
  Object.entries(palette).flatMap(([family, swatches]) =>
    swatches.map((s) => [`${family}-${s.step}`, s.hex]),
  ),
);

export function token(name: string): string {
  const hex = flat[name];
  if (!hex) throw new Error(`Unknown colour token: ${name}`);
  return hex;
}
