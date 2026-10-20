import type { ReactNode } from 'react'

import type { ReaderFailureView } from '../contract'

export const actionClassName =
  'inline-flex min-h-11 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

export function FailurePage({
  children,
  message,
  title,
  view,
}: {
  readonly children?: ReactNode
  readonly message: string
  readonly title: string
  readonly view: ReaderFailureView
}) {
  return (
    <div className="min-h-screen bg-background text-foreground" data-reader-failure="">
      <header className="border-b border-border">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-4 py-4">
          <p className="font-serif text-2xl font-semibold">
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- A full page load is intentional recovery from a failure page. */}
            <a className="underline-offset-4 hover:underline" href="/">
              {view.siteName}
            </a>
          </p>
        </div>
      </header>
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl">
          <h1 className="mb-4 text-3xl font-semibold">{title}</h1>
          <p className="text-lg text-muted-foreground">{message}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {children}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- A full page load is intentional recovery from a failure page. */}
            <a className={actionClassName} href="/">
              Return home
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
