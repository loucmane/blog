import Link from 'next/link'
import type { ReactNode } from 'react'

import type {
  ErrorDirectionProps,
  NotFoundDirectionProps,
  ReaderFailureView,
  UnavailableDirectionProps,
} from '../contract'
import { CinematicShell } from './shell'

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
    <CinematicShell navigation={view.navigation} name={view.siteName}>
      <div className="cf-failure">
        <h1 className="cf-collection-title">{title}</h1>
        <p>{message}</p>
        <div className="cf-failure-actions">
          {children}
          <Link className="cf-read" href="/">
            All stories
          </Link>
        </div>
      </div>
    </CinematicShell>
  )
}

export function CinematicNotFound({ view }: NotFoundDirectionProps) {
  return (
    <FailurePage
      title="Page not found"
      message="We could not find the page you requested."
      view={view}
    />
  )
}

/** Synchronous and client-compatible for the shared boundary's authorized upgrade. */
export function CinematicError({ reset, view }: ErrorDirectionProps) {
  return (
    <FailurePage
      title="Something went wrong"
      message="We could not load this page. Please try again."
      view={view}
    >
      <button className="cf-retry" type="button" onClick={reset}>
        Try again
      </button>
    </FailurePage>
  )
}

export function CinematicUnavailable({ view }: UnavailableDirectionProps) {
  return (
    <FailurePage
      title="Stories are unavailable"
      message="The magazine cannot reach its stories right now. Please try again later."
      view={view}
    />
  )
}
