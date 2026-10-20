import { createElement, type ReactNode } from 'react'

import { readerDirections } from '@/reader-directions/registry'
import { ReaderPage } from '@/reader-lab/reader-page'

import { readerFailureView } from './failure-view'

export interface LabFailurePageProps {
  readonly directionId: string
  readonly fallback: ReactNode
  readonly failure:
    { readonly kind: 'not-found' } | { readonly kind: 'error'; readonly reset: () => void }
}

/** Loaded only after the server action authorizes a Lab selection. No error details enter here. */
export default function LabFailurePage({ directionId, failure, fallback }: LabFailurePageProps) {
  const direction = readerDirections.find(directionId)
  if (!direction) return fallback
  // The registry supplies stable component references, not component factories.
  const view =
    failure.kind === 'error'
      ? createElement(direction.Error, { reset: failure.reset, view: readerFailureView })
      : createElement(direction.NotFound, { view: readerFailureView })
  return (
    <ReaderPage
      presentation={{ direction, lab: { direction, ...readerDirections.neighbours(direction.id) } }}
    >
      {view}
    </ReaderPage>
  )
}
