import Link from 'next/link'

import type {
  ErrorDirectionProps,
  NotFoundDirectionProps,
  ReaderFailureView,
  UnavailableDirectionProps,
} from '../contract'
import { LiteraryShell } from './shell'

function LiteraryFailure({
  view,
  title,
  message,
  reset,
}: {
  readonly view: ReaderFailureView
  readonly title: string
  readonly message: string
  readonly reset?: () => void
}) {
  return (
    <LiteraryShell
      navigation={view.navigation}
      siteTitle={view.siteName}
      skipLabel="Skip to message"
    >
      <div className="ll-failure" data-reader-failure="">
        <h1>{title}</h1>
        <p role={reset ? 'alert' : undefined}>{message}</p>
        <div className="ll-failure-actions">
          {reset ? (
            <button type="button" onClick={reset}>
              Try again
            </button>
          ) : null}
          <Link href="/">Return to all stories</Link>
        </div>
      </div>
    </LiteraryShell>
  )
}

export function LiteraryNotFound({ view }: NotFoundDirectionProps) {
  return (
    <LiteraryFailure view={view} title="Page not found" message="This page is not available." />
  )
}

export function LiteraryUnavailable({ view }: UnavailableDirectionProps) {
  return (
    <LiteraryFailure
      view={view}
      title="Stories are unavailable"
      message="The magazine cannot reach its stories right now. Please try again later."
    />
  )
}

/** Synchronous and client-compatible for the shared error boundary; no error data is accepted. */
export function LiteraryError({ view, reset }: ErrorDirectionProps) {
  return (
    <LiteraryFailure
      view={view}
      title="Something went wrong"
      message="We could not load this page. Please try again."
      reset={reset}
    />
  )
}
