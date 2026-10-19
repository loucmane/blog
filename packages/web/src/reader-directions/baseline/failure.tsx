import type { NotFoundDirectionProps, UnavailableDirectionProps } from '../contract'

import { FailurePage } from './failure-frame'

export { BaselineError } from './error'

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
