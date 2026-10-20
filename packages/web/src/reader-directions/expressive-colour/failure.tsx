import Link from 'next/link'
import type { ReactNode } from 'react'

import type {
  ErrorDirectionProps,
  NotFoundDirectionProps,
  ReaderFailureView,
  UnavailableDirectionProps,
} from '../contract'
import { StoryMotif } from './motif'
import { ExpressiveShell } from './shell'

/** Synchronous and client-compatible: failure boundaries supply only public copy and reset. */
function FailurePage({
  children,
  label,
  message,
  title,
  unavailable = false,
  view,
}: {
  readonly children?: ReactNode
  readonly label: string
  readonly message: string
  readonly title: string
  readonly unavailable?: boolean
  readonly view: ReaderFailureView
}) {
  const Heading = unavailable ? 'h2' : 'h1'
  const motif = (placement: 'stacked' | 'split') => (
    <div className={`ec-failure-motif ec-failure-${placement}`} aria-hidden="true">
      <StoryMotif slug={unavailable ? 'unavailable' : label} />
    </div>
  )
  return (
    <ExpressiveShell
      name={view.siteName}
      navigation={view.navigation}
      wordmarkHeading={unavailable}
    >
      <div className="ec-failure" data-reader-failure="">
        {motif('stacked')}
        <div className="ec-failure-copy">
          <p className="ec-label">{label}</p>
          <Heading>{title}</Heading>
          <p>{message}</p>
          <div className="ec-failure-actions">
            <Link className="ec-pill" href="/">
              All stories
            </Link>
            {children}
          </div>
        </div>
        {motif('split')}
      </div>
    </ExpressiveShell>
  )
}

export function ExpressiveNotFound({ view }: NotFoundDirectionProps) {
  return (
    <FailurePage
      label="Error 404"
      title="Page not found"
      message="We could not find the page you requested."
      view={view}
    />
  )
}

export function ExpressiveError({ view, reset }: ErrorDirectionProps) {
  return (
    <FailurePage
      label="Error"
      title="Something went wrong"
      message="We could not load this page. Please try again."
      view={view}
    >
      <button className="ec-pill" type="button" onClick={reset}>
        Try again
      </button>
    </FailurePage>
  )
}

export function ExpressiveUnavailable({ view }: UnavailableDirectionProps) {
  return (
    <FailurePage
      label="Unavailable"
      title="Stories are unavailable"
      message="The magazine cannot reach its stories right now. Please try again later."
      unavailable
      view={view}
    />
  )
}
