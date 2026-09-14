'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { TYPE_LABELS } from '@/lib/admin/attribute-rules';
import { plural } from '@/lib/admin/format';
import type { FlatCategory } from '@/lib/admin/tree';
import type {
  AdminCategory,
  AttributeDefinition,
  EffectiveAttribute,
  EffectiveAttributeSet,
} from '@/lib/admin/types';
import { Sheet } from './ledger';
import { useAdminAction } from './console-provider';

const ROOT = '__root';

/** Create a top-level shelf. Beneath the tree, where the tree ends. */
export function NewCategoryForm() {
  const router = useRouter();
  const { run, pending } = useAdminAction();
  const [name, setName] = useState('');

  return (
    <form
      className="flex items-end gap-2"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!name.trim()) return;
        const result = await run(
          () =>
            adminSend<AdminCategory>('/api/admin/catalog/categories', {
              method: 'POST',
              body: { name: name.trim() },
            }),
          { done: 'Shelf added', refresh: false },
        );
        if (result.ok) {
          setName('');
          router.push(`/admin/catalog/categories?id=${result.value._id}`);
          router.refresh();
        }
      }}
    >
      <Field className="grow">
        <FieldLabel className="text-xs">New top-level shelf</FieldLabel>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Textiles" />
      </Field>
      <Button type="submit" variant="outline" disabled={pending || !name.trim()}>
        Add
      </Button>
    </form>
  );
}

export function CategoryEditor({
  category,
  effective,
  definitions,
  moveOptions,
  parentName,
}: {
  category: AdminCategory & { childCount: number };
  effective: EffectiveAttributeSet;
  definitions: AttributeDefinition[];
  moveOptions: FlatCategory[];
  parentName: string | null;
}) {
  const router = useRouter();
  const { run, pending } = useAdminAction();
  const base = `/api/admin/catalog/categories/${category._id}`;

  const [name, setName] = useState(category.name);
  const [slug, setSlug] = useState(category.slug);
  const [description, setDescription] = useState(category.description ?? '');
  const [status, setStatus] = useState(category.status);
  const [mode, setMode] = useState(category.validationMode);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [bindId, setBindId] = useState('');
  const [bindRequired, setBindRequired] = useState(false);
  const [bindGroup, setBindGroup] = useState('');
  const [childName, setChildName] = useState('');
  const [parent, setParent] = useState(category.parent ?? ROOT);

  const effectiveKeys = new Set(effective.attributes.map((a) => a.key));
  const bindable = definitions.filter((d) => !d.archivedAt && !effectiveKeys.has(d.key));
  const suppressedHere = category.suppressedKeys;
  const labelOfKey = (key: string) => definitions.find((d) => d.key === key)?.label ?? key;

  async function saveDetails() {
    setErrors({});
    await run(
      () =>
        adminSend(base, {
          method: 'PATCH',
          body: {
            name: name.trim(),
            slug: slug.trim(),
            description: description.trim(),
            status,
            validationMode: mode,
          },
        }),
      {
        done: 'Shelf saved',
        description:
          slug.trim() !== category.slug
            ? 'Its address changed, and so did every shelf beneath it.'
            : undefined,
        onError: (error) => {
          setErrors(fieldErrors(error));
          return false;
        },
      },
    );
  }

  const setSuppressed = (keys: string[], done: string) =>
    run(() => adminSend(`${base}/suppressed`, { method: 'PUT', body: { keys } }), { done });

  const bind = (defId: string, required: boolean, group: string, done: string) =>
    run(
      () =>
        adminSend(`${base}/attributes`, {
          method: 'POST',
          body: {
            defId,
            required,
            order: effective.attributes.length,
            ...(group.trim() ? { group: group.trim() } : {}),
          },
        }),
      { done },
    );

  return (
    <div className="flex min-w-0 flex-col gap-6">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl [--opsz:36] [--wght:600]">{category.name}</h2>
          <p className="text-sm text-[var(--ink-muted)]">
            {parentName ? `Inside ${parentName}` : 'A top-level shelf'},{' '}
            {plural(category.childCount, 'shelf', 'shelves')} beneath it.{' '}
            <Link
              href={`/admin/catalog/products?categoryId=${category._id}`}
              className="underline decoration-[var(--rule)] underline-offset-4 hover:text-[var(--ink)]"
            >
              Its products
            </Link>
          </p>
        </div>
        {category.status === 'active' && (
          <Link
            href={`/shop/${category.path}`}
            className="text-sm underline decoration-[var(--rule)] underline-offset-4"
          >
            See it in the shop
          </Link>
        )}
      </div>

      <Sheet title="What products here carry">
        {effective.attributes.length === 0 ? (
          <p className="text-sm text-[var(--ink-muted)]">
            Nothing yet. Products on this shelf have a title, a price and nothing else — bind an
            attribute below.
          </p>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--edge)] text-xs text-[var(--ink-muted)]">
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Attribute
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Set by
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Required
                  </th>
                  <th scope="col" className="py-2 pr-3 font-medium">
                    Group
                  </th>
                  <th scope="col" className="py-2 font-medium">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {effective.attributes.map((attribute) => (
                  <BindingRow
                    key={attribute.key}
                    attribute={attribute}
                    pending={pending}
                    onSave={(required, group) =>
                      bind(attribute.defId, required, group, `${attribute.label} updated`)
                    }
                    onUnbind={() =>
                      run(
                        () =>
                          adminSend(`${base}/attributes/${attribute.key}`, { method: 'DELETE' }),
                        {
                          done: `${attribute.label} unbound`,
                        },
                      )
                    }
                    onHide={() =>
                      setSuppressed(
                        [...suppressedHere, attribute.key],
                        `${attribute.label} hidden on this shelf`,
                      )
                    }
                    onOverride={() =>
                      bind(
                        attribute.defId,
                        attribute.required,
                        attribute.group ?? '',
                        `${attribute.label} set here`,
                      )
                    }
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {suppressedHere.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-[var(--ink-muted)]">Hidden here:</span>
            {suppressedHere.map((key) => (
              <span
                key={key}
                className="inline-flex items-center gap-1 rounded-sm border border-[var(--edge)] px-2 py-0.5"
              >
                {labelOfKey(key)}
                <Button
                  variant="link"
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    void setSuppressed(
                      suppressedHere.filter((k) => k !== key),
                      `${labelOfKey(key)} shown again`,
                    )
                  }
                >
                  Show again
                </Button>
              </span>
            ))}
          </div>
        )}

        <form
          className="mt-5 flex flex-wrap items-end gap-3 border-t border-[var(--rule)] pt-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!bindId) return;
            const label = definitions.find((d) => d._id === bindId)?.label ?? 'Attribute';
            const result = await bind(bindId, bindRequired, bindGroup, `${label} bound`);
            if (result.ok) {
              setBindId('');
              setBindGroup('');
              setBindRequired(false);
            }
          }}
        >
          <Field className="min-w-48 grow">
            <FieldLabel>Bind an attribute</FieldLabel>
            <SelectRoot value={bindId} onValueChange={setBindId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={bindable.length ? 'Choose…' : 'Every attribute is already here'}
                />
              </SelectTrigger>
              <SelectContent>
                {bindable.map((d) => (
                  <SelectItem key={d._id} value={d._id}>
                    {d.label} — {TYPE_LABELS[d.type].label.toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </SelectRoot>
          </Field>
          <Field className="w-40">
            <FieldLabel>Group</FieldLabel>
            <Input
              value={bindGroup}
              onChange={(e) => setBindGroup(e.target.value)}
              placeholder="Origin"
            />
          </Field>
          <CheckRow
            label="Required"
            checked={bindRequired}
            onCheckedChange={(checked) => setBindRequired(checked === true)}
          />
          <Button type="submit" disabled={pending || !bindId}>
            Bind
          </Button>
        </form>
        <p className="mt-2 text-xs text-[var(--ink-faint)]">
          Not listed?{' '}
          <Link href="/admin/catalog/attributes/new" className="underline underline-offset-4">
            Define a new attribute
          </Link>
          .
        </p>
      </Sheet>

      <Sheet title="Details">
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void saveDetails();
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field invalid={Boolean(errors.name)}>
              <FieldLabel>Name</FieldLabel>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
              <FieldError>{errors.name}</FieldError>
            </Field>
            <Field invalid={Boolean(errors.slug)}>
              <FieldLabel>Address</FieldLabel>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} className="font-mono" />
              <FieldHint>
                /shop/
                {category.path
                  .split('/')
                  .slice(0, -1)
                  .concat(slug || '…')
                  .join('/')}
              </FieldHint>
              <FieldError>{errors.slug}</FieldError>
            </Field>
          </div>
          <Field>
            <FieldLabel>Description</FieldLabel>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-16"
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <fieldset>
              <legend className="mb-1 text-sm font-medium">Visibility</legend>
              <RadioSet value={status} onValueChange={(v) => setStatus(v as typeof status)}>
                <RadioRow value="active" label="In the shop" />
                <RadioRow value="hidden" label="Hidden" hint="Not in the navigation or listings." />
              </RadioSet>
            </fieldset>
            <fieldset>
              <legend className="mb-1 text-sm font-medium">When a required fact is missing</legend>
              <RadioSet value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
                <RadioRow
                  value="lenient"
                  label="Flag the product"
                  hint="It stays on sale and is listed under Needs attention."
                />
                <RadioRow
                  value="strict"
                  label="Refuse to save it"
                  hint="Safer, but adding a required attribute blocks editing every existing product."
                />
              </RadioSet>
            </fieldset>
          </div>

          <Button type="submit" disabled={pending} className="self-start">
            Save details
          </Button>
        </form>
      </Sheet>

      <div className="grid gap-6 md:grid-cols-2">
        <Sheet title="Shelves beneath">
          <form
            className="flex items-end gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!childName.trim()) return;
              const result = await run(
                () =>
                  adminSend<AdminCategory>('/api/admin/catalog/categories', {
                    method: 'POST',
                    body: { name: childName.trim(), parent: category._id },
                  }),
                { done: 'Shelf added', refresh: false },
              );
              if (result.ok) {
                setChildName('');
                router.push(`/admin/catalog/categories?id=${result.value._id}`);
                router.refresh();
              }
            }}
          >
            <Field className="grow">
              <FieldLabel>New shelf inside {category.name}</FieldLabel>
              <Input value={childName} onChange={(e) => setChildName(e.target.value)} />
            </Field>
            <Button type="submit" variant="outline" disabled={pending || !childName.trim()}>
              Add
            </Button>
          </form>
        </Sheet>

        <Sheet title="Move or remove">
          <div className="flex flex-col gap-4">
            <div className="flex items-end gap-2">
              <Field className="grow">
                <FieldLabel>Put it inside</FieldLabel>
                <SelectRoot value={parent} onValueChange={setParent}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ROOT}>The top level</SelectItem>
                    {moveOptions.map((option) => (
                      <SelectItem key={option._id} value={option._id}>
                        {'  '.repeat(option.depth)}
                        {option.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </SelectRoot>
              </Field>
              <Button
                variant="outline"
                disabled={pending || parent === (category.parent ?? ROOT)}
                onClick={() =>
                  void run(
                    () =>
                      adminSend(`${base}/move`, {
                        method: 'POST',
                        body: { parent: parent === ROOT ? null : parent },
                      }),
                    { done: 'Shelf moved', description: 'Its products moved with it.' },
                  )
                }
              >
                Move
              </Button>
            </div>

            <div className="border-t border-[var(--rule)] pt-3">
              <Button
                variant="danger"
                disabled={pending}
                onClick={async () => {
                  const result = await run(() => adminSend(base, { method: 'DELETE' }), {
                    done: `${category.name} deleted`,
                    refresh: false,
                  });
                  if (result.ok) {
                    router.push('/admin/catalog/categories');
                    router.refresh();
                  }
                }}
              >
                Delete shelf
              </Button>
              <p className="mt-2 text-xs text-[var(--ink-faint)]">
                Only an empty shelf can be deleted: move its products and the shelves inside it
                first. You may be asked to confirm it’s you.
              </p>
            </div>
          </div>
        </Sheet>
      </div>
    </div>
  );
}

function BindingRow({
  attribute,
  pending,
  onSave,
  onUnbind,
  onHide,
  onOverride,
}: {
  attribute: EffectiveAttribute;
  pending: boolean;
  onSave: (required: boolean, group: string) => Promise<unknown>;
  onUnbind: () => Promise<unknown>;
  onHide: () => Promise<unknown>;
  onOverride: () => Promise<unknown>;
}) {
  const local = attribute.inheritedFrom === null;
  const [required, setRequired] = useState(attribute.required);
  const [group, setGroup] = useState(attribute.group ?? '');
  const dirty = required !== attribute.required || group !== (attribute.group ?? '');

  return (
    <tr className="border-b border-[var(--rule)] align-middle last:border-b-0">
      <td className="py-2 pr-3">
        <span className="font-medium">{attribute.label}</span>
        <span className="block text-xs text-[var(--ink-muted)]">
          {TYPE_LABELS[attribute.type].label}
          {attribute.isFilterable && ', a filter'}
          {attribute.isAxisEligible && ', can split variants'}
        </span>
      </td>
      <td className="py-2 pr-3">
        {local ? (
          <Badge tone="note">This shelf</Badge>
        ) : (
          <span className="text-[var(--ink-muted)]">{attribute.inheritedFrom?.name}</span>
        )}
      </td>
      <td className="py-2 pr-3">
        {local ? (
          <CheckBox
            checked={required}
            onCheckedChange={(checked) => setRequired(checked === true)}
            aria-label={`${attribute.label} is required`}
          />
        ) : (
          <span className="text-[var(--ink-muted)]">{attribute.required ? 'Yes' : 'No'}</span>
        )}
      </td>
      <td className="py-2 pr-3">
        {local ? (
          <Field>
            <FieldLabel className="sr-only">Group for {attribute.label}</FieldLabel>
            <Input value={group} onChange={(e) => setGroup(e.target.value)} className="h-8 w-28" />
          </Field>
        ) : (
          <span className="text-[var(--ink-muted)]">{attribute.group ?? '—'}</span>
        )}
      </td>
      <td className="py-2 text-right whitespace-nowrap">
        {local ? (
          <>
            {dirty && (
              <Button size="sm" disabled={pending} onClick={() => void onSave(required, group)}>
                Save
              </Button>
            )}
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => void onUnbind()}>
              Unbind
            </Button>
          </>
        ) : (
          <>
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => void onOverride()}>
              Set here
            </Button>
            <Button size="sm" variant="ghost" disabled={pending} onClick={() => void onHide()}>
              Hide here
            </Button>
          </>
        )}
      </td>
    </tr>
  );
}
