import Link from 'next/link'
import type { ReactNode } from 'react'

import type {
  ErrorDirectionProps,
  NotFoundDirectionProps,
  ReaderFailureView,
  UnavailableDirectionProps,
} from '../contract'
import { SwissLabelRow } from './index-row'
import { SwissShell } from './shell'

/**
 * A failure page (spec 2.7): the usual masthead and footer around one block across columns 1–3,
 * with a label row, the `h1` naming the failure, one sentence and the way back. It needs no
 * stories, so a missing content store cannot break it, and it never sees error details. Keep it
 * synchronous and client-compatible: the error view renders in the client error boundary, and
 * not-found in its client upgrader.
 */
function SwissFailure({
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
    <SwissShell navigation={view.navigation} siteName={view.siteName}>
      <div className="si-failure" data-reader-failure="">
        <SwissLabelRow label={label} />
        <h1>{title}</h1>
        <p className="si-dek">{message}</p>
        <div className="si-failure-actions">
          {action}
          <Link href="/">Front page</Link>
        </div>
      </div>
    </SwissShell>
  )
}

export function SwissNotFound({ view }: NotFoundDirectionProps) {
  return (
    <SwissFailure
      label="Error 404"
      message="We could not find the page you requested."
      title="Page not found"
      view={view}
    />
  )
}

/** The error boundary's page. `reset` is the boundary's retry; the error itself never reaches it. */
export function SwissError({ reset, view }: ErrorDirectionProps) {
  return (
    <SwissFailure
      action={
        <button className="si-retry" onClick={reset} type="button">
          Try again
        </button>
      }
      label="Error"
      message="We could not load this page."
      title="Something went wrong"
      view={view}
    />
  )
}

/** Home when the stories cannot be reached, with the shared unavailable copy (spec 2.7). */
export function SwissUnavailable({ view }: UnavailableDirectionProps) {
  return (
    <SwissFailure
      label="Unavailable"
      message="The magazine cannot reach its stories right now. Please try again later."
      title="Stories are unavailable"
      view={view}
    />
  )
}
