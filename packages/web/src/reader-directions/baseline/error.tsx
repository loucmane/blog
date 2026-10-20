import type { ErrorDirectionProps } from '../contract'

import { actionClassName, FailurePage } from './failure-frame'

/** Separate entry point so the client error boundary only ships its own fallback. */
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
