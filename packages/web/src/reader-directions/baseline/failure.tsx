import Link from 'next/link'
import type { ReactNode } from 'react'

import { SiteHeader } from '@/reader/components/site-header'

import type {
  ErrorDirectionProps,
  NotFoundDirectionProps,
  ReaderFailureView,
  UnavailableDirectionProps,
} from '../contract'

const actionClassName =
  'inline-flex min-h-11 items-center justify-center rounded-md px-4 py-2 text-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

function FailurePage({
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
      <SiteHeader navigation={view.navigation} siteName={view.siteName} />
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

export function BaselineNotFound({ view }: NotFoundDirectionProps) {
  return (
    <FailurePage
      title="Page not found"
      message="We could not find the page you requested."
      view={view}
    />
  )
}

export function BaselineUnavailable({ view }: UnavailableDirectionProps) {
  return (
    <FailurePage
      title="Stories are unavailable"
      message="The magazine cannot reach its stories right now. Please try again later."
      view={view}
    />
  )
}

export function BaselineError({ reset, view }: ErrorDirectionProps) {
  return (
    <FailurePage
      title="Something went wrong"
      message="We could not load this page. Please try again."
      view={view}
    >
      <button
        className={`${actionClassName} bg-primary text-primary-foreground`}
        onClick={reset}
        type="button"
      >
        Try again
      </button>
    </FailurePage>
  )
}
