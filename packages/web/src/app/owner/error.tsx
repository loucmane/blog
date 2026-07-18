'use client'

export default function OwnerError({
  reset,
}: {
  readonly error: Error & { digest?: string }
  readonly reset: () => void
}) {
  return (
    <main className="container mx-auto max-w-xl px-4 py-16">
      <h1 className="text-4xl font-semibold">The workspace needs attention</h1>
      <p className="mt-4 text-muted-foreground">
        Your browser recovery copy has not been removed. Retry once, then return to the stories list
        if the problem continues.
      </p>
      <button
        className="mt-6 min-h-11 rounded-md bg-primary px-4 font-semibold text-primary-foreground"
        onClick={reset}
        type="button"
      >
        Try again
      </button>
    </main>
  )
}
