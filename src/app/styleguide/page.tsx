import type { Metadata } from 'next';
import { Arch, ArchFrame } from '@/components/motifs/arch';
import { Leaf } from '@/components/motifs/leaf';
import { Mark } from '@/components/motifs/mark';
import { SlabRule, VineRule } from '@/components/motifs/rule';
import { Tag } from '@/components/motifs/tag';
import { Wordmark } from '@/components/motifs/wordmark';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Price } from '@/components/ui/price';
import { Rating } from '@/components/ui/rating';
import { Skeleton } from '@/components/ui/skeleton';
import { Surface, type SurfaceTone } from '@/components/ui/surface';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { contrast } from '@/design/contrast';
import { palette, token } from '@/design/palette';
import { ChoiceDemo, FilterDemo, FormDemo, OverlayDemo, QuantityDemo } from './demos';

export const metadata: Metadata = {
  title: 'Specimen sheet',
  description: 'Every part the Hæstore storefront is assembled from.',
  robots: { index: false, follow: false },
};

const GROUND = token('bark-600');
const PAPER = token('paper-50');

const SECTIONS = [
  ['colour', 'Colour'],
  ['surfaces', 'Surfaces'],
  ['type', 'Type'],
  ['motifs', 'Motifs'],
  ['controls', 'Controls'],
  ['assembled', 'Assembled'],
] as const;

export default function StyleguidePage() {
  return (
    <div className="min-h-screen">
      <Nav />

      <header className="mx-auto grid max-w-5xl gap-12 px-6 pt-20 pb-16 sm:pt-28 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          {/* The page's one uninvited animation: the handle draws, then the name
              arrives under it. Everything else here moves only when you touch it. */}
          <Arch className="h-14 w-28 animate-[draw-arch_1100ms_var(--ease-out-soft)_both] text-[var(--ink-muted)] [stroke-dasharray:240]" />
          <h1 className="wonk mt-6 font-display text-5xl leading-none [--opsz:96] [--wght:600] sm:text-6xl">
            <span className="inline-block animate-[rise-in_800ms_var(--ease-out-soft)_250ms_both]">
              Hæstore
            </span>
          </h1>
          <p className="mt-6 max-w-[52ch] text-lg text-[var(--ink-muted)]">
            Every part the storefront is assembled from, on the ground it will actually sit on.
            Chocolate underfoot, cream paper for anything you can act on, and colour held back until
            it has something to say.
          </p>
          <p className="mt-3 max-w-[52ch] text-sm text-[var(--ink-faint)]">
            The ratios printed on each swatch are measured rather than claimed: the same function
            computes them here and asserts them in <code className="font-sans">tokens.test.ts</code>
            .
          </p>
        </div>

        {/* The whole idea at the size a shelf label actually is: paper on wood, the
            tag with its punched hole, a slab rule, and the leaf meaning in stock. */}
        <Surface
          tone="paper"
          className="w-full max-w-xs animate-[rise-in_900ms_var(--ease-out-soft)_450ms_both] rounded-md p-5 shadow-[var(--shadow-lift)]"
        >
          <Tag>$18.00</Tag>
          <h2 className="mt-4 font-display text-2xl leading-tight [--opsz:32] [--wght:600]">
            Ethiopia, Yirgacheffe
          </h2>
          <p className="mt-1.5 text-sm text-[var(--ink-muted)]">
            Washed and dried on raised beds. Bergamot, white peach, sweet as it cools.
          </p>
          <SlabRule className="my-4" />
          <div className="flex items-center justify-between gap-3">
            <Badge tone="good">
              <Leaf />
              In stock
            </Badge>
            <Rating value={4.3} count={28} />
          </div>
        </Surface>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-32">
        <Colour />
        <Surfaces />
        <Typography />
        <Motifs />
        <Controls />
        <Assembled />
      </main>
    </div>
  );
}

function Nav() {
  return (
    <Surface
      as="nav"
      tone="raised"
      className="sticky top-0 z-30 border-b border-[var(--rule)]/60 backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-5xl items-center gap-6 px-6 py-3">
        <Wordmark markClassName="h-6 w-6" className="text-base" />
        <ul className="ml-auto hidden gap-5 text-sm text-[var(--ink-muted)] sm:flex">
          {SECTIONS.map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} className="transition-colors hover:text-[var(--ink)]">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </Surface>
  );
}

function Section({
  id,
  title,
  lede,
  children,
}: {
  id: string;
  title: string;
  lede: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 pt-16">
      <VineRule className="mb-10" />
      <h2 className="font-display text-3xl [--opsz:48] [--wght:600]">{title}</h2>
      <p className="mt-3 max-w-[62ch] text-[var(--ink-muted)]">{lede}</p>
      <div className="mt-8">{children}</div>
    </section>
  );
}

/* ---------------------------------------------------------------- colour -- */

function Colour() {
  return (
    <Section
      id="colour"
      title="Colour"
      lede="Two values were given: the chocolate ground and the cream ink. The bark and paper ramps are built from them, and the three dyes exist only to mean something — in stock, gone wrong, look here. There is no fourth accent, and no colour used for decoration."
    >
      <div className="flex flex-col gap-10">
        {Object.entries(palette).map(([family, swatches]) => (
          <div key={family}>
            <div className="flex items-baseline gap-3">
              <h3 className="font-display text-xl [--opsz:24] [--wght:600] capitalize">{family}</h3>
              <span className="text-sm text-[var(--ink-faint)]">{FAMILY_NOTES[family]}</span>
            </div>
            <SlabRule className="mt-2 mb-4" />
            <div className="overflow-x-auto">
              <table className="w-full max-w-3xl min-w-[34rem] border-collapse text-sm">
                <thead>
                  <tr className="text-left text-xs text-[var(--ink-faint)]">
                    <th className="w-16 pb-2 font-medium">&nbsp;</th>
                    <th className="pb-2 font-medium">Token</th>
                    <th className="pb-2 font-medium">Hex</th>
                    <th className="pb-2 text-right font-medium">On ground</th>
                    <th className="pb-2 text-right font-medium">On paper</th>
                  </tr>
                </thead>
                <tbody>
                  {swatches.map((s) => (
                    <SwatchRow key={s.step} name={`${family}-${s.step}`} hex={s.hex} />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

const FAMILY_NOTES: Record<string, string> = {
  bark: 'the wood the shop is built from',
  paper: 'the label tied to the goods',
  verdigris: 'scraped off copper. Says in stock, says done.',
  madder: 'root red. Says gone wrong, says on sale.',
  weld: 'the yellow dye. Says look here.',
};

function SwatchRow({ name, hex }: { name: string; hex: string }) {
  return (
    <tr className="border-t border-[var(--rule)]/50">
      <td className="py-2">
        <span
          className="block h-8 w-14 rounded-xs border border-[var(--edge)]"
          style={{ backgroundColor: hex }}
        />
      </td>
      <td className="py-2 font-medium">{name}</td>
      <td className="tabular py-2 text-[var(--ink-muted)] uppercase">{hex}</td>
      <td className="py-2 text-right">
        <Ratio fg={hex} bg={GROUND} />
      </td>
      <td className="py-2 text-right">
        <Ratio fg={hex} bg={PAPER} />
      </td>
    </tr>
  );
}

/**
 * A measured ratio with the grade it earns. The grade is the information; the
 * number alone would make a reader do WCAG arithmetic in their head.
 */
function Ratio({ fg, bg }: { fg: string; bg: string }) {
  const r = contrast(fg, bg);
  const grade = r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'UI' : '—';
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="tabular text-[var(--ink-muted)]">{r.toFixed(1)}</span>
      <span
        className={
          grade === '—'
            ? 'w-8 text-right text-xs text-[var(--ink-faint)]'
            : 'w-8 text-right text-xs text-[var(--good)]'
        }
      >
        {grade}
      </span>
    </span>
  );
}

/* -------------------------------------------------------------- surfaces -- */

const SURFACES: { tone: SurfaceTone; label: string; note: string }[] = [
  { tone: 'ground', label: 'Ground', note: 'the page itself' },
  { tone: 'raised', label: 'Raised', note: 'headers, nav, a card on the page' },
  { tone: 'well', label: 'Well', note: 'inputs, footers, anything sunk in' },
  { tone: 'paper', label: 'Paper', note: 'dialogs, drawers, menus, product cards' },
];

function Surfaces() {
  return (
    <Section
      id="surfaces"
      title="Surfaces"
      lede="The one structural idea here. A surface declares its own ink, edges, dyes and focus ring; a component reads them and never asks what it is sitting on. Below is the same markup four times — identical classes, no variant prop, no dark-mode branch."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {SURFACES.map(({ tone, label, note }) => (
          <Surface
            key={tone}
            tone={tone}
            className="flex flex-col gap-4 rounded-lg border border-[var(--rule)] p-5"
          >
            <div>
              <h3 className="font-display text-lg [--opsz:20] [--wght:600]">{label}</h3>
              <p className="text-sm text-[var(--ink-muted)]">{note}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm">Add to basket</Button>
              <Button size="sm" variant="outline">
                Save
              </Button>
              <Button size="sm" variant="ghost">
                Details
              </Button>
            </div>
            <input
              readOnly
              value="A field on this surface"
              className="h-9 w-full rounded-sm border border-[var(--edge)] bg-[var(--field)] px-3 text-sm text-[var(--ink)]"
            />
            <div className="flex flex-wrap gap-1.5">
              <Badge tone="good">
                <Leaf />
                In stock
              </Badge>
              <Badge tone="bad">Sold out</Badge>
              <Badge tone="note">Last few</Badge>
              <Badge tone="neutral">Whole bean</Badge>
            </div>
            <p className="text-xs text-[var(--ink-faint)]">
              {tone === 'paper'
                ? 'Focus a control here and the ring is ink: weld on cream measures 1.8:1, so this surface overrides it.'
                : 'Focus a control here and the ring is weld, which clears 3:1 on every dark ground.'}
            </p>
          </Surface>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ type -- */

const SCALE = [
  ['6xl', 'text-6xl', 'Hæstore'],
  ['4xl', 'text-4xl', 'Coffee & tea'],
  ['3xl', 'text-3xl', 'Ethiopia, Yirgacheffe'],
  ['2xl', 'text-2xl', 'Washed on raised beds'],
  ['xl', 'text-xl', 'Roasted the morning it ships'],
] as const;

function Typography() {
  return (
    <Section
      id="type"
      title="Type"
      lede="Fraunces cut for display, Karla for everything you operate. Fraunces is a variable face, so weight, softness and its wonk axis are routed through custom properties — which also stops font-variation-settings from silently resetting the weight, the trap that makes variable fonts look broken."
    >
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          {SCALE.map(([name, cls, sample]) => (
            <div
              key={name}
              className="flex items-baseline gap-5 border-b border-[var(--rule)]/50 pb-3"
            >
              <span className="tabular w-10 shrink-0 text-xs text-[var(--ink-faint)]">{name}</span>
              <span className={`font-display ${cls} truncate [--wght:600]`}>{sample}</span>
            </div>
          ))}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <h3 className="font-display text-lg [--opsz:20] [--wght:600]">Wonk, off and on</h3>
            <SlabRule className="mt-2 mb-3" />
            <p className="font-display text-4xl [--wght:600]">Gently wonky</p>
            <p className="wonk font-display text-4xl [--wght:600]">Gently wonky</p>
            <p className="mt-3 text-sm text-[var(--ink-muted)]">
              Fraunces&rsquo; alternates read as hand-cut at display sizes and as noise at sixteen
              pixels, so wonk is opt-in and belongs to the wordmark and page titles.
            </p>
          </div>
          <div>
            <h3 className="font-display text-lg [--opsz:20] [--wght:600]">Karla, running</h3>
            <SlabRule className="mt-2 mb-3" />
            <p className="max-w-[64ch] text-[var(--ink-muted)]">
              Grown at fourteen hundred metres and washed at the mill the same afternoon, this lot
              is the one we reach for when someone asks what coffee is supposed to taste like.
              Bergamot, white peach, and a finish that stays sweet as it cools.
            </p>
            <p className="mt-3 text-sm text-[var(--ink-faint)]">
              Body copy is held under 66 characters. Longer lines cost the reader the return sweep,
              and this is a shop, not a broadsheet.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* --------------------------------------------------------------- motifs -- */

function Motifs() {
  return (
    <Section
      id="motifs"
      title="Motifs"
      lede="Three shapes, all of them already in the logo: the slab that ends the H's stems, the vine and leaf that form its crossbar, and the thin arch of the bag handle over the top. Nothing else was invented."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MotifCard title="The mark" note="Cream on chocolate, as drawn.">
          <Mark className="h-20 w-20 text-[var(--ink)]" />
        </MotifCard>

        <MotifCard
          title="The arch"
          note="A stroke, never a filled dome — a filled one reads as a tombstone."
        >
          <Arch className="h-12 w-24 text-[var(--ink)]" />
        </MotifCard>

        <MotifCard title="The leaf" note="Means alive, growing, in stock. Not a bullet.">
          <Leaf className="h-12 w-12 text-[var(--good)]" />
        </MotifCard>

        <MotifCard title="Slab rule" note="The minor break: a hairline with the serif's end ticks.">
          <SlabRule className="w-full" />
        </MotifCard>

        <MotifCard title="Vine rule" note="The major break, between whole sections.">
          <VineRule className="w-full" />
        </MotifCard>

        <MotifCard
          title="The tag"
          note="Corner cut, hole punched. The hole shows the surface behind it."
        >
          <Tag>$18.00</Tag>
        </MotifCard>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-[var(--rule)] p-5">
          <h3 className="font-display text-lg [--opsz:20] [--wght:600]">The arch as a frame</h3>
          <p className="mt-1 mb-4 text-sm text-[var(--ink-muted)]">
            999px on the top corners clamps to half the width, so the arch stays a true half-round
            at any size instead of a radius re-guessed per breakpoint.
          </p>
          <div className="flex items-end gap-3">
            <ArchFrame className="h-32 w-24 bg-[var(--field)]" />
            <ArchFrame className="h-24 w-40 bg-[var(--field)]" />
          </div>
        </div>
        <div className="rounded-lg border border-[var(--rule)] p-5">
          <h3 className="font-display text-lg [--opsz:20] [--wght:600]">Grain</h3>
          <p className="mt-1 text-sm text-[var(--ink-muted)]">
            One fixed overlay across the whole document at 6% on overlay blend, portalled dialogs
            included — the texture belongs to the page, not to the boxes on it. It is already on:
            this paragraph is sitting under it.
          </p>
        </div>
      </div>
    </Section>
  );
}

function MotifCard({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-lg border border-[var(--rule)] p-5">
      <div className="flex min-h-24 items-center justify-center py-4">{children}</div>
      <h3 className="font-display text-base [--opsz:18] [--wght:600]">{title}</h3>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">{note}</p>
    </div>
  );
}

/* -------------------------------------------------------------- controls -- */

function Controls() {
  return (
    <Section
      id="controls"
      title="Controls"
      lede="Radix underneath for the parts that are genuinely hard — focus traps, typeahead, roving tabindex, swipe-to-dismiss — and styled from scratch on top, so none of it arrives looking like a template."
    >
      <div className="grid gap-8 lg:grid-cols-2">
        <Panel
          title="Buttons"
          note="Primary is the paper label. It inverts per surface on its own."
        >
          <div className="flex flex-wrap items-center gap-2">
            <Button>Add to basket</Button>
            <Button variant="outline">Save for later</Button>
            <Button variant="ghost">Details</Button>
            <Button variant="danger">Remove</Button>
            <Button variant="link">Size guide</Button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Sold out</Button>
          </div>
        </Panel>

        <Panel
          title="Quantity"
          note="The number is typable — a stepper alone makes fixing a mis-tap a nine-click job."
        >
          <QuantityDemo />
        </Panel>

        <Panel
          title="Fields"
          note="Label, hint, error and aria wiring are assembled, not remembered."
        >
          <FormDemo />
        </Panel>

        <div className="flex flex-col gap-8">
          <Panel
            title="Filters"
            note="What the generated facet panel is actually made of. Zero-count values disable rather than vanish, so the list stops reshuffling."
          >
            <FilterDemo />
          </Panel>
          <Panel
            title="Choices"
            note="A switch applies immediately; anything needing Save is a checkbox."
          >
            <ChoiceDemo />
          </Panel>
        </div>

        <Panel
          title="Overlays"
          note="All paper. The ground is the shop; paper is where you transact."
        >
          <OverlayDemo />
        </Panel>

        <Panel
          title="Tabs and disclosure"
          note="Both used by the product page — specification tables and filter groups."
        >
          <Tabs defaultValue="description">
            <TabsList>
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="detail">Detail</TabsTrigger>
              <TabsTrigger value="shipping">Shipping</TabsTrigger>
            </TabsList>
            <TabsContent value="description" className="text-sm text-[var(--ink-muted)]">
              Bergamot, white peach, and a finish that stays sweet as it cools.
            </TabsContent>
            <TabsContent value="detail">
              <Accordion type="single" collapsible defaultValue="origin">
                <AccordionItem value="origin">
                  <AccordionTrigger>Origin</AccordionTrigger>
                  <AccordionContent>
                    Yirgacheffe, Gedeo Zone, Ethiopia. 1,400–2,000 m.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="process">
                  <AccordionTrigger>Process</AccordionTrigger>
                  <AccordionContent>
                    Washed, then dried on raised beds for twelve days.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="roast">
                  <AccordionTrigger>Roast</AccordionTrigger>
                  <AccordionContent>Light. Roasted the morning it ships.</AccordionContent>
                </AccordionItem>
              </Accordion>
            </TabsContent>
            <TabsContent value="shipping" className="text-sm text-[var(--ink-muted)]">
              Two to four days within the country. Nothing sits in a warehouse.
            </TabsContent>
          </Tabs>
        </Panel>

        <Panel
          title="Waiting"
          note="The only motion nobody asked for, and it is the one thing that has to say 'still working'."
        >
          <div className="flex flex-col gap-2">
            <Skeleton className="h-40 w-full rounded-t-[999px] rounded-b-md" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </Panel>
      </div>
    </Section>
  );
}

function Panel({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-[var(--rule)] p-5">
      <h3 className="font-display text-lg [--opsz:20] [--wght:600]">{title}</h3>
      <p className="mt-1 mb-5 max-w-[52ch] text-sm text-[var(--ink-muted)]">{note}</p>
      {children}
    </div>
  );
}

/* ------------------------------------------------------------- assembled -- */

function Assembled() {
  return (
    <Section
      id="assembled"
      title="Assembled"
      lede="The parts put together as the thing they exist for. This is a product card and a price block — no new colours, no new shapes, nothing that is not above."
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <ProductCard />
        <Surface tone="paper" className="flex flex-col justify-center gap-4 rounded-lg p-6">
          <span className="font-display text-lg [--opsz:20] [--wght:600]">
            Stoneware tumbler, ash glaze
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <Price
              value={{ amount: 1800, currency: 'USD' }}
              compareAt={{ amount: 2200, currency: 'USD' }}
            />
            <Badge tone="sale">Save 18%</Badge>
          </div>
          <Price value={{ amount: 1800, currency: 'USD' }} to={{ amount: 3200, currency: 'USD' }} />
          <Rating value={4.3} count={28} />
          <SlabRule />
          <p className="text-sm text-[var(--ink-muted)]">
            Prices are tabular, so a column of them does not jitter as digits change. Ratings are
            ink rather than gold: a gold star on cream measures 1.8:1, which is decoration shaped
            like information.
          </p>
        </Surface>
        <Surface tone="paper" className="flex flex-col gap-3 rounded-lg p-6">
          <Leaf className="size-8 text-[var(--good)]" />
          <h3 className="font-display text-lg [--opsz:20] [--wght:600]">Nothing here yet</h3>
          <p className="text-sm text-[var(--ink-muted)]">
            The leaf is the empty-state mark. An empty screen is an invitation to act, so it says
            what to do next rather than apologising.
          </p>
          <Button variant="outline" size="sm" className="mt-1 self-start">
            Browse the shelves
          </Button>
        </Surface>
      </div>
    </Section>
  );
}

function ProductCard() {
  return (
    <Surface tone="paper" className="group flex flex-col overflow-hidden rounded-lg">
      <ArchFrame className="relative m-3 mb-0 h-56 bg-gradient-to-b from-bark-500 to-bark-800">
        <Mark className="absolute top-1/2 left-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 text-paper-50/15" />
      </ArchFrame>
      <div className="flex flex-col gap-2 p-4">
        <h3 className="font-display text-lg leading-tight [--opsz:20] [--wght:600]">
          Ethiopia, Yirgacheffe
        </h3>
        <p className="text-sm text-[var(--ink-muted)]">Bergamot and white peach</p>
        <Rating value={4.3} count={28} />
        <div className="mt-1 flex items-center justify-between gap-3">
          <Price
            value={{ amount: 1800, currency: 'USD' }}
            compareAt={{ amount: 2200, currency: 'USD' }}
          />
          <Badge tone="good">
            <Leaf />
            In stock
          </Badge>
        </div>
        <Button className="mt-2">Add to basket</Button>
      </div>
    </Surface>
  );
}
