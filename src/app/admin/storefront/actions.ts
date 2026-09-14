'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { getSession } from '@/lib/auth/session';

/**
 * Tells the front page a new version is live.
 *
 * The page caches for five minutes; publishing should not wait that out. The API cannot
 * reach Next's cache, so the composer calls this after a publish succeeds.
 *
 * A server action is a public endpoint, so it checks the caller is an admin even though the
 * only thing it can do is make the next visitor's page fresher. An endpoint that lets anyone
 * throw away the cache on demand is a cheap way to make the shop do work.
 */
export async function refreshFrontPage(): Promise<void> {
  const session = await getSession();
  if (!session?.account.roles.includes('admin')) return;
  revalidateTag('storefront');
  revalidatePath('/');
}
