import type { Metadata } from 'next';
import Link from 'next/link';
import { adminRead } from '@/lib/admin/server';
import type { StorefrontPreview } from '@/lib/admin/types';
import { StorefrontSections } from '@/components/storefront/sections';

export const metadata: Metadata = { title: 'Preview' };

type PageProps = { params: Promise<{ version: string }> };

/**
 * A version rendered by the storefront's own renderer, resolved by the storefront's own
 * resolver — so what is seen here is what publishing would put on the front page, down to
 * which archived products would silently drop out. Those are listed above the page.
 */
export default async function StorefrontPreviewPage({ params }: PageProps) {
  const { version } = await params;
  const { data } = await adminRead<{ data: StorefrontPreview }>(
    `/api/admin/storefront/home/versions/${encodeURIComponent(version)}/preview`,
    `/admin/storefront/preview/${version}`,
  );
  const status = { draft: 'the draft', published: 'live now', retired: 'an earlier version' }[
    data.version.status
  ];

  return (
    <>
      <div className="surface-paper mb-8 flex flex-col gap-2 rounded-md border border-[var(--edge)] p-4 text-sm">
        <p>
          <span className="font-medium">Preview of version {data.version.version}</span>, {status}.{' '}
          {data.version.status !== 'published' && 'Nothing here is on the front page yet.'}{' '}
          <Link href="/admin/storefront" className="underline underline-offset-4">
            Back to the composer
          </Link>
        </p>
        {data.warnings.length > 0 && (
          <ul className="list-disc pl-5 text-[var(--bad)]">
            {data.warnings.map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="-mx-4 overflow-hidden rounded-lg border border-[var(--rule)] sm:mx-0">
        <StorefrontSections sections={data.sections} />
      </div>
    </>
  );
}
