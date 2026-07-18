import Link from 'next/link'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { resolveOwnerSession } from '@/server/owner/session'

export const dynamic = 'force-dynamic'

export default async function OwnerWorkspaceLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  const session = await resolveOwnerSession(new Headers(await headers())).catch(() => null)
  if (!session) redirect('/owner/sign-in')

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-4">
          <Link className="font-serif text-2xl font-semibold text-primary" href="/owner">
            Magazine workspace
          </Link>
          <nav
            aria-label="Owner workspace"
            className="flex items-center gap-2 text-sm font-semibold"
          >
            <Link className="min-h-11 rounded-md px-3 py-3 hover:bg-muted" href="/owner">
              Stories
            </Link>
            <Link
              className="min-h-11 rounded-md px-3 py-3 hover:bg-muted"
              href="/owner/stories/new"
            >
              New story
            </Link>
            <Link className="min-h-11 rounded-md px-3 py-3 hover:bg-muted" href="/owner/account">
              Account
            </Link>
          </nav>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
      <footer className="container mx-auto px-4 pb-8 text-sm text-muted-foreground">
        Signed in as {session.email}
      </footer>
    </div>
  )
}
