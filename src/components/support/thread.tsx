import { cn } from '@/lib/cn';

const timeFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

export type ThreadMessage = {
  id: string;
  from: 'customer' | 'shop';
  body: string;
  at: string;
  /** Shown in the console only. */
  byline?: string;
};

/**
 * A conversation, in order, as a list of messages.
 *
 * The same component on both sides of the counter, which differ only in whose messages are
 * "you". The shop's messages are paper and the customer's sit in the well — Phase 1's two
 * surfaces meaning what they always mean — so the two voices are distinguishable without
 * reading the names, and the names are there for anyone who cannot see the difference.
 */
export function Thread({
  messages,
  viewer,
}: {
  messages: ThreadMessage[];
  viewer: 'customer' | 'shop';
}) {
  return (
    <ol className="flex flex-col gap-4">
      {messages.map((message) => {
        const mine = message.from === viewer;
        const who =
          message.from === 'shop'
            ? viewer === 'shop'
              ? (message.byline ?? 'The shop')
              : 'Hæstore'
            : viewer === 'customer'
              ? 'You'
              : (message.byline ?? 'The customer');

        return (
          <li
            key={message.id}
            className={cn(
              'flex flex-col gap-2 rounded-md border border-[var(--edge)] p-4 sm:max-w-[85%]',
              message.from === 'shop' ? 'surface-paper' : 'surface-well',
              mine ? 'sm:self-end' : 'sm:self-start',
            )}
          >
            <p className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 text-xs">
              <span className="font-medium text-[var(--ink)]">{who}</span>
              <time dateTime={message.at} className="text-[var(--ink-faint)]">
                {timeFormat.format(new Date(message.at))}
              </time>
            </p>
            <p className="text-sm leading-relaxed break-words whitespace-pre-line text-[var(--ink)]">
              {message.body}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
