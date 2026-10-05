import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { SignInForm } from '@/components/owner/sign-in-form'
import { resolveOwnerSession } from '@/server/owner/session'

export const dynamic = 'force-dynamic'

export default async function OwnerSignInPage() {
  const session = await resolveOwnerSession(new Headers(await headers())).catch(() => null)
  if (session) redirect('/owner')
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <SignInForm />
    </main>
  )
}
