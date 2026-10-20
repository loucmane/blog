import { BaselineNotFound } from '@/reader-directions/baseline/failure'
import { ReaderFailureBoundary } from '@/reader/components/failure-boundary'
import { readerFailureView } from '@/reader/components/failure-view'

// Keep Baseline markup on the server and request APIs out of root not-found prerendering.
export default function NotFound() {
  return (
    <ReaderFailureBoundary kind="not-found">
      <div data-reader-direction="baseline">
        <BaselineNotFound view={readerFailureView} />
      </div>
    </ReaderFailureBoundary>
  )
}
