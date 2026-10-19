'use client'

import { BaselineError } from '@/reader-directions/baseline/error'
import { ReaderFailureBoundary } from '@/reader/components/failure-boundary'
import { readerFailureView } from '@/reader/components/failure-view'

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <ReaderFailureBoundary kind="error" error={error} reset={reset}>
      <div data-reader-direction="baseline">
        <BaselineError reset={reset} view={readerFailureView} />
      </div>
    </ReaderFailureBoundary>
  )
}
