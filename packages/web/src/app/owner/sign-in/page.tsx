import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { SignInForm } from '@/components/owner/sign-in-form'
import { localOwnerFixture } from '@/server/owner/local-fixture'
import { resolveOwnerSession } from '@/server/owner/session'

import { signInAsLocalOwner } from './local-action'

export const dynamic = 'force-dynamic'

export default async function OwnerSignInPage() {
  const requestHeaders = new Headers(await headers())
  const session = await resolveOwnerSession(requestHeaders).catch(() => null)
  if (session) redirect('/owner')
  const fixture = localOwnerFixture(requestHeaders)
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-muted/40 px-4 py-10">
      <SignInForm />
      {fixture ? (
        <section
          aria-labelledby="local-reader-lab-title"
          className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg md:p-8"
        >
          <h2 className="text-3xl font-semibold" id="local-reader-lab-title">
            Try your Reader Lab
          </h2>
          <p className="mt-3 text-muted-foreground">
            This local magazine is yours to explore. Stories and changes disappear when you stop it.
          </p>
          <form action={signInAsLocalOwner}>
            <button
              className="mt-6 min-h-11 w-full rounded-md bg-primary px-4 py-3 font-semibold text-primary-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              type="submit"
            >
              Sign in as the local owner
            </button>
          </form>
        </section>
      ) : null}
    </main>
  )
}
