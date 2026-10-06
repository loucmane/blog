import type { ReactNode } from 'react'

import { ReaderDirectionRoot } from '@/reader-directions/direction-root'

import { ReaderLabBar } from './lab-bar'
import type { ReaderPresentation } from './presentation'

interface ReaderPageProps {
  readonly cacheGeneration?: string | undefined
  readonly children: ReactNode
  readonly presentation: ReaderPresentation
}

/**
 * A reader page in its resolved direction. For the owner in the Reader Lab it adds the lab bar,
 * first in the tab order, and reserves room at the end of the direction's root so the bar never
 * covers content. The room sits inside the root, so a direction that paints its root's background
 * paints it too.
 */
export function ReaderPage({ cacheGeneration, children, presentation }: ReaderPageProps) {
  return (
    <>
      {presentation.lab ? <ReaderLabBar lab={presentation.lab} /> : null}
      <ReaderDirectionRoot cacheGeneration={cacheGeneration} direction={presentation.direction}>
        {children}
        {presentation.lab ? (
          <div
            aria-hidden="true"
            className="h-[calc(5.5rem+env(safe-area-inset-bottom))] print:hidden"
            data-reader-lab-spacer=""
          />
        ) : null}
      </ReaderDirectionRoot>
    </>
  )
}
