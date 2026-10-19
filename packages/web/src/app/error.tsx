'use client'

import { useEffect, useState } from 'react'

import { readerFailureView } from '@/reader/components/failure-view'
import { resolveErrorPresentation } from '@/reader/components/resolve-error-presentation'
import { baselineDirection } from '@/reader-directions/baseline'
import type { ReaderPresentation } from '@/reader-lab/presentation'
import { ReaderPage } from '@/reader-lab/reader-page'

const fallback: ReaderPresentation = { direction: baselineDirection, lab: null }

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const [resolved, setResolved] = useState<{
    error: Error
    presentation: ReaderPresentation
  } | null>(null)
  const presentation = resolved?.error === error ? resolved.presentation : fallback
  useEffect(() => {
    let active = true
    async function resolve() {
      const selection = await resolveErrorPresentation()
      // Visitors need no designed-direction code. Only an authorized Lab selection loads it.
      if (!selection.lab) return
      const { readerDirections } = await import('@/reader-directions/registry')
      const direction = readerDirections.find(selection.directionId)
      if (active && direction)
        setResolved({
          error,
          presentation: {
            direction,
            lab: { direction, ...readerDirections.neighbours(direction.id) },
          },
        })
    }
    // The baseline page and its reset button remain usable even if the lookup fails.
    void resolve().catch(() => {})
    return () => {
      active = false
    }
  }, [error])
  const { Error: View } = presentation.direction
  return (
    <ReaderPage presentation={presentation}>
      <View reset={reset} view={readerFailureView} />
    </ReaderPage>
  )
}
