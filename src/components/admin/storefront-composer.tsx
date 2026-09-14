'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Field, FieldError, FieldHint, FieldLabel } from '@/components/ui/field';
import { Input, Textarea } from '@/components/ui/input';
import { CheckRow, RadioRow, RadioSet } from '@/components/ui/choice';
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SlabRule } from '@/components/motifs/rule';
import { adminSend, fieldErrors } from '@/lib/admin/client';
import { formatDateTime } from '@/lib/admin/format';
import {
  SECTION_KINDS,
  describeSection,
  isDirty,
  kindLabel,
  moveItem,
  newSection,
} from '@/lib/admin/storefront';
import type { StorefrontLayout, StorefrontSection, StorefrontState } from '@/lib/admin/types';
import { refreshFrontPage } from '@/app/admin/storefront/actions';
import { cn } from '@/lib/cn';
import { Sheet } from './ledger';
import { useAdminAction } from './console-provider';

type Picker = { id: string; name: string; depth: number };
type ProductPicker = { id: string; title: string };

export function StorefrontComposer({
  state,
  categories,
  products,
}: {
  state: StorefrontState;
  categories: Picker[];
  products: ProductPicker[];
}) {
  const router = useRouter();
  const { run, pending } = useAdminAction();
  const draft = state.draft;

  const [sections, setSections] = useState<StorefrontSection[]>(draft?.sections ?? []);
  const [note, setNote] = useState(draft?.note ?? '');
  const [open, setOpen] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dirty = draft
    ? isDirty({ sections: draft.sections, note: draft.note }, { sections, note })
    : false;

  async function save(): Promise<StorefrontLayout | null> {
    if (!draft) return null;
    setErrors({});
    const result = await run(
      () =>
        adminSend<StorefrontLayout>('/api/admin/storefront/home/draft', {
          method: 'PUT',
          body: { sections, note, revision: draft.revision },
        }),
      {
        done: 'Draft saved',
        onError: (error) => {
          setErrors(fieldErrors(error));
          return false;
        },
      },
    );
    return result.ok ? result.value : null;
  }

  async function publish() {
    if (!draft) return;
    let revision = draft.revision;
    if (dirty) {
      const saved = await save();
      if (!saved) return;
      revision = saved.revision;
    }
    const result = await run(
      () =>
        adminSend<StorefrontLayout>('/api/admin/storefront/home/draft/publish', {
          method: 'POST',
          body: { revision },
        }),
      { done: `Version ${draft.version} is live`, description: 'The front page shows it now.' },
    );
    if (result.ok) await refreshFrontPage();
  }

  const update = (index: number, patch: Partial<StorefrontSection>) =>
    setSections((list) =>
      list.map((section, i) =>
        i === index ? ({ ...section, ...patch } as StorefrontSection) : section,
      ),
    );

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-8 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex min-w-0 flex-col gap-6">
        {!draft ? (
          <Sheet title="No draft open">
            <p className="text-sm text-[var(--ink-muted)]">
              {state.published
                ? `Version ${state.published.version} is live. A draft starts as a copy of it.`
                : 'The built-in front page is showing. A draft starts as a copy of it, so publishing without changes changes nothing.'}
            </p>
            <Button
              className="mt-4"
              disabled={pending}
              onClick={() =>
                void run(() => adminSend('/api/admin/storefront/home/draft', { method: 'POST' }), {
                  done: 'Draft started',
                })
              }
            >
              Start a draft
            </Button>
          </Sheet>
        ) : (
          <>
            <div className="surface-paper sticky top-20 z-10 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--edge)] px-4 py-3">
              <p className="text-sm">
                <span className="font-medium">Draft of version {draft.version}</span>{' '}
                <span className="text-[var(--ink-muted)]">
                  {dirty ? 'has unsaved changes' : `saved ${formatDateTime(draft.updatedAt)}`}
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending || !dirty}
                  onClick={() => void save()}
                >
                  Save draft
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pending}
                  onClick={async () => {
                    if (dirty && !(await save())) return;
                    router.push(`/admin/storefront/preview/${draft.version}`);
                  }}
                >
                  Preview
                </Button>
                <Button
                  size="sm"
                  disabled={pending || sections.length === 0}
                  onClick={() => void publish()}
                >
                  Publish
                </Button>
              </div>
            </div>

            <ol className="flex flex-col gap-3">
              {sections.map((section, index) => {
                const expanded = open === section.id;
                const prefix = `sections.${index}.`;
                const sectionErrors = Object.entries(errors).filter(([key]) =>
                  key.startsWith(prefix),
                );
                return (
                  <li
                    key={section.id}
                    className={cn(
                      'surface-paper rounded-md border',
                      sectionErrors.length ? 'border-[var(--bad)]' : 'border-[var(--edge)]',
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-3 px-4 py-3">
                      <button
                        type="button"
                        aria-expanded={expanded}
                        onClick={() => setOpen(expanded ? null : section.id)}
                        className="flex min-w-0 grow items-baseline gap-3 text-left"
                      >
                        <span className="tabular w-5 shrink-0 text-sm text-[var(--ink-faint)]">
                          {index + 1}
                        </span>
                        <span className="shrink-0 text-sm font-medium">
                          {kindLabel(section.kind)}
                        </span>
                        <span className="truncate text-sm text-[var(--ink-muted)]">
                          {describeSection(section)}
                        </span>
                      </button>
                      <span className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={index === 0}
                          onClick={() => setSections((l) => moveItem(l, index, -1))}
                          aria-label={`Move section ${index + 1} up`}
                        >
                          Up
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={index === sections.length - 1}
                          onClick={() => setSections((l) => moveItem(l, index, 1))}
                          aria-label={`Move section ${index + 1} down`}
                        >
                          Down
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSections((l) => l.filter((_, i) => i !== index))}
                        >
                          Remove
                        </Button>
                      </span>
                    </div>

                    {expanded && (
                      <div className="border-t border-[var(--rule)] px-4 py-4">
                        <SectionFields
                          section={section}
                          errorFor={(path) => errors[`${prefix}${path}`]}
                          onChange={(patch) => update(index, patch)}
                          categories={categories}
                          products={products}
                        />
                      </div>
                    )}
                    {!expanded && sectionErrors.length > 0 && (
                      <p className="px-4 pb-3 text-xs text-[var(--bad)]">{sectionErrors[0]?.[1]}</p>
                    )}
                  </li>
                );
              })}
            </ol>

            <div>
              <p className="mb-2 text-sm font-medium">Add a section</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {SECTION_KINDS.map((entry) => (
                  <button
                    key={entry.kind}
                    type="button"
                    disabled={sections.length >= 12}
                    onClick={() => {
                      const section = newSection(entry.kind);
                      setSections((list) => [...list, section]);
                      setOpen(section.id);
                    }}
                    className="flex flex-col items-start rounded-sm border border-dashed border-[var(--edge)] px-3 py-2.5 text-left transition-colors hover:border-[var(--ink)] disabled:opacity-45"
                  >
                    <span className="text-sm font-medium">{entry.label}</span>
                    <span className="text-xs text-[var(--ink-muted)]">{entry.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-4 border-t border-[var(--rule)] pt-4">
              <Field className="w-full max-w-md">
                <FieldLabel>What changed in this version</FieldLabel>
                <Input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={200}
                  placeholder="Autumn shelves up front"
                />
                <FieldHint>
                  Shown in the history, so the next person knows what they would be putting back.
                </FieldHint>
              </Field>
              <Button
                variant="ghost"
                disabled={pending}
                onClick={() =>
                  void run(
                    () => adminSend('/api/admin/storefront/home/draft', { method: 'DELETE' }),
                    {
                      done: 'Draft discarded',
                    },
                  )
                }
              >
                Discard draft
              </Button>
            </div>
          </>
        )}
      </div>

      <aside className="flex flex-col gap-3 xl:sticky xl:top-24 xl:self-start">
        <h2 className="font-display text-lg [--opsz:24] [--wght:600]">Versions</h2>
        <SlabRule />
        {state.versions.length === 0 ? (
          <p className="text-sm text-[var(--ink-muted)]">Nothing has been published yet.</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {state.versions.map((version) => (
              <li key={version.id} className="rounded-sm border border-[var(--rule)] p-3 text-sm">
                <p className="flex items-center justify-between gap-2">
                  <span className="font-medium">Version {version.version}</span>
                  {version.status === 'published' && <Badge tone="good">Live</Badge>}
                  {version.status === 'draft' && <Badge tone="note">Draft</Badge>}
                </p>
                <p className="text-xs text-[var(--ink-muted)]">
                  {version.publishedAt
                    ? `Published ${formatDateTime(version.publishedAt)}`
                    : `Started ${formatDateTime(version.createdAt)}`}
                </p>
                {version.note && <p className="mt-1 text-[var(--ink-muted)]">{version.note}</p>}
                <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                  <Link
                    href={`/admin/storefront/preview/${version.version}`}
                    className="text-xs underline underline-offset-4"
                  >
                    Preview
                  </Link>
                  {version.status === 'retired' && (
                    <Button
                      variant="link"
                      size="sm"
                      className="text-xs"
                      disabled={pending}
                      onClick={async () => {
                        const result = await run(
                          () =>
                            adminSend(
                              `/api/admin/storefront/home/versions/${version.version}/publish`,
                              { method: 'POST' },
                            ),
                          { done: `Version ${version.version} is back on the front page` },
                        );
                        if (result.ok) await refreshFrontPage();
                      }}
                    >
                      Put this back
                    </Button>
                  )}
                </p>
              </li>
            ))}
          </ol>
        )}
      </aside>
    </div>
  );
}

function SectionFields({
  section,
  errorFor,
  onChange,
  categories,
  products,
}: {
  section: StorefrontSection;
  errorFor: (path: string) => string | undefined;
  onChange: (patch: Partial<StorefrontSection>) => void;
  categories: Picker[];
  products: ProductPicker[];
}) {
  const text = (
    path: string,
    label: string,
    value: string,
    set: (v: string) => void,
    options: { multiline?: boolean; hint?: string; max?: number } = {},
  ) => (
    <Field invalid={Boolean(errorFor(path))}>
      <FieldLabel>{label}</FieldLabel>
      {options.multiline ? (
        <Textarea value={value} onChange={(e) => set(e.target.value)} maxLength={options.max} />
      ) : (
        <Input value={value} onChange={(e) => set(e.target.value)} maxLength={options.max} />
      )}
      {options.hint && <FieldHint>{options.hint}</FieldHint>}
      <FieldError>{errorFor(path)}</FieldError>
    </Field>
  );

  switch (section.kind) {
    case 'hero': {
      const link = (which: 'primary' | 'secondary', value: { label: string; href: string }) => (
        <div className="grid gap-3 sm:grid-cols-2">
          {text(
            `${which}.label`,
            which === 'primary' ? 'Button' : 'Second button',
            value.label,
            (label) => onChange({ [which]: { ...value, label } }),
            { max: 40 },
          )}
          {text(
            `${which}.href`,
            'Goes to',
            value.href,
            (href) => onChange({ [which]: { ...value, href } }),
            { hint: 'A page in this shop, like /shop/ceramics.' },
          )}
        </div>
      );
      return (
        <div className="flex flex-col gap-4">
          {text('heading', 'Heading', section.heading, (heading) => onChange({ heading }), {
            max: 120,
          })}
          {text('body', 'A line underneath', section.body ?? '', (body) => onChange({ body }), {
            multiline: true,
            max: 400,
          })}
          {link('primary', section.primary)}
          <CheckRow
            label="Add a second button"
            checked={Boolean(section.secondary)}
            onCheckedChange={(checked) =>
              onChange({
                secondary:
                  checked === true
                    ? { label: 'See what is new', href: '/shop?sort=newest' }
                    : undefined,
              })
            }
          />
          {section.secondary && link('secondary', section.secondary)}
        </div>
      );
    }

    case 'shelves': {
      const chosen = section.categoryIds ?? [];
      return (
        <div className="flex flex-col gap-4">
          {text('title', 'Title', section.title, (title) => onChange({ title }), { max: 80 })}
          {text('note', 'Note beside the title', section.note ?? '', (note) => onChange({ note }), {
            max: 160,
          })}
          <fieldset>
            <legend className="text-sm font-medium">Which shelves</legend>
            <p className="text-xs text-[var(--ink-faint)]">
              Tick none to show every top-level shelf, which follows the tree as it changes.
            </p>
            <div className="mt-2 flex max-h-64 flex-col overflow-y-auto">
              {categories.map((category) => (
                <CheckRow
                  key={category.id}
                  style={{ paddingLeft: `${0.25 + category.depth * 1}rem` }}
                  label={category.name}
                  checked={chosen.includes(category.id)}
                  onCheckedChange={(checked) =>
                    onChange({
                      categoryIds:
                        checked === true
                          ? [...chosen, category.id]
                          : chosen.filter((id) => id !== category.id),
                    })
                  }
                />
              ))}
            </div>
          </fieldset>
        </div>
      );
    }

    case 'product-row': {
      const picked = section.productIds ?? [];
      const unpicked = products.filter((p) => !picked.includes(p.id));
      return (
        <div className="flex flex-col gap-4">
          {text('title', 'Title', section.title, (title) => onChange({ title }), { max: 80 })}
          {text('note', 'Note beside the title', section.note ?? '', (note) => onChange({ note }), {
            max: 160,
          })}
          <fieldset>
            <legend className="mb-1 text-sm font-medium">Which products</legend>
            <RadioSet
              value={section.source}
              onValueChange={(source) => onChange({ source: source as typeof section.source })}
            >
              <RadioRow value="newest" label="The newest in the shop" />
              <RadioRow value="category" label="The newest from one shelf" />
              <RadioRow
                value="handpicked"
                label="Ones I choose"
                hint="Shown in the order below. Any that go off sale drop out on their own."
              />
            </RadioSet>
          </fieldset>

          {section.source === 'category' && (
            <Field invalid={Boolean(errorFor('categoryId'))}>
              <FieldLabel>Shelf</FieldLabel>
              <SelectRoot
                value={section.categoryId ?? ''}
                onValueChange={(categoryId) => onChange({ categoryId })}
              >
                <SelectTrigger className="max-w-sm">
                  <SelectValue placeholder="Choose a shelf" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {'  '.repeat(c.depth)}
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
              <FieldError>{errorFor('categoryId')}</FieldError>
            </Field>
          )}

          {section.source !== 'handpicked' ? (
            <Field className="max-w-40">
              <FieldLabel>How many</FieldLabel>
              <SelectRoot
                value={String(section.limit ?? 6)}
                onValueChange={(v) => onChange({ limit: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[3, 4, 6, 8, 9, 12].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
            </Field>
          ) : (
            <div className="flex flex-col gap-2">
              <ol className="flex flex-col gap-1">
                {picked.map((id, i) => (
                  <li
                    key={id}
                    className="flex items-center justify-between gap-2 rounded-sm bg-[var(--groove)]/60 px-3 py-1.5 text-sm"
                  >
                    <span>
                      {products.find((p) => p.id === id)?.title ?? 'A product no longer on sale'}
                    </span>
                    <span className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={i === 0}
                        onClick={() => onChange({ productIds: moveItem(picked, i, -1) })}
                      >
                        Up
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={i === picked.length - 1}
                        onClick={() => onChange({ productIds: moveItem(picked, i, 1) })}
                      >
                        Down
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onChange({ productIds: picked.filter((p) => p !== id) })}
                      >
                        Remove
                      </Button>
                    </span>
                  </li>
                ))}
              </ol>
              {picked.length < 12 && unpicked.length > 0 && (
                <Field invalid={Boolean(errorFor('productIds'))} className="max-w-sm">
                  <FieldLabel>Add a product</FieldLabel>
                  <SelectRoot
                    value=""
                    onValueChange={(id) => onChange({ productIds: [...picked, id] })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose one of the live products" />
                    </SelectTrigger>
                    <SelectContent>
                      {unpicked.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </SelectRoot>
                  <FieldError>{errorFor('productIds')}</FieldError>
                </Field>
              )}
            </div>
          )}
        </div>
      );
    }

    case 'note':
      return (
        <div className="flex flex-col gap-4">
          {text(
            'heading',
            'Heading (optional)',
            section.heading ?? '',
            (heading) => onChange({ heading }),
            { max: 80 },
          )}
          {text('body', 'What it says', section.body, (body) => onChange({ body }), {
            multiline: true,
            max: 1000,
            hint: 'A blank line starts a new paragraph.',
          })}
        </div>
      );
  }
}
