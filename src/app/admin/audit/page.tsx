import type { Metadata } from 'next';
import { adminRead, queryOf } from '@/lib/admin/server';
import type { AuditEntry, Paged } from '@/lib/admin/types';
import { formatDateTime } from '@/lib/admin/format';
import {
  Empty,
  Ledger,
  LedgerHead,
  PageHeader,
  Pager,
  cellClass,
  rowClass,
} from '@/components/admin/ledger';

export const metadata: Metadata = { title: 'Audit log' };

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const VERBS: Record<string, string> = {
  POST: 'Did',
  PUT: 'Replaced',
  PATCH: 'Edited',
  DELETE: 'Removed',
};

/**
 * Every admin change that went through, newest first.
 *
 * The route pattern is shown as the code it is — `/api/admin/orders/:id/status` — because
 * that is the most precise name the action has and the one a developer reading the log will
 * search for. It is the one place the console uses the monospace face.
 */
export default async function AdminAuditPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { data: entries, page } = await adminRead<Paged<AuditEntry>>(
    `/api/admin/audit${queryOf(params, ['targetId', 'page'])}`,
    '/admin/audit',
  );

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Every change made from this console that succeeded, with who made it. Refused requests are in the server log under the same request id."
      />

      {entries.length === 0 ? (
        <Empty>No admin changes have been made yet.</Empty>
      ) : (
        <Ledger>
          <LedgerHead
            columns={[
              { label: 'When' },
              { label: 'Who' },
              { label: 'Action' },
              { label: 'Target' },
            ]}
          />
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id} className={rowClass}>
                <td className={`${cellClass} whitespace-nowrap text-[var(--ink-muted)]`}>
                  {formatDateTime(entry.at)}
                </td>
                <td className={`${cellClass} break-all`}>{entry.actor.email}</td>
                <td className={cellClass}>
                  <span className="text-[var(--ink-muted)]">
                    {VERBS[entry.method] ?? entry.method}
                  </span>{' '}
                  <code className="font-mono text-xs break-all">
                    {entry.route.replace(/^\/api\/admin/, '')}
                  </code>
                </td>
                <td className={`${cellClass} font-mono text-xs break-all text-[var(--ink-muted)]`}>
                  {entry.targetId ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </Ledger>
      )}

      <Pager
        page={page.page}
        totalPages={page.totalPages}
        total={page.total}
        basePath="/admin/audit"
        params={{ targetId: Array.isArray(params.targetId) ? params.targetId[0] : params.targetId }}
      />
    </>
  );
}
