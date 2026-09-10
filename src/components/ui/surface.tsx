import { cn } from '@/lib/cn';

/**
 * A region that re-points ink, edges and focus for everything inside it.
 *
 * This is the system's one structural idea. A component never asks "am I on a dark
 * background?" — it reads --ink and --edge, and the nearest Surface has already
 * answered. Nesting works: a paper card inside a well inside the ground.
 */
const tones = {
  ground: 'surface-ground',
  raised: 'surface-raised',
  well: 'surface-well',
  paper: 'surface-paper',
} as const;

export type SurfaceTone = keyof typeof tones;

export function Surface<T extends React.ElementType = 'div'>({
  as,
  tone = 'ground',
  className,
  ...props
}: { as?: T; tone?: SurfaceTone } & Omit<React.ComponentPropsWithoutRef<T>, 'as' | 'tone'>) {
  const Component = (as ?? 'div') as React.ElementType;
  return <Component className={cn(tones[tone], className)} {...props} />;
}
