import { BaselineUnavailable } from '@/reader-directions/baseline/failure'

import { readerFailureView } from './failure-view'

/** Baseline compatibility view. Reader routes select their direction's Unavailable view. */
export function ReaderUnavailable() {
  return <BaselineUnavailable view={readerFailureView} />
}
