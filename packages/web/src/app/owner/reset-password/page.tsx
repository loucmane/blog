import Link from 'next/link'

import { ResetPasswordForm } from '@/components/owner/reset-password-form'

export default async function OwnerResetPasswordPage({
  searchParams,
}: {
  readonly searchParams: Promise<{ token?: string }>
}) {
  const { token = '' } = await searchParams
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-lg md:p-8">
        <h1 className="text-4xl font-semibold">Choose a new password</h1>
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <p className="mt-4" role="alert">
            This recovery link is incomplete. Request a new one.
          </p>
        )}
        <Link
          className="mt-4 inline-block font-semibold text-primary underline-offset-4 hover:underline"
          href="/owner/recover"
        >
          Request another link
        </Link>
      </section>
    </main>
  )
}
