'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldHint, FieldLabel } from '@/components/ui/field';
import { Input, Textarea } from '@/components/ui/input';
import { CheckRow, Toggle } from '@/components/ui/choice';
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { SlabRule } from '@/components/motifs/rule';
import { adminSend, fieldErrors } from '@/lib/admin/client';
import {
  ATTRIBUTE_TYPES,
  FILTER_UI_LABELS,
  TYPE_LABELS,
  canBeVariantAxis,
  filterUisFor,
  hasOptions,
  isFilterableType,
  keyFromLabel,
  keyProblem,
  optionValueFromLabel,
} from '@/lib/admin/attribute-rules';
import type { AttributeDefinition, AttributeType, FilterUi } from '@/lib/admin/types';
import { cn } from '@/lib/cn';
import { plural } from '@/lib/admin/format';
import { useAdminAction } from './console-provider';

/**
 * The attribute builder.
 *
 * The form on the left defines a fact the code has never heard of. The panel on the right
 * shows it as a shopper will meet it — in the filter panel, on the product page, as a
 * variant picker and in the address bar — and updates as the admin types. That panel is the
 * console's one indulgence, and it earns its place: every choice on this form (a key, a
 * type, a filter control, whether it is an axis) is a choice about what a shopper sees, and
 * seeing it is faster than reading about it.
 *
 * Key and type are fixed once created, and the form says why at the point of editing
 * rather than simply greying them out.
 */

type OptionDraft = { value: string; label: string; swatchHex: string; valueTouched: boolean };

function numericValue(label: string) {
  return /\d+/.exec(label)?.[0] ?? '';
}

export function AttributeForm({
  definition,
  usage,
}: {
  definition?: AttributeDefinition;
  usage?: { categories: number; products: number };
}) {
  const router = useRouter();
  const { run, pending } = useAdminAction();
  const editing = Boolean(definition);

  const [label, setLabel] = useState(definition?.label ?? '');
  const [key, setKey] = useState(definition?.key ?? '');
  const [keyTouched, setKeyTouched] = useState(editing);
  const [type, setType] = useState<AttributeType>(definition?.type ?? 'select');
  const [description, setDescription] = useState(definition?.description ?? '');
  const [unit, setUnit] = useState(definition?.unit ?? '');
  const [options, setOptions] = useState<OptionDraft[]>(
    (definition?.options ?? [])
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((o) => ({
        value: o.value,
        label: o.label,
        swatchHex: o.swatchHex ?? '',
        valueTouched: true,
      })),
  );
  const [isFilterable, setFilterable] = useState(definition?.isFilterable ?? true);
  const [isSearchable, setSearchable] = useState(definition?.isSearchable ?? false);
  const [isVariantAxis, setAxis] = useState(definition?.isVariantAxis ?? false);
  const [filterUi, setFilterUi] = useState<FilterUi>(definition?.filterUi ?? 'checkbox');
  const [min, setMin] = useState(definition?.validation.min?.toString() ?? '');
  const [max, setMax] = useState(definition?.validation.max?.toString() ?? '');
  const [requiredByDefault, setRequiredByDefault] = useState(
    definition?.validation.requiredByDefault ?? false,
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const usesOptions = hasOptions(type) || type === 'number';
  const filterChoices = filterUisFor(type, options.length);
  const filterable = isFilterableType(type) && isFilterable;
  const effectiveFilterUi = filterChoices.includes(filterUi)
    ? filterUi
    : (filterChoices[0] ?? 'checkbox');
  const axisAllowed = canBeVariantAxis(type, options.length);
  const keyIssue = editing ? null : keyProblem(key);

  function updateLabel(next: string) {
    setLabel(next);
    if (!keyTouched) setKey(keyFromLabel(next));
  }

  function updateOption(index: number, patch: Partial<OptionDraft>) {
    setOptions((list) =>
      list.map((option, i) => {
        if (i !== index) return option;
        const merged = { ...option, ...patch };
        if (patch.label !== undefined && !option.valueTouched) {
          merged.value =
            type === 'number' ? numericValue(patch.label) : optionValueFromLabel(patch.label);
        }
        return merged;
      }),
    );
  }

  function moveOption(index: number, delta: -1 | 1) {
    setOptions((list) => {
      const target = index + delta;
      if (target < 0 || target >= list.length) return list;
      const next = [...list];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });
  }

  async function save() {
    if (keyIssue) {
      setErrors({ key: keyIssue });
      return;
    }
    setErrors({});

    const body = {
      label: label.trim(),
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(unit.trim() ? { unit: unit.trim() } : {}),
      options: usesOptions
        ? options.map((option, order) => ({
            value: option.value.trim(),
            label: option.label.trim(),
            ...(type === 'color' && option.swatchHex ? { swatchHex: option.swatchHex } : {}),
            order,
          }))
        : [],
      isFilterable: filterable,
      isSearchable,
      isVariantAxis: axisAllowed && isVariantAxis,
      filterUi: effectiveFilterUi,
      validation: {
        ...(type === 'number' && min.trim() ? { min: Number(min) } : {}),
        ...(type === 'number' && max.trim() ? { max: Number(max) } : {}),
        requiredByDefault,
      },
    };

    const result = await run(
      () =>
        editing
          ? adminSend<AttributeDefinition>(`/api/admin/catalog/attributes/${definition!._id}`, {
              method: 'PATCH',
              body,
            })
          : adminSend<AttributeDefinition>('/api/admin/catalog/attributes', {
              method: 'POST',
              body: { ...body, key, type },
            }),
      {
        done: editing ? 'Attribute saved' : 'Attribute defined',
        description: editing
          ? 'Filters pick up changes within half a minute.'
          : 'Bind it to a category to put it on products.',
        onError: (error) => {
          const found = fieldErrors(error);
          if (Object.keys(found).length === 0) return false;
          setErrors(found);
          return false;
        },
      },
    );

    if (result.ok && !editing) router.push(`/admin/catalog/attributes/${result.value._id}`);
  }

  async function setArchived(archive: boolean) {
    await run(
      () =>
        adminSend(
          `/api/admin/catalog/attributes/${definition!._id}/${archive ? 'archive' : 'restore'}`,
          {
            method: 'POST',
          },
        ),
      {
        done: archive ? 'Attribute archived' : 'Attribute restored',
        description: archive
          ? 'It no longer appears in forms or filters. Stored values still show on products.'
          : undefined,
      },
    );
  }

  const preview = {
    attrKey: key || 'your_key',
    label: label || 'Your attribute',
    type,
    unit: unit.trim(),
    options: options.filter((o) => o.label.trim()),
    filterable,
    filterUi: effectiveFilterUi,
    axis: axisAllowed && isVariantAxis,
  };

  return (
    <form
      className="grid grid-cols-[minmax(0,1fr)] gap-8 xl:grid-cols-[minmax(0,1fr)_24rem]"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
      noValidate
    >
      <div className="flex flex-col gap-6">
        {definition?.archivedAt && (
          <p className="rounded-md border border-[var(--note)]/40 p-4 text-sm text-[var(--note)]">
            This attribute is archived. It is not offered in forms or filters, and products that
            carry it still show their values.
          </p>
        )}

        <section className="surface-paper flex flex-col gap-5 rounded-md border border-[var(--edge)] p-5">
          <h2 className="font-display text-lg [--opsz:24] [--wght:600]">What it is called</h2>

          <Field invalid={Boolean(errors.label)}>
            <FieldLabel>Label</FieldLabel>
            <Input
              value={label}
              onChange={(e) => updateLabel(e.target.value)}
              placeholder="Roast level"
            />
            <FieldHint>
              What shoppers read, on filters and product pages. Can be changed any time.
            </FieldHint>
            <FieldError>{errors.label}</FieldError>
          </Field>

          <Field invalid={Boolean(errors.key ?? keyIssue) && keyTouched}>
            <FieldLabel>Key</FieldLabel>
            <Input
              value={key}
              readOnly={editing}
              onChange={(e) => {
                setKeyTouched(true);
                setKey(e.target.value.toLowerCase());
              }}
              className="font-mono"
              placeholder="roast_level"
            />
            <FieldHint>
              {editing
                ? 'Permanent. It is in every bookmarked filter link and in the search index; a new name means a new attribute.'
                : 'Permanent once created. It appears in filter links, so it cannot change later without breaking them.'}
            </FieldHint>
            <FieldError>{keyTouched || errors.key ? (errors.key ?? keyIssue) : null}</FieldError>
          </Field>

          <Field>
            <FieldLabel>Description</FieldLabel>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-16"
              maxLength={500}
            />
            <FieldHint>For whoever fills in products. Shoppers do not see it.</FieldHint>
          </Field>
        </section>

        <section className="surface-paper flex flex-col gap-5 rounded-md border border-[var(--edge)] p-5">
          <h2 className="font-display text-lg [--opsz:24] [--wght:600]">What kind of fact</h2>

          {editing ? (
            <p className="text-sm">
              {TYPE_LABELS[type].label}.{' '}
              <span className="text-[var(--ink-muted)]">
                The kind is permanent: stored values are kept in a slot for their kind, and changing
                it would strand every one.
              </span>
            </p>
          ) : (
            <div role="radiogroup" aria-label="Kind" className="grid gap-2 sm:grid-cols-2">
              {ATTRIBUTE_TYPES.map((choice) => (
                <button
                  key={choice}
                  type="button"
                  role="radio"
                  aria-checked={type === choice}
                  onClick={() => setType(choice)}
                  className={cn(
                    'flex flex-col items-start gap-0.5 rounded-sm border px-3 py-2.5 text-left transition-colors',
                    type === choice
                      ? 'border-[var(--ink)] bg-[var(--groove)]'
                      : 'border-[var(--edge)] hover:border-[var(--ink-muted)]',
                  )}
                >
                  <span className="text-sm font-medium">{TYPE_LABELS[choice].label}</span>
                  <span className="text-xs text-[var(--ink-muted)]">
                    {TYPE_LABELS[choice].hint}
                  </span>
                </button>
              ))}
            </div>
          )}

          {(type === 'number' || type === 'dimension') && (
            <Field>
              <FieldLabel>Unit</FieldLabel>
              <Input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="max-w-32"
                placeholder="g"
              />
            </Field>
          )}

          {usesOptions && (
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm font-medium">
                  {type === 'number' ? 'Fixed values (optional)' : 'Options'}
                </p>
                <p className="text-xs text-[var(--ink-faint)]">
                  {type === 'number'
                    ? 'List the sizes you sell — 250, 500, 1000 — to use this as a variant axis. Leave empty for any number.'
                    : 'The value is what goes in the address bar; the label is what shoppers read.'}
                  {usage &&
                    usage.products > 0 &&
                    ` Removing a value that ${plural(usage.products, 'product')} already use leaves those products showing a value no filter offers.`}
                </p>
              </div>

              {options.map((option, index) => (
                <div
                  key={index}
                  className="flex flex-wrap items-end gap-2 rounded-sm bg-[var(--groove)]/50 p-2"
                >
                  <Field
                    className="min-w-40 grow"
                    invalid={Boolean(errors[`options.${index}.label`])}
                  >
                    <FieldLabel className="text-xs">Label</FieldLabel>
                    <Input
                      value={option.label}
                      onChange={(e) => updateOption(index, { label: e.target.value })}
                    />
                  </Field>
                  <Field className="w-36" invalid={Boolean(errors[`options.${index}.value`])}>
                    <FieldLabel className="text-xs">Value</FieldLabel>
                    <Input
                      value={option.value}
                      className="font-mono"
                      onChange={(e) =>
                        updateOption(index, { value: e.target.value, valueTouched: true })
                      }
                    />
                    <FieldError>{errors[`options.${index}.value`]}</FieldError>
                  </Field>
                  {type === 'color' && (
                    <label className="flex flex-col gap-1.5 text-xs font-medium">
                      Swatch
                      <input
                        type="color"
                        value={option.swatchHex || '#8d684e'}
                        onChange={(e) => updateOption(index, { swatchHex: e.target.value })}
                        className="h-10 w-12 cursor-pointer rounded-sm border border-[var(--edge)] bg-[var(--field)]"
                      />
                    </label>
                  )}
                  <span className="flex gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => moveOption(index, -1)}
                      aria-label={`Move ${option.label || 'option'} up`}
                    >
                      Up
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => moveOption(index, 1)}
                      aria-label={`Move ${option.label || 'option'} down`}
                    >
                      Down
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setOptions((list) => list.filter((_, i) => i !== index))}
                    >
                      Remove
                    </Button>
                  </span>
                </div>
              ))}
              {errors.options && <p className="text-xs text-[var(--bad)]">{errors.options}</p>}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() =>
                  setOptions((list) => [
                    ...list,
                    { value: '', label: '', swatchHex: '', valueTouched: false },
                  ])
                }
              >
                Add {options.length === 0 ? 'an option' : 'another'}
              </Button>
            </div>
          )}

          {type === 'number' && options.length === 0 && (
            <div className="flex gap-3">
              <Field className="w-32">
                <FieldLabel>Lowest</FieldLabel>
                <Input type="number" value={min} onChange={(e) => setMin(e.target.value)} />
              </Field>
              <Field className="w-32">
                <FieldLabel>Highest</FieldLabel>
                <Input type="number" value={max} onChange={(e) => setMax(e.target.value)} />
              </Field>
            </div>
          )}
        </section>

        <section className="surface-paper flex flex-col gap-4 rounded-md border border-[var(--edge)] p-5">
          <h2 className="font-display text-lg [--opsz:24] [--wght:600]">How the shop uses it</h2>

          <SettingRow
            title="Offer it as a filter"
            hint={
              isFilterableType(type)
                ? 'Shoppers can narrow a shelf by it, with a count beside each value.'
                : `${TYPE_LABELS[type].label} cannot be a filter: there is no short list of values to choose between.`
            }
          >
            <Toggle
              checked={filterable}
              disabled={!isFilterableType(type)}
              onCheckedChange={setFilterable}
              aria-label="Offer it as a filter"
            />
          </SettingRow>

          {filterable && filterChoices.length > 1 && (
            <Field className="max-w-xs">
              <FieldLabel>Filter control</FieldLabel>
              <SelectRoot
                value={effectiveFilterUi}
                onValueChange={(v) => setFilterUi(v as FilterUi)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filterChoices.map((ui) => (
                    <SelectItem key={ui} value={ui}>
                      {FILTER_UI_LABELS[ui]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
            </Field>
          )}

          <SettingRow
            title="Products can come in different ones"
            hint={
              axisAllowed
                ? 'A product can sell a separate variant, with its own price and stock, for each value.'
                : type === 'number'
                  ? 'List fixed values above to allow this — a variant needs one of a known set.'
                  : hasOptions(type) && type !== 'multiselect'
                    ? 'Add options first.'
                    : 'Only a single choice, a colour, yes-or-no or a fixed number can tell variants apart.'
            }
          >
            <Toggle
              checked={axisAllowed && isVariantAxis}
              disabled={!axisAllowed}
              onCheckedChange={setAxis}
              aria-label="Products can come in different ones"
            />
          </SettingRow>

          <SettingRow
            title="Match it in search"
            hint="A search for one of its values finds the product."
          >
            <Toggle
              checked={isSearchable}
              onCheckedChange={setSearchable}
              aria-label="Match it in search"
            />
          </SettingRow>

          <CheckRow
            checked={requiredByDefault}
            onCheckedChange={(checked) => setRequiredByDefault(checked === true)}
            label="Required when first bound to a category"
          />
        </section>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" size="lg" disabled={pending || !label.trim()}>
            {editing ? 'Save attribute' : 'Define attribute'}
          </Button>
          {definition &&
            (definition.archivedAt ? (
              <Button
                type="button"
                variant="outline"
                disabled={pending}
                onClick={() => void setArchived(false)}
              >
                Restore
              </Button>
            ) : (
              <Button
                type="button"
                variant="ghost"
                disabled={pending}
                onClick={() => void setArchived(true)}
              >
                Archive
              </Button>
            ))}
        </div>
      </div>

      <AttributePreview {...preview} />
    </form>
  );
}

function SettingRow({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-6">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-[var(--ink-muted)]">{hint}</p>
      </div>
      {children}
    </div>
  );
}

type PreviewProps = {
  /** Not `key`: React reserves that name and never passes it to the component. */
  attrKey: string;
  label: string;
  type: AttributeType;
  unit: string;
  options: OptionDraft[];
  filterable: boolean;
  filterUi: FilterUi;
  axis: boolean;
};

function sampleValue({
  type,
  options,
  unit,
}: Pick<PreviewProps, 'type' | 'options' | 'unit'>): string {
  const first = options[0]?.label;
  switch (type) {
    case 'boolean':
      return 'Yes';
    case 'multiselect':
      return (
        options
          .slice(0, 2)
          .map((o) => o.label)
          .join(', ') || 'Tea, coffee'
      );
    case 'number':
      return first ?? `250${unit ? ` ${unit}` : ''}`;
    case 'dimension':
      return `12 × 9 × 10${unit ? ` ${unit}` : ' cm'}`;
    case 'text':
      return 'Written per product';
    default:
      return first ?? 'Your first option';
  }
}

/**
 * The shop window: this attribute as a shopper meets it. On the chocolate ground, because
 * that is where it will be seen — the form is paper, and the result is the shop.
 */
function AttributePreview(props: PreviewProps) {
  const [ticked, setTicked] = useState<string[]>([]);
  const [chosen, setChosen] = useState(0);
  const [on, setOn] = useState(false);
  const { label, type, unit, options, filterable, filterUi, axis, attrKey } = props;
  const values = type === 'boolean' ? [{ label: 'Yes', value: 'true', swatchHex: '' }] : options;
  const urlValue =
    (type === 'boolean' ? 'true' : options[0]?.value || 'value') +
    (filterUi === 'range' ? '-500' : '');

  return (
    <aside aria-label="Preview" className="xl:sticky xl:top-24 xl:self-start">
      <div className="surface-ground grain-none flex flex-col gap-6 rounded-lg border border-[var(--rule)] p-5 shadow-[var(--shadow-lift)]">
        <div>
          <p className="font-display text-base [--opsz:18] [--wght:600]">
            How shoppers will meet it
          </p>
          <p className="text-xs text-[var(--ink-faint)]">Live, as you type. Try the controls.</p>
        </div>

        <PreviewPart title="In the filter panel">
          {!filterable ? (
            <p className="text-sm text-[var(--ink-muted)]">Not offered as a filter.</p>
          ) : (
            <fieldset>
              <legend className="mb-2 text-sm font-medium">{label}</legend>
              {filterUi === 'toggle' && (
                <label className="flex items-center justify-between gap-3 text-sm">
                  Only {label.toLowerCase()}
                  <Toggle checked={on} onCheckedChange={setOn} />
                </label>
              )}
              {filterUi === 'range' && (
                <div className="flex flex-col gap-2">
                  <div className="h-1 rounded-full bg-[var(--groove)]">
                    <div className="mx-[15%] h-1 w-[45%] rounded-full bg-[var(--ink)]" />
                  </div>
                  <p className="tabular text-sm text-[var(--ink-muted)]">
                    From 100{unit && ` ${unit}`} to 500{unit && ` ${unit}`}
                  </p>
                </div>
              )}
              {filterUi === 'swatch' && (
                <div className="flex flex-wrap gap-2">
                  {(values.length
                    ? values
                    : [{ label: 'First', value: 'a', swatchHex: '#8d684e' }]
                  ).map((option) => (
                    <button
                      key={option.value || option.label}
                      type="button"
                      aria-pressed={ticked.includes(option.label)}
                      title={option.label}
                      onClick={() =>
                        setTicked((t) =>
                          t.includes(option.label)
                            ? t.filter((x) => x !== option.label)
                            : [...t, option.label],
                        )
                      }
                      className={cn(
                        'size-8 rounded-full border-2 transition-transform',
                        ticked.includes(option.label)
                          ? 'scale-110 border-[var(--ink)]'
                          : 'border-[var(--edge)]',
                      )}
                      style={{ backgroundColor: option.swatchHex || '#8d684e' }}
                    >
                      <span className="sr-only">{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
              {(filterUi === 'checkbox' || filterUi === 'select') && (
                <div className="flex flex-col">
                  {(values.length
                    ? values
                    : [{ label: 'Your first option', value: 'a', swatchHex: '' }]
                  )
                    .slice(0, 5)
                    .map((option) => (
                      <CheckRow
                        key={option.value || option.label}
                        label={option.label}
                        checked={ticked.includes(option.label)}
                        onCheckedChange={() =>
                          setTicked((t) =>
                            t.includes(option.label)
                              ? t.filter((x) => x !== option.label)
                              : [...t, option.label],
                          )
                        }
                      />
                    ))}
                  {filterUi === 'select' && (
                    <p className="mt-1 text-xs text-[var(--ink-faint)]">
                      Shown as a drop-down, one value at a time.
                    </p>
                  )}
                </div>
              )}
            </fieldset>
          )}
        </PreviewPart>

        <PreviewPart title="On the product page">
          <div className="flex justify-between gap-6 border-y border-[var(--rule)] py-2 text-sm">
            <span className="text-[var(--ink-muted)]">{label}</span>
            <span className="text-right">{sampleValue(props)}</span>
          </div>
        </PreviewPart>

        {axis && (
          <PreviewPart title="Choosing a variant">
            <div className="flex flex-wrap gap-2">
              {(type === 'boolean'
                ? [
                    { label: 'Yes', value: 'true', swatchHex: '' },
                    { label: 'No', value: 'false', swatchHex: '' },
                  ]
                : options
              ).map((option, index) => (
                <button
                  key={option.value || index}
                  type="button"
                  aria-pressed={chosen === index}
                  onClick={() => setChosen(index)}
                  className={cn(
                    'rounded-sm border px-3 py-1.5 text-sm transition-colors',
                    chosen === index
                      ? 'border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)]'
                      : 'border-[var(--edge)]',
                  )}
                >
                  {type === 'color' && (
                    <span
                      aria-hidden
                      className="mr-1.5 inline-block size-3 rounded-full align-[-1px]"
                      style={{ backgroundColor: option.swatchHex || '#8d684e' }}
                    />
                  )}
                  {option.label}
                </button>
              ))}
            </div>
          </PreviewPart>
        )}

        {filterable && (
          <PreviewPart title="In the address bar">
            <p className="font-mono text-xs break-all text-[var(--ink-muted)]">
              /shop/…?<span className="text-[var(--ink)]">{attrKey}</span>={urlValue}
            </p>
            <p className="mt-1 text-xs text-[var(--ink-faint)]">
              Anyone who bookmarks a filtered shelf keeps this link. That is why the key cannot
              change.
            </p>
          </PreviewPart>
        )}

        {!filterable && !axis && type !== 'text' && type !== 'dimension' && (
          <Badge tone="note" className="self-start">
            Shown on products only
          </Badge>
        )}
      </div>
      <SlabRule className="mt-3 opacity-60" />
    </aside>
  );
}

function PreviewPart({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-[var(--ink-faint)]">{title}</p>
      {children}
    </div>
  );
}
