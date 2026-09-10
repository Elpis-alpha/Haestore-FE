import * as React from 'react';

/**
 * The product image, carried from the card into the product page.
 *
 * This preserves the best idea in the 2022 frontend, which measured the clicked card's
 * `getBoundingClientRect()` and fed it to the modal's `transform-origin` so the detail
 * view grew out of the exact card clicked. The browser now does that natively and
 * correctly — including the aspect-ratio change from a card crop to a full image, which
 * the hand-rolled version could not do — so what was 60 lines of measurement is a name.
 *
 * **A name must be unique on the page.** Two elements claiming `product-guji-natural`
 * at once is not a nicer animation, it is a broken transition. So the grid names its
 * cards and the product page names its hero, and a card rendered anywhere the hero is
 * also visible — the "more from this shelf" row — is rendered without a name. That is
 * why the name is a prop rather than derived from the slug inside the card.
 */

type ViewTransitionComponent = React.ExoticComponent<React.ViewTransitionProps>;

/**
 * Resolved at runtime, under both spellings, because the two Reacts in play disagree.
 *
 * `experimental.viewTransition` makes Next alias `react` to its own bundled experimental
 * build, which exports `unstable_ViewTransition`; the installed React 19.3 and its types
 * call the same component `ViewTransition`. Importing either name directly fails against
 * the other — a build-time "not exported from 'react'" against Next's build, or a
 * missing export the day the prefix is dropped.
 *
 * So it is looked up rather than imported, and when neither name is there the component
 * renders its children and nothing animates. That is also the honest behaviour for a
 * browser without View Transitions and for a visitor who has asked for reduced motion:
 * the fallback is no animation, never a broken one.
 */
// Through a variable, not off the namespace directly: reading `React.ViewTransition`
// inline makes the bundler trace it as a named import and warn that the build it aliased
// in has no such export — which is precisely the case this lookup exists to survive.
const runtime: Record<string, unknown> = React;
const ViewTransition = (runtime.unstable_ViewTransition ?? runtime.ViewTransition) as
  ViewTransitionComponent | undefined;

export function SharedElement({
  name,
  children,
}: {
  /** Omit to opt this instance out — see above. */
  name?: string;
  children: React.ReactNode;
}) {
  if (!name || !ViewTransition) return <>{children}</>;
  return <ViewTransition name={name}>{children}</ViewTransition>;
}

export function productTransitionName(slug: string): string {
  return `product-${slug}`;
}
