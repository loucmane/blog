import Link from 'next/link'
import type { ReactNode } from 'react'

import type {
  ErrorDirectionProps,
  NotFoundDirectionProps,
  ReaderFailureView,
  UnavailableDirectionProps,
} from '../contract'
import { MonographShell } from './shell'

/**
 * A failure page: the frame, then one centred block with a label, the `h1` naming the failure, one
 * sentence and the way home. It needs no stories, so a missing content store cannot break it, and
 * it never sees error details. Keep it synchronous and client-compatible: the error view renders in
 * the client error boundary, and not-found in its client upgrader.
 */
function FailurePage({
  action,
  label,
  message,
  title,
  view,
}: {
  readonly action?: ReactNode
  readonly label: string
  readonly message: string
  readonly title: string
  readonly view: ReaderFailureView
}) {
  return (
    <MonographShell navigation={view.navigation} siteName={view.siteName}>
      <div className="qm-failure">
        <p className="qm-label">{label}</p>
        <h1>{title}</h1>
        <p className="qm-failure-message">{message}</p>
        <p className="qm-label qm-failure-actions">
          {action}
          <Link href="/">Front page</Link>
        </p>
      </div>
    </MonographShell>
  )
}

export function MonographNotFound({ view }: NotFoundDirectionProps) {
  return (
    <FailurePage
      label="Not found"
      message="The page may have moved, or the address may be mistyped."
      title="Page not found"
      view={view}
    />
  )
}

/** The error boundary's page. `reset` is the boundary's retry; the error itself never reaches it. */
export function MonographError({ reset, view }: ErrorDirectionProps) {
  return (
    <FailurePage
      action={
        <button className="qm-retry" onClick={reset} type="button">
          Try again
        </button>
      }
      label="Error"
      message="The page could not be shown. Please try again."
      title="Something went wrong"
      view={view}
    />
  )
}

/** Home when the stories cannot be reached, with the shared unavailable copy. */
export function MonographUnavailable({ view }: UnavailableDirectionProps) {
  return (
    <FailurePage
      label="Unavailable"
      message="The magazine cannot reach its stories right now. Please try again later."
      title="Stories are unavailable"
      view={view}
    />
  )
}
