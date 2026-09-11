'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { formatMoney } from '@/lib/money';
import { describeChange, type MergeReport } from '@/lib/cart/types';
import * as api from '@/lib/cart/client';
import { useCart } from './cart-provider';

/**
 * "We combined your bags."
 *
 * This exists because the merge takes MAX on a quantity collision rather than SUM, and
 * MAX is right for the common case and wrong for the rare one — two devices, 2 and 3,
 * wanting 5. The report is what makes the rare case recoverable: both numbers are on
 * screen, so the fix is one edit rather than a support email.
 *
 * Undo is the blunter repair, for somebody who did not want the merge at all. It
 * restores the account's own lines, which does discard what the guest bag contributed;
 * that is what undoing a merge means, and the rows above it are the reason it is rarely
 * the right button.
 *
 * Fetched here rather than handed over by the sign-in response, because the response to
 * a verify call is about to be replaced by a navigation — a report attached to it is a
 * report nobody reads.
 */
export function MergeReportPanel() {
  const { refresh } = useCart();
  const [report, setReport] = useState<MergeReport | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // The cookie is the gate. Without it this fetched on every visit to the cart page,
    // which is a 401 in the console for every signed-out shopper and a round trip for
    // every signed-in one to be told "no". See `hasMergeReport`.
    if (!api.hasMergeReport()) return;

    let live = true;
    void api
      .readMergeReport()
      .then((found) => {
        // Nothing changed is not worth a panel. The backend already withholds a report
        // for a straight reassignment; this covers the merge that touched nothing.
        if (live && found && found.rows.length > 0) setReport(found);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  if (!report) return null;

  async function dismiss() {
    setBusy(true);
    setReport(null);
    await api.dismissMergeReport().catch(() => undefined);
    setBusy(false);
  }

  async function undo() {
    setBusy(true);
    try {
      await api.undoMerge();
      await refresh();
      setReport(null);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="surface-raised rounded-md p-5">
      <h2 className="font-display text-lg [--opsz:24] [--wght:600]">We combined your bags</h2>
      <p className="mt-1 text-sm text-[var(--ink-muted)]">
        You had things in a bag before signing in. Here is what changed — where you had the same
        item twice, we kept the larger quantity rather than adding them together.
      </p>

      <ul className="mt-4 flex flex-col gap-2">
        {report.rows.map((row) => (
          <li key={row.lineKey} className="text-sm">
            <span className="font-medium">{row.title}</span>
            {row.axisValues.length > 0 && (
              <span className="text-[var(--ink-muted)]">
                {' '}
                ({row.axisValues.map((a) => a.value).join(' · ')})
              </span>
            )}
            <ul className="mt-0.5 flex flex-col gap-0.5">
              {row.changes.map((change, index) => (
                <li key={`${change.kind}-${index}`} className="text-xs text-[var(--ink-muted)]">
                  {describeChange(change, formatMoney)}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap gap-3">
        <Button size="sm" disabled={busy} onClick={() => void dismiss()}>
          Looks right
        </Button>
        {report.undoableUntil && (
          <Button variant="outline" size="sm" disabled={busy} onClick={() => void undo()}>
            Undo the merge
          </Button>
        )}
      </div>
    </section>
  );
}
