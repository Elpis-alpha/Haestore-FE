'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Field, FieldError, FieldHint, FieldLabel } from '@/components/ui/field';
import { Input, Textarea } from '@/components/ui/input';
import { CheckBox, CheckRow, RadioRow, RadioSet } from '@/components/ui/choice';
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { adminSend, fieldErrors } from '@/lib/admin/client';
import { plural } from '@/lib/admin/format';
import {
  attributePayload,
  fingerprint,
  formValuesFrom,
  gridSize,
  mergeGrid,
  variantDraftsFrom,
  variantsPayload,
  type DimensionDraft,
  type FormValue,
  type VariantDraft,
} from '@/lib/admin/product-form';
import type { FlatCategory } from '@/lib/admin/tree';
import type { AdminProduct, EffectiveAttribute, EffectiveAttributeSet } from '@/lib/admin/types';
import { Sheet } from './ledger';
import { useAdminAction } from './console-provider';
import { PhotoUpload } from './photo-upload';

const UNSET = '__unset';
const WARN_AT = 24;
const LIMIT = 100;

/** An image as the form holds it: everything the API stores except where it sits in the list. */
type ImageDraft = Omit<AdminProduct['images'][number], 'position'>;

/**
 * The product form, generated from the shelf.
 *
 * Nothing below names an attribute. The "What it is" section is built from the category's
 * effective attribute set — one control per type — so a fact defined in the attribute
 * builder this morning is a field here this afternoon. That is the adaptable claim, visible.
 *
 * Saving sends the whole product through the one write pipeline on the server: validated
 * against the category, projected, re-summarised, and queued for the search index in the
 * same transaction. The variant grid is planned here, in the browser, as a suggestion the
 * admin prunes; nothing about it exists until Save.
 */
export function ProductEditor({
  product,
  set,
  categories,
  categoryId,
}: {
  product?: AdminProduct;
  set: EffectiveAttributeSet;
  categories: FlatCategory[];
  categoryId: string;
}) {
  const router = useRouter();
  const { run, pending } = useAdminAction();
  const currency = product?.variants[0]?.price.currency ?? 'USD';

  const [title, setTitle] = useState(product?.title ?? '');
  const [subtitle, setSubtitle] = useState(product?.subtitle ?? '');
  const [description, setDescription] = useState(product?.description ?? '');
  const [status, setStatus] = useState<AdminProduct['status']>(product?.status ?? 'draft');
  const [values, setValues] = useState<Record<string, FormValue>>(() =>
    formValuesFrom(product?.attributes ?? []),
  );
  const axisAttributes = set.attributes.filter((a) => a.isAxisEligible);
  const [axes, setAxes] = useState<Record<string, string[]>>(() => {
    const initial: Record<string, string[]> = {};
    for (const key of product?.variantAxes ?? []) {
      initial[key] = [
        ...new Set(
          (product?.variants ?? []).flatMap((v) =>
            v.axisValues.filter((a) => a.key === key).map((a) => a.value),
          ),
        ),
      ];
    }
    return initial;
  });
  const [drafts, setDrafts] = useState<VariantDraft[]>(() =>
    product && product.variants.length > 0
      ? variantDraftsFrom(product.variants)
      : [
          {
            sku: '',
            axisValues: [],
            price: '',
            compareAt: '',
            onHand: '0',
            lowStockThreshold: '3',
            backorderable: false,
            status: 'active',
            imagePublicIds: [],
            reserved: 0,
          },
        ],
  );
  const [images, setImages] = useState<ImageDraft[]>(() =>
    (product?.images ?? [])
      .slice()
      .sort((a, b) => a.position - b.position)
      .map(({ position: _position, ...image }) => image),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [moveTo, setMoveTo] = useState(categoryId);

  const chosenAxes = axisAttributes
    .filter((a) => axes[a.key] !== undefined)
    .map((a) => ({ key: a.key, values: axes[a.key] ?? [] }));
  const plannedCount = gridSize(chosenAxes);
  const gridMatches =
    chosenAxes.length === 0
      ? drafts.every((d) => d.axisValues.length === 0)
      : drafts.length > 0 &&
        drafts.every((d) => d.axisValues.length === chosenAxes.length) &&
        new Set(drafts.map((d) => fingerprint(d.axisValues))).size === drafts.length;

  const grouped = useMemo(() => {
    const groups: { group?: string; attributes: EffectiveAttribute[] }[] = [];
    for (const attribute of set.attributes) {
      const last = groups[groups.length - 1];
      if (last && last.group === attribute.group) last.attributes.push(attribute);
      else groups.push({ group: attribute.group, attributes: [attribute] });
    }
    return groups;
  }, [set.attributes]);

  const labelFor = (key: string, value: string) => {
    const attribute = set.attributes.find((a) => a.key === key);
    if (attribute?.type === 'boolean') return value === 'true' ? 'Yes' : 'No';
    return attribute?.options.find((o) => o.value === value)?.label ?? value;
  };

  /** The same cartesian order as the server's planVariantGrid: axes in order, values in order. */
  function planGrid() {
    let rows: { key: string; value: string }[][] = [[]];
    for (const axis of chosenAxes) {
      rows = rows.flatMap((row) => axis.values.map((value) => [...row, { key: axis.key, value }]));
    }
    setDrafts((current) =>
      mergeGrid(
        current,
        chosenAxes.length === 0
          ? [{ sku: '', axisValues: [] }]
          : rows.map((axisValues) => ({ sku: '', axisValues })),
      ),
    );
  }

  function updateDraft(index: number, patch: Partial<VariantDraft>) {
    setDrafts((list) => list.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  async function save() {
    const attributes = attributePayload(set.attributes, values);
    const variants = variantsPayload(drafts, currency);
    const local = { ...attributes.errors, ...prefix(variants.errors, 'variants') };
    if (!gridMatches) local.grid = 'Rebuild the grid so the rows match the choices above.';
    setErrors(local);
    if (Object.keys(local).length > 0) return;

    const body = {
      title: title.trim(),
      subtitle: subtitle.trim(),
      description: description.trim(),
      status,
      attributes: attributes.payload,
      variantAxes: chosenAxes.map((a) => a.key),
      variants: variants.variants,
      // Everything an image carries goes back, not just its id: dropping the dimensions would
      // cost the placeholder its shape, and dropping the credit would leave a photograph on
      // the shelf without the attribution its licence requires. Until Phase 10 this sent the
      // id and the description only, and every save quietly stripped the rest.
      images: images
        .filter((image) => image.publicId.trim())
        .map((image, position) => ({
          ...image,
          publicId: image.publicId.trim(),
          alt: image.alt.trim(),
          position,
        })),
    };

    const result = await run(
      () =>
        product
          ? adminSend<AdminProduct>(`/api/admin/catalog/products/${product._id}`, {
              method: 'PATCH',
              body,
            })
          : adminSend<AdminProduct>('/api/admin/catalog/products', {
              method: 'POST',
              body: { ...body, categoryId },
            }),
      {
        done: product ? 'Product saved' : 'Product added',
        description: status === 'active' ? 'The shop shows it within a few seconds.' : undefined,
        onError: (error) => {
          const found = fieldErrors(error);
          if (Object.keys(found).length > 0) setErrors(found);
          return false;
        },
      },
    );

    if (result.ok && !product) router.push(`/admin/catalog/products/${result.value._id}`);
  }

  const issues = product?.validationIssues ?? [];

  return (
    <form
      noValidate
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      {issues.length > 0 && (
        <div
          role="note"
          className="rounded-md border border-[var(--note)]/40 p-4 text-sm text-[var(--note)]"
        >
          <p className="font-medium">This product is on sale, but its shelf expects more:</p>
          <ul className="mt-1 list-disc pl-5">
            {issues.map((issue) => (
              <li key={`${issue.key}-${issue.code}`}>{issue.message}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <Sheet title="The label">
            <div className="flex flex-col gap-4">
              <Field invalid={Boolean(errors.title)}>
                <FieldLabel>Title</FieldLabel>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                <FieldError>{errors.title}</FieldError>
              </Field>
              <Field>
                <FieldLabel>Subtitle</FieldLabel>
                <Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
                <FieldHint>One line under the title on the shelf.</FieldHint>
              </Field>
              <Field>
                <FieldLabel>Description</FieldLabel>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-32"
                />
                <FieldHint>A blank line starts a new paragraph.</FieldHint>
              </Field>
            </div>
          </Sheet>

          <Sheet title="What it is">
            {set.attributes.length === 0 ? (
              <p className="text-sm text-[var(--ink-muted)]">
                This shelf asks for nothing more.{' '}
                <Link
                  href={`/admin/catalog/categories?id=${categoryId}`}
                  className="underline underline-offset-4"
                >
                  Bind attributes to it
                </Link>{' '}
                to give its products a specification.
              </p>
            ) : (
              <div className="flex flex-col gap-6">
                {grouped.map(({ group, attributes }) => (
                  <fieldset key={group ?? '__ungrouped'} className="flex flex-col gap-4">
                    {group && (
                      <legend className="mb-1 text-xs text-[var(--ink-faint)]">{group}</legend>
                    )}
                    {attributes.map((attribute) => (
                      <AttributeControl
                        key={attribute.key}
                        attribute={attribute}
                        value={values[attribute.key]}
                        error={errors[attribute.key]}
                        onChange={(value) =>
                          setValues((current) => ({ ...current, [attribute.key]: value }))
                        }
                      />
                    ))}
                  </fieldset>
                ))}
              </div>
            )}
          </Sheet>

          <Sheet title="How it is sold">
            {axisAttributes.length > 0 && (
              <div className="mb-5 flex flex-col gap-3">
                <p className="text-sm text-[var(--ink-muted)]">
                  Split it into variants along the facts that change the price or the stock. Only
                  the values ticked here become rows — a coffee sold whole bean only gets no ground
                  variant.
                </p>
                {axisAttributes.map((attribute) => {
                  const chosen = axes[attribute.key];
                  const options =
                    attribute.type === 'boolean'
                      ? [
                          { value: 'true', label: 'Yes' },
                          { value: 'false', label: 'No' },
                        ]
                      : attribute.options;
                  return (
                    <div key={attribute.key} className="rounded-sm border border-[var(--rule)] p-3">
                      <CheckRow
                        label={`Comes in different ${attribute.label.toLowerCase()}`}
                        checked={chosen !== undefined}
                        onCheckedChange={(checked) =>
                          setAxes((current) => {
                            const next = { ...current };
                            if (checked === true) next[attribute.key] = [];
                            else delete next[attribute.key];
                            return next;
                          })
                        }
                      />
                      {chosen !== undefined && (
                        <div className="mt-1 flex flex-wrap gap-x-4 pl-7">
                          {options.map((option) => (
                            <CheckRow
                              key={option.value}
                              label={option.label}
                              checked={chosen.includes(option.value)}
                              onCheckedChange={(checked) =>
                                setAxes((current) => ({
                                  ...current,
                                  [attribute.key]: options
                                    .map((o) => o.value)
                                    .filter((v) =>
                                      v === option.value
                                        ? checked === true
                                        : (current[attribute.key] ?? []).includes(v),
                                    ),
                                }))
                              }
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={plannedCount > LIMIT || chosenAxes.some((a) => a.values.length === 0)}
                    onClick={planGrid}
                  >
                    {chosenAxes.length === 0
                      ? 'Sell it as one item'
                      : `Build ${plural(plannedCount, 'row')}`}
                  </Button>
                  <p className="text-xs text-[var(--ink-muted)]" aria-live="polite">
                    {plannedCount > LIMIT
                      ? `That would be ${plannedCount} variants; a product can have ${LIMIT}.`
                      : plannedCount >= WARN_AT
                        ? `${plannedCount} variants is a lot to keep priced and stocked. Untick values you do not sell.`
                        : chosenAxes.some((a) => a.values.length === 0)
                          ? 'Tick at least one value on each.'
                          : gridMatches
                            ? 'The rows below match these choices.'
                            : 'The rows below no longer match — build them again. Prices already typed are kept.'}
                  </p>
                </div>
                {errors.grid && <p className="text-sm text-[var(--bad)]">{errors.grid}</p>}
              </div>
            )}

            <div className="relative overflow-x-auto">
              <table className="w-full min-w-[46rem] text-left text-sm">
                <thead>
                  <tr className="border-b border-[var(--edge)] text-xs text-[var(--ink-muted)]">
                    <th scope="col" className="py-2 pr-2 font-medium">
                      Variant
                    </th>
                    <th scope="col" className="py-2 pr-2 font-medium">
                      SKU
                    </th>
                    <th scope="col" className="py-2 pr-2 font-medium">
                      Price ({currency})
                    </th>
                    <th scope="col" className="py-2 pr-2 font-medium">
                      Was
                    </th>
                    <th scope="col" className="py-2 pr-2 font-medium">
                      On hand
                    </th>
                    <th scope="col" className="py-2 pr-2 font-medium">
                      Low at
                    </th>
                    <th scope="col" className="py-2 pr-2 font-medium">
                      On sale
                    </th>
                    <th scope="col" className="py-2 font-medium">
                      <span className="sr-only">Remove</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {drafts.map((draft, index) => {
                    const name =
                      draft.axisValues.map((a) => labelFor(a.key, a.value)).join(', ') ||
                      'The item';
                    return (
                      <tr
                        key={draft.id ?? `${fingerprint(draft.axisValues)}-${index}`}
                        className="border-b border-[var(--rule)] align-top last:border-b-0"
                      >
                        <td className="py-2 pr-2 font-medium">{name}</td>
                        <td className="py-2 pr-2">
                          <Cell label={`SKU for ${name}`}>
                            <Input
                              value={draft.sku}
                              onChange={(e) => updateDraft(index, { sku: e.target.value })}
                              placeholder="Made for you"
                              className="h-8 w-36 font-mono text-xs"
                            />
                          </Cell>
                        </td>
                        <td className="py-2 pr-2">
                          <Cell
                            label={`Price for ${name}`}
                            error={errors[`variants.${index}.price`]}
                          >
                            <Input
                              inputMode="decimal"
                              value={draft.price}
                              onChange={(e) => updateDraft(index, { price: e.target.value })}
                              className="h-8 w-24 tabular"
                            />
                          </Cell>
                        </td>
                        <td className="py-2 pr-2">
                          <Cell
                            label={`Former price for ${name}`}
                            error={errors[`variants.${index}.compareAt`]}
                          >
                            <Input
                              inputMode="decimal"
                              value={draft.compareAt}
                              onChange={(e) => updateDraft(index, { compareAt: e.target.value })}
                              className="h-8 w-24 tabular"
                            />
                          </Cell>
                        </td>
                        <td className="py-2 pr-2">
                          <Cell
                            label={`Stock on hand for ${name}`}
                            error={errors[`variants.${index}.onHand`]}
                          >
                            <Input
                              inputMode="numeric"
                              value={draft.onHand}
                              onChange={(e) => updateDraft(index, { onHand: e.target.value })}
                              className="h-8 w-20 tabular"
                            />
                          </Cell>
                          {draft.reserved > 0 && (
                            <span className="mt-1 block text-xs text-[var(--ink-muted)]">
                              {draft.reserved} held for orders
                            </span>
                          )}
                        </td>
                        <td className="py-2 pr-2">
                          <Cell
                            label={`Low stock mark for ${name}`}
                            error={errors[`variants.${index}.lowStockThreshold`]}
                          >
                            <Input
                              inputMode="numeric"
                              value={draft.lowStockThreshold}
                              onChange={(e) =>
                                updateDraft(index, { lowStockThreshold: e.target.value })
                              }
                              className="h-8 w-16 tabular"
                            />
                          </Cell>
                        </td>
                        <td className="py-2 pr-2">
                          <CheckBox
                            checked={draft.status === 'active'}
                            onCheckedChange={(checked) =>
                              updateDraft(index, {
                                status: checked === true ? 'active' : 'inactive',
                              })
                            }
                            aria-label={`${name} is on sale`}
                            className="mt-2"
                          />
                        </td>
                        <td className="py-2 text-right">
                          {drafts.length > 1 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setDrafts((list) => list.filter((_, i) => i !== index))
                              }
                            >
                              Remove
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-[var(--ink-faint)]">
              Stock available to buy is what is on hand less what orders are holding. Lowering stock
              below what is held does not cancel those orders.
            </p>
          </Sheet>

          <Sheet title="Photographs">
            <div className="flex flex-col gap-3">
              {images.map((image, index) => (
                <div key={index} className="flex flex-wrap items-end gap-2">
                  <Field className="min-w-48 grow">
                    <FieldLabel className="text-xs">
                      Cloudinary public id or Unsplash address
                    </FieldLabel>
                    <Input
                      value={image.publicId}
                      className="font-mono text-xs"
                      onChange={(e) =>
                        setImages((list) =>
                          list.map((img, i) =>
                            // A different source is a different photograph: the size, placeholder
                            // and credit belonged to the one it replaces.
                            i === index ? { publicId: e.target.value, alt: img.alt } : img,
                          ),
                        )
                      }
                    />
                  </Field>
                  <Field className="min-w-48 grow">
                    <FieldLabel className="text-xs">Describe the photograph</FieldLabel>
                    <Input
                      value={image.alt}
                      onChange={(e) =>
                        setImages((list) =>
                          list.map((img, i) =>
                            i === index ? { ...img, alt: e.target.value } : img,
                          ),
                        )
                      }
                    />
                  </Field>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setImages((list) => list.filter((_, i) => i !== index))}
                  >
                    Remove
                  </Button>
                  {image.credit && (
                    <p className="basis-full text-xs text-[var(--ink-faint)]">
                      Photo by {image.credit.author} on {image.credit.source}. The credit stays with
                      the photograph and is shown beside it on the product page.
                    </p>
                  )}
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <PhotoUpload
                  onUploaded={(photograph) =>
                    setImages((list) => [...list, { ...photograph, alt: '' }])
                  }
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setImages((list) => [...list, { publicId: '', alt: '' }])}
                >
                  Add by public id
                </Button>
              </div>
              <p className="text-xs text-[var(--ink-faint)]">
                The first is the one on the shelf. The description is read aloud to people who
                cannot see it.
              </p>
            </div>
          </Sheet>
        </div>

        <aside className="flex flex-col gap-6 xl:sticky xl:top-24 xl:self-start">
          <Sheet title="On the shelves?">
            <RadioSet value={status} onValueChange={(v) => setStatus(v as AdminProduct['status'])}>
              <RadioRow value="draft" label="Draft" hint="Only visible here." />
              <RadioRow value="active" label="Live" hint="In the shop and in search." />
              <RadioRow
                value="archived"
                label="Archived"
                hint="Off the shelves; orders keep their record."
              />
            </RadioSet>
            <Button
              type="submit"
              size="lg"
              className="mt-4 w-full"
              disabled={pending || !title.trim()}
            >
              {product ? 'Save product' : 'Add product'}
            </Button>
            {product?.status === 'active' && (
              <Link
                href={`/product/${product.slug}`}
                className="mt-3 block text-center text-sm underline underline-offset-4"
              >
                See it in the shop
              </Link>
            )}
            {Object.keys(errors).length > 0 && (
              <p role="alert" className="mt-3 text-sm text-[var(--bad)]">
                Some fields need attention before this can be saved.
              </p>
            )}
          </Sheet>

          {product && (
            <Sheet title="Another shelf">
              <Field>
                <FieldLabel className="sr-only">Move to</FieldLabel>
                <SelectRoot value={moveTo} onValueChange={setMoveTo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.path}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </SelectRoot>
              </Field>
              <p className="mt-2 text-xs text-[var(--ink-muted)]">
                The new shelf may ask for different facts. Values it does not use are dropped, and
                the product is flagged if it is missing any it needs.
              </p>
              <Button
                type="button"
                variant="outline"
                className="mt-3"
                disabled={pending || moveTo === categoryId}
                onClick={() =>
                  void run(
                    () =>
                      adminSend(`/api/admin/catalog/products/${product._id}/category`, {
                        method: 'POST',
                        body: { categoryId: moveTo },
                      }),
                    { done: 'Moved to another shelf' },
                  )
                }
              >
                Move it
              </Button>
            </Sheet>
          )}

          {product && product.status !== 'archived' && (
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={() =>
                void run(
                  () =>
                    adminSend(`/api/admin/catalog/products/${product._id}`, { method: 'DELETE' }),
                  {
                    done: 'Product archived',
                    description: 'It is off the shelves. Set it live again to bring it back.',
                  },
                )
              }
            >
              Take it off the shelves for good
            </Button>
          )}
        </aside>
      </div>
    </form>
  );
}

function prefix(errors: Record<string, string>, head: string) {
  return Object.fromEntries(
    Object.entries(errors).map(([key, value]) => [`${head}.${key}`, value]),
  );
}

function Cell({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <Field invalid={Boolean(error)}>
      <FieldLabel className="sr-only">{label}</FieldLabel>
      {children}
      <FieldError>{error}</FieldError>
    </Field>
  );
}

/** One control per attribute type. The only place the form knows what types exist. */
function AttributeControl({
  attribute,
  value,
  error,
  onChange,
}: {
  attribute: EffectiveAttribute;
  value: FormValue;
  error?: string;
  onChange: (value: FormValue) => void;
}) {
  const hint = [
    attribute.inheritedFrom ? `From ${attribute.inheritedFrom.name}` : null,
    attribute.description,
  ]
    .filter(Boolean)
    .join('. ');

  const label = (
    <FieldLabel>
      {attribute.label}
      {attribute.unit && (
        <span className="font-normal text-[var(--ink-muted)]"> ({attribute.unit})</span>
      )}
      {attribute.required && (
        <Badge tone="note" className="ml-2 align-middle">
          Required
        </Badge>
      )}
    </FieldLabel>
  );

  switch (attribute.type) {
    case 'select':
    case 'color':
    case 'number': {
      if (attribute.type !== 'number' || attribute.options.length > 0) {
        return (
          <Field invalid={Boolean(error)}>
            {label}
            <SelectRoot
              value={typeof value === 'string' && value ? value : UNSET}
              onValueChange={(next) => onChange(next === UNSET ? undefined : next)}
            >
              <SelectTrigger className="max-w-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNSET}>Not set</SelectItem>
                {attribute.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.swatchHex && (
                      <span
                        aria-hidden
                        className="mr-2 inline-block size-3 rounded-full align-[-1px]"
                        style={{ backgroundColor: option.swatchHex }}
                      />
                    )}
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
            {hint && <FieldHint>{hint}</FieldHint>}
            <FieldError>{error}</FieldError>
          </Field>
        );
      }
      return (
        <Field invalid={Boolean(error)}>
          {label}
          <Input
            type="number"
            value={typeof value === 'string' ? value : ''}
            min={attribute.validation.min}
            max={attribute.validation.max}
            step={attribute.validation.step ?? 'any'}
            onChange={(e) => onChange(e.target.value)}
            className="max-w-40 tabular"
          />
          {hint && <FieldHint>{hint}</FieldHint>}
          <FieldError>{error}</FieldError>
        </Field>
      );
    }

    case 'multiselect': {
      const chosen = Array.isArray(value) ? value : [];
      return (
        <fieldset>
          <legend className="text-sm font-medium">
            {attribute.label}
            {attribute.required && (
              <Badge tone="note" className="ml-2 align-middle">
                Required
              </Badge>
            )}
          </legend>
          <div className="mt-1 flex flex-wrap gap-x-4">
            {attribute.options.map((option) => (
              <CheckRow
                key={option.value}
                label={option.label}
                checked={chosen.includes(option.value)}
                onCheckedChange={(checked) =>
                  onChange(
                    attribute.options
                      .map((o) => o.value)
                      .filter((v) => (v === option.value ? checked === true : chosen.includes(v))),
                  )
                }
              />
            ))}
          </div>
          {hint && <p className="text-xs text-[var(--ink-faint)]">{hint}</p>}
          {error && <p className="text-xs text-[var(--bad)]">{error}</p>}
        </fieldset>
      );
    }

    case 'boolean':
      return (
        <fieldset>
          <legend className="text-sm font-medium">
            {attribute.label}
            {attribute.required && (
              <Badge tone="note" className="ml-2 align-middle">
                Required
              </Badge>
            )}
          </legend>
          <RadioSet
            className="mt-1 flex flex-wrap gap-x-4"
            value={value === true ? 'yes' : value === false ? 'no' : 'unset'}
            onValueChange={(next) =>
              onChange(next === 'yes' ? true : next === 'no' ? false : undefined)
            }
          >
            <RadioRow value="yes" label="Yes" />
            <RadioRow value="no" label="No" />
            <RadioRow value="unset" label="Not said" />
          </RadioSet>
          {error && <p className="text-xs text-[var(--bad)]">{error}</p>}
        </fieldset>
      );

    case 'dimension': {
      const d: DimensionDraft =
        value && typeof value === 'object' && !Array.isArray(value)
          ? value
          : { length: '', width: '', height: '', unit: attribute.unit ?? 'cm' };
      const part = (key: keyof DimensionDraft, text: string) => onChange({ ...d, [key]: text });
      return (
        <fieldset>
          <legend className="text-sm font-medium">{attribute.label}</legend>
          <div className="mt-1 flex flex-wrap items-end gap-2">
            {(['length', 'width', 'height'] as const).map((key) => (
              <Field key={key} className="w-24">
                <FieldLabel className="text-xs capitalize">{key}</FieldLabel>
                <Input
                  inputMode="decimal"
                  value={d[key]}
                  onChange={(e) => part(key, e.target.value)}
                  className="tabular"
                />
              </Field>
            ))}
            <Field className="w-20">
              <FieldLabel className="text-xs">Unit</FieldLabel>
              <Input value={d.unit} onChange={(e) => part('unit', e.target.value)} />
            </Field>
          </div>
          {error && <p className="mt-1 text-xs text-[var(--bad)]">{error}</p>}
        </fieldset>
      );
    }

    default:
      return (
        <Field invalid={Boolean(error)}>
          {label}
          <Input
            value={typeof value === 'string' ? value : ''}
            maxLength={attribute.validation.maxLength}
            onChange={(e) => onChange(e.target.value)}
          />
          {hint && <FieldHint>{hint}</FieldHint>}
          <FieldError>{error}</FieldError>
        </Field>
      );
  }
}
