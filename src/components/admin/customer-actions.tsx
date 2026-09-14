'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { adminSend } from '@/lib/admin/client';
import { useAdminAction } from './console-provider';

type Pending = 'revoke' | 'grant' | 'remove' | null;

/**
 * What an admin can do to someone's access.
 *
 * Every button that the server would refuse is explained in place instead of offered: you
 * cannot change your own role, and an address on ADMIN_EMAILS would be made an admin again
 * at its next sign-in. A disabled button with a reason is honest; a button that produces a
 * 400 is not.
 */
export function CustomerActions({
  customerId,
  email,
  admin,
  self,
  bootstrapAdmin,
  activeSessions,
}: {
  customerId: string;
  email: string;
  admin: boolean;
  self: boolean;
  bootstrapAdmin: boolean;
  activeSessions: number;
}) {
  const { run, pending } = useAdminAction();
  const [confirming, setConfirming] = useState<Pending>(null);

  if (self) {
    return (
      <p className="text-sm text-[var(--ink-muted)]">
        This is your own account. Manage your devices from your account page; another admin has to
        change your role.
      </p>
    );
  }

  async function confirm() {
    const action = confirming;
    setConfirming(null);
    if (action === 'revoke') {
      await run(
        () => adminSend(`/api/admin/customers/${customerId}/revoke-sessions`, { method: 'POST' }),
        { done: 'Signed out everywhere' },
      );
    } else if (action === 'grant' || action === 'remove') {
      await run(
        () =>
          adminSend(`/api/admin/customers/${customerId}/roles`, {
            method: 'PUT',
            body: { admin: action === 'grant' },
          }),
        { done: action === 'grant' ? 'Made an admin' : 'Admin role removed' },
      );
    }
  }

  const copy: Record<Exclude<Pending, null>, { title: string; body: string; button: string }> = {
    revoke: {
      title: 'Sign out everywhere',
      body: `${email} will be signed out on every device at once, and has to sign in again with a code. Use this for a lost phone or a shared computer.`,
      button: 'Sign them out',
    },
    grant: {
      title: 'Make an admin',
      body: `${email} will be able to change the catalogue, the front page, orders and other people’s access. They are signed out everywhere now and become an admin at their next sign-in.`,
      button: 'Make admin',
    },
    remove: {
      title: 'Remove admin role',
      body: `${email} loses the console immediately and is signed out on every device.`,
      button: 'Remove role',
    },
  };

  return (
    <div className="flex flex-col gap-3">
      <Button
        variant="outline"
        disabled={pending || activeSessions === 0}
        onClick={() => setConfirming('revoke')}
      >
        Sign out everywhere
      </Button>

      {admin ? (
        bootstrapAdmin ? (
          <p className="text-xs text-[var(--ink-muted)]">
            This address is in ADMIN_EMAILS, so it is made an admin at every sign-in. Remove it from
            the server’s environment to take the role away.
          </p>
        ) : (
          <Button variant="danger" disabled={pending} onClick={() => setConfirming('remove')}>
            Remove admin role
          </Button>
        )
      ) : (
        <Button variant="outline" disabled={pending} onClick={() => setConfirming('grant')}>
          Make an admin
        </Button>
      )}

      <Dialog open={confirming !== null} onOpenChange={(open) => !open && setConfirming(null)}>
        <DialogContent>
          {confirming && (
            <>
              <DialogHeader>
                <DialogTitle>{copy[confirming].title}</DialogTitle>
                <DialogDescription>{copy[confirming].body}</DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setConfirming(null)}>
                  Not now
                </Button>
                <Button
                  variant={confirming === 'remove' ? 'danger' : 'primary'}
                  onClick={() => void confirm()}
                >
                  {copy[confirming].button}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
