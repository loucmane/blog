import { headers } from 'next/headers'

import { AccountActions } from '@/components/owner/account-actions'
import { requireOwnerSession } from '@/server/owner/session'

export const dynamic = 'force-dynamic'

export default async function OwnerAccountPage() {
  const session = await requireOwnerSession(new Headers(await headers()))
  return (
    <div className="mx-auto max-w-xl rounded-xl border border-border bg-card p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Account</p>
      <h1 className="mt-2 text-4xl font-semibold">Sign-in and recovery</h1>
      <dl className="my-6 grid gap-2 rounded-lg bg-muted p-4 text-sm">
        <div>
          <dt className="font-semibold">Name</dt>
          <dd>{session.name}</dd>
        </div>
        <div>
          <dt className="font-semibold">Email</dt>
          <dd>{session.email}</dd>
        </div>
      </dl>
      <p className="mb-4 text-sm text-muted-foreground">
        Add a passkey on another trusted device before removing access from your current device.
      </p>
      <AccountActions />
    </div>
  )
}
