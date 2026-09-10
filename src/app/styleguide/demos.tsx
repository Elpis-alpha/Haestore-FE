'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { CheckRow, RadioRow, RadioSet, Toggle } from '@/components/ui/choice';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DrawerContent,
} from '@/components/ui/dialog';
import { Field, FieldError, FieldHint, FieldLabel } from '@/components/ui/field';
import { Input, Textarea } from '@/components/ui/input';
import { QuantityStepper } from '@/components/ui/quantity';
import {
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Toast, ToastProvider, ToastViewport } from '@/components/ui/toast';
import {
  TooltipContent,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/** The filter panel's real shape: an attribute group with counts. */
export function FilterDemo() {
  const [roasts, setRoasts] = useState<string[]>(['medium']);
  const toggle = (v: string) =>
    setRoasts((r) => (r.includes(v) ? r.filter((x) => x !== v) : [...r, v]));

  return (
    <div className="flex max-w-64 flex-col">
      {[
        ['light', 'Light', 8],
        ['medium', 'Medium', 14],
        ['dark', 'Dark', 6],
        ['decaf', 'Decaf', 0],
      ].map(([value, label, count]) => (
        <CheckRow
          key={value as string}
          label={label as string}
          count={count as number}
          checked={roasts.includes(value as string)}
          onCheckedChange={() => toggle(value as string)}
          disabled={count === 0}
        />
      ))}
    </div>
  );
}

export function FormDemo() {
  const [email, setEmail] = useState('not-an-address');
  const invalid = !email.includes('@');
  return (
    <div className="flex max-w-sm flex-col gap-4">
      <Field>
        <FieldLabel>Email</FieldLabel>
        <Input type="email" placeholder="you@example.com" defaultValue="" />
        <FieldHint>We send a six-digit code. There is no password to forget.</FieldHint>
      </Field>

      <Field invalid={invalid}>
        <FieldLabel>Email, with an error</FieldLabel>
        <Input value={email} onChange={(e) => setEmail(e.target.value)} />
        <FieldError>{invalid ? 'That address is missing an @.' : null}</FieldError>
      </Field>

      <Field>
        <FieldLabel>Sort by</FieldLabel>
        <SelectRoot defaultValue="relevance">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Relevance</SelectItem>
            <SelectItem value="price_asc">Price, low to high</SelectItem>
            <SelectItem value="price_desc">Price, high to low</SelectItem>
            <SelectItem value="newest">Recently added</SelectItem>
          </SelectContent>
        </SelectRoot>
      </Field>

      <Field>
        <FieldLabel>Gift note</FieldLabel>
        <Textarea placeholder="Written on the packing slip by hand." />
      </Field>
    </div>
  );
}

export function ChoiceDemo() {
  const [grind, setGrind] = useState('whole');
  const [gift, setGift] = useState(true);
  return (
    <div className="flex flex-col gap-5">
      <RadioSet value={grind} onValueChange={setGrind} className="flex flex-col">
        <RadioRow value="whole" label="Whole bean" hint="Keeps its aroma for weeks" />
        <RadioRow value="filter" label="Ground for filter" />
        <RadioRow value="espresso" label="Ground for espresso" />
      </RadioSet>
      <label className="flex cursor-pointer items-center gap-3 text-sm">
        <Toggle checked={gift} onCheckedChange={setGift} />
        Wrap as a gift
      </label>
    </div>
  );
}

export function QuantityDemo() {
  const [qty, setQty] = useState(2);
  return <QuantityStepper value={qty} onValueChange={setQty} max={12} />;
}

export function OverlayDemo() {
  const [toastOpen, setToastOpen] = useState(false);
  return (
    <TooltipProvider delayDuration={200}>
      <ToastProvider swipeDirection="right">
        <div className="flex flex-wrap items-center gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open a dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Remove the Yirgacheffe?</DialogTitle>
                <DialogDescription>
                  It goes back to the shelf. Nothing is charged either way.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="ghost">Keep it</Button>
                <Button variant="danger">Remove</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open the drawer</Button>
            </DialogTrigger>
            <DrawerContent aria-describedby={undefined}>
              <div className="flex flex-col gap-1.5 p-6 pr-14">
                <DialogTitle>Your basket</DialogTitle>
                <p className="text-sm text-[var(--ink-muted)]">
                  This is the shape the cart takes in Phase 6.
                </p>
              </div>
            </DrawerContent>
          </Dialog>

          <TooltipRoot>
            <TooltipTrigger asChild>
              <Button variant="ghost">Hover me</Button>
            </TooltipTrigger>
            <TooltipContent>Roasted to order, shipped within two days.</TooltipContent>
          </TooltipRoot>

          <Button variant="outline" onClick={() => setToastOpen(true)}>
            Raise a toast
          </Button>
        </div>

        <Toast
          open={toastOpen}
          onOpenChange={setToastOpen}
          title="Added to your basket"
          description="Yirgacheffe, whole bean, 250 g"
        />
        <ToastViewport />
      </ToastProvider>
    </TooltipProvider>
  );
}
