import Link from 'next/link'
import { notFound } from 'next/navigation'

import { OwnerSetupForm } from '@/components/owner/setup-form'
import { ownerSetupPageState } from '@/server/owner/setup'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const metadata = { title: 'Create your password', referrer: 'no-referrer' as const }

export default async function OwnerSetupPage() {
  const state = await ownerSetupPageState().catch(() => null)
  if (!state) notFound()
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      {state.ready ? (
        <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg md:p-8">
          <h1 className="text-4xl font-semibold">Your account is ready</h1>
          <Link
            className="mt-6 inline-flex min-h-12 items-center rounded-md px-3 font-semibold text-primary underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            href="/owner/sign-in"
          >
            Sign in
          </Link>
        </section>
      ) : (
        <OwnerSetupForm />
      )}
    </main>
  )
}
