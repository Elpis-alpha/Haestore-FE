import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Reads the design tokens back out of globals.css.
 *
 * The alternative was to declare the palette in TypeScript and generate the CSS,
 * but Tailwind v4 needs `@theme` to be statically present, so the CSS would stay
 * the real source of truth and the TypeScript would be a copy that drifts. Parsing
 * in the other direction means the tests assert against the exact bytes the browser
 * is served.
 */

/**
 * The surface contract. Every `.surface-*` rule must declare all of these, and
 * parsing fails loudly if one is missing — which is what catches a new surface
 * added without, say, a --focus colour, months after anyone remembers the rule.
 */
export const CONTRACT = [
  '--surface',
  '--ink',
  '--ink-muted',
  '--ink-faint',
  '--edge',
  '--rule',
  '--groove',
  '--field',
  '--focus',
  '--good',
  '--bad',
  '--note',
] as const;

export type ContractVar = (typeof CONTRACT)[number];

export type Surface = {
  name: string;
  vars: Record<ContractVar, string>;
};

const CSS_PATH = join(process.cwd(), 'src/app/globals.css');

export function readCss(): string {
  return readFileSync(CSS_PATH, 'utf8');
}

/** Every `--color-*: #hex` inside the @theme block. */
export function readPalette(css: string = readCss()): Record<string, string> {
  const theme = /@theme\s*\{([\s\S]*?)\n\}/.exec(css);
  if (!theme?.[1]) throw new Error('No @theme block found in globals.css');

  const palette: Record<string, string> = {};
  for (const match of theme[1].matchAll(/(--color-[\w-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
    const [, name, hex] = match;
    if (name && hex) palette[name] = hex.toLowerCase();
  }
  if (Object.keys(palette).length === 0) throw new Error('No --color-* tokens found');
  return palette;
}

/** Every `.surface-*` rule, with `var(--color-x)` references resolved to hex. */
export function readSurfaces(css: string = readCss()): Surface[] {
  const palette = readPalette(css);
  const surfaces: Surface[] = [];

  for (const rule of css.matchAll(/([^{}]*\.surface-[\w-]+)\s*\{([^{}]*)\}/g)) {
    const [, selector, body] = rule;
    const name = selector && /\.surface-([\w-]+)/.exec(selector)?.[1];
    if (!name || !body) continue;

    const declared: Record<string, string> = {};
    for (const decl of body.matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
      const [, key, raw] = decl;
      if (!key || !raw) continue;
      const value = raw.trim();
      const ref = /^var\((--color-[\w-]+)\)$/.exec(value);
      const hex = ref?.[1]
        ? palette[ref[1]]
        : /^#[0-9a-fA-F]{3,8}$/.test(value)
          ? value
          : undefined;
      if (hex) declared[key] = hex.toLowerCase();
    }

    // A rule that sets no contract variables at all is a layout rule that happens
    // to mention .surface-*, not a surface definition. Skip it.
    if (!CONTRACT.some((key) => key in declared)) continue;

    const missing = CONTRACT.filter((key) => !(key in declared));
    if (missing.length > 0) {
      throw new Error(`.surface-${name} is missing ${missing.join(', ')}`);
    }

    const vars = Object.fromEntries(
      CONTRACT.map((key) => [key, declared[key] as string]),
    ) as Record<ContractVar, string>;

    surfaces.push({ name, vars });
  }

  if (surfaces.length === 0) throw new Error('No .surface-* blocks found');
  return surfaces;
}
