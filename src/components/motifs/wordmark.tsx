import { cn } from '@/lib/cn';
import { Mark } from './mark';

/**
 * Mark plus name. WONK is on because at this size Fraunces's alternates are the
 * point — they are what makes the word look cut by hand rather than set by a
 * machine — and because the æ is the most characteristic letter in the name.
 */
export function Wordmark({
  className,
  markClassName,
  showName = true,
}: {
  className?: string;
  markClassName?: string;
  showName?: boolean;
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 text-[var(--ink)]', className)}>
      <Mark className={cn('h-7 w-7', markClassName)} />
      {showName && (
        <span className="wonk font-display text-xl leading-none [--opsz:32] [--wght:600]">
          Hæstore
        </span>
      )}
      {!showName && <span className="sr-only">Hæstore</span>}
    </span>
  );
}
