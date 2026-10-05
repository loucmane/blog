import Link from 'next/link'

import { RecoveryForm } from '@/components/owner/recovery-form'

export default function OwnerRecoveryPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg md:p-8">
        <h1 className="text-4xl font-semibold">Recover access</h1>
        <p className="mt-3 text-muted-foreground">
          We never reveal whether an email matches the owner account.
        </p>
        <RecoveryForm />
        <Link
          className="mt-4 inline-block font-semibold text-primary underline-offset-4 hover:underline"
          href="/owner/sign-in"
        >
          Back to sign in
        </Link>
      </section>
    </main>
  )
}
