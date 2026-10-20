import Link from 'next/link'
import type { ReactNode } from 'react'

import { SiteHeaderFrame } from '@/reader/components/site-header-frame'

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
      <SiteHeaderFrame navigation={view.navigation} siteName={view.siteName} />
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-2xl">
          <h1 className="mb-4 text-3xl font-semibold">{title}</h1>
          <p className="text-lg text-muted-foreground">{message}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {children}
            <Link className={actionClassName} href="/">
              Return home
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
