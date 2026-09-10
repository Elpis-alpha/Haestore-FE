import { describe, expect, it } from 'vitest';
import { contrast } from './contrast';
import { readPalette, readSurfaces } from './parse-tokens';
import { palette as mirror } from './palette';

/**
 * The design system's contrast guarantees, as tests.
 *
 * DESIGN-SYSTEM.md makes claims about legibility. These assert them against the
 * bytes in globals.css, so a token nudged for aesthetic reasons cannot quietly
 * take the storefront below AA.
 *
 * Thresholds: 7 (AAA) for body ink, because a long product description on a dark
 * ground is exactly where AA is not enough; 4.5 (AA) for secondary text; 3 for
 * anything non-text that identifies a control — borders and focus rings —
 * per WCAG 1.4.11.
 */

const palette = readPalette();
const surfaces = readSurfaces();
const c = (name: string) => {
  const hex = palette[`--color-${name}`];
  if (!hex) throw new Error(`Unknown token --color-${name}`);
  return hex;
};

const ratio = (fg: string, bg: string) => Number(contrast(fg, bg).toFixed(2));

describe('the brand colours are exactly what the client specified', () => {
  it('keeps the given ground and ink untouched', () => {
    expect(palette['--color-bark-600']).toBe('#523523');
    expect(palette['--color-paper-50']).toBe('#fcf8f4');
  });
});

describe('every surface context is internally legible', () => {
  it.each(surfaces)('$name', ({ name, vars }) => {
    const bg = vars['--surface'];
    expect(bg, `.surface-${name} must declare --surface`).toBeDefined();

    // Body ink reaches AAA. This is the claim the whole palette rests on.
    expect(ratio(vars['--ink'], bg)).toBeGreaterThanOrEqual(7);

    // Secondary and tertiary text reach AA. --ink-faint is placeholder and
    // timestamp text; it is still text, so it does not get a decorative pass.
    expect(ratio(vars['--ink-muted'], bg)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(vars['--ink-faint'], bg)).toBeGreaterThanOrEqual(4.5);

    // A control's border and focus ring are the only things marking it as a
    // control, so both are held to 1.4.11.
    expect(ratio(vars['--edge'], bg)).toBeGreaterThanOrEqual(3);
    expect(ratio(vars['--focus'], bg)).toBeGreaterThanOrEqual(3);

    // An input's own well is a different background; ink has to survive there too.
    expect(ratio(vars['--ink'], vars['--field'])).toBeGreaterThanOrEqual(7);
    expect(ratio(vars['--ink-faint'], vars['--field'])).toBeGreaterThanOrEqual(4.5);
    expect(ratio(vars['--edge'], vars['--field'])).toBeGreaterThanOrEqual(3);
    expect(ratio(vars['--focus'], vars['--field'])).toBeGreaterThanOrEqual(3);

    // The dye slots. Each surface picks the tint of verdigris/madder/weld that
    // survives on it, which is why a Badge never has to know where it landed.
    expect(ratio(vars['--good'], bg)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(vars['--bad'], bg)).toBeGreaterThanOrEqual(4.5);
    expect(ratio(vars['--note'], bg)).toBeGreaterThanOrEqual(4.5);
  });

  // The claim Button makes: `bg-[var(--ink)] text-[var(--surface)]` is a correct
  // primary action on every surface, with no variant and no dark-mode branch.
  it.each(surfaces)('$name inverts the primary button correctly', ({ vars }) => {
    expect(ratio(vars['--surface'], vars['--ink'])).toBeGreaterThanOrEqual(7);
    // ...and stays legible in its hover state, where the fill dims to --ink-muted.
    expect(ratio(vars['--surface'], vars['--ink-muted'])).toBeGreaterThanOrEqual(4.5);
  });
});

describe('the dyes are legible wherever they are allowed to appear', () => {
  const dark = ['bark-600', 'bark-700', 'bark-900', 'bark-950'] as const;

  it.each(dark)('light dye text reads on %s', (ground) => {
    for (const dye of ['verdigris-200', 'madder-200', 'weld-200'] as const) {
      expect(ratio(c(dye), c(ground)), `${dye} on ${ground}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('deep dye ink reads on paper', () => {
    expect(ratio(c('verdigris-600'), c('paper-50'))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(c('madder-600'), c('paper-50'))).toBeGreaterThanOrEqual(4.5);
  });

  it('paper reads on the two filled dyes', () => {
    expect(ratio(c('paper-50'), c('verdigris-500'))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(c('paper-50'), c('madder-500'))).toBeGreaterThanOrEqual(4.5);
  });

  it('ink reads on a weld fill', () => {
    // Weld is the one dye with no ink role on paper: yellow cannot reach 4.5 on
    // cream without turning brown. It is a fill that carries dark text, a focus
    // ring, and "attention" text on dark grounds — nothing else. Ratings are ink
    // glyphs rather than gold stars for exactly this reason.
    expect(ratio(c('bark-950'), c('weld-300'))).toBeGreaterThanOrEqual(4.5);
    expect(ratio(c('weld-300'), c('paper-50'))).toBeLessThan(3);
  });
});

describe('a filled control is distinguishable from what it sits on', () => {
  // A dye fill on the chocolate ground is barely 2:1 at its edge, so filled
  // buttons carry a hairline of their own light tint. That hairline — not the
  // fill — is what the eye reads as the boundary, and it is what must pass.
  it('madder and verdigris hairlines separate their buttons from the ground', () => {
    expect(ratio(c('madder-300'), c('bark-600'))).toBeGreaterThanOrEqual(3);
    expect(ratio(c('verdigris-200'), c('bark-600'))).toBeGreaterThanOrEqual(3);
  });

  it('the paper button needs no hairline at all', () => {
    expect(ratio(c('paper-50'), c('bark-600'))).toBeGreaterThanOrEqual(3);
    expect(ratio(c('bark-950'), c('paper-50'))).toBeGreaterThanOrEqual(7);
  });
});

describe('the palette mirror cannot drift from the stylesheet', () => {
  // src/design/palette.ts exists only because a Worker cannot read globals.css off
  // disk at runtime. That makes it a copy, and copies rot — so this is the test
  // that stops it. Changing a hex in the CSS without regenerating the mirror fails
  // here, naming the token.
  it('lists exactly the tokens in globals.css, with the same values', () => {
    const fromCss = Object.fromEntries(
      Object.entries(palette).map(([k, v]) => [k.replace('--color-', ''), v]),
    );
    const fromMirror = Object.fromEntries(
      Object.entries(mirror).flatMap(([family, swatches]) =>
        swatches.map((s) => [`${family}-${s.step}`, s.hex]),
      ),
    );
    expect(fromMirror).toEqual(fromCss);
  });
});
