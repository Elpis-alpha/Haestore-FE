/**
 * WCAG 2.1 relative luminance and contrast ratio.
 *
 * Small enough to own rather than depend on, and having it in the repo means the
 * ratios printed on the styleguide are produced by the same code that enforces
 * them in the test suite.
 */

function channel(value: number): number {
  const c = value / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  const n = Number.parseInt(hex.replace('#', ''), 16);
  if (Number.isNaN(n)) throw new Error(`Not a hex colour: ${hex}`);
  return (
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  );
}

export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
