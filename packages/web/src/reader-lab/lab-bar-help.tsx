'use client'

import { Popover } from '@base-ui/react/popover'
import { useRef } from 'react'

import { useLabIntroduction } from './use-lab-introduction'

/** Mounted only inside the authenticated lab bar, without changing its size or tab order. */
export function ReaderLabBarHelp() {
  const { open, changeOpen } = useLabIntroduction('bar')
  const closeRef = useRef<HTMLButtonElement>(null)

  return (
    <Popover.Root modal="trap-focus" open={open} onOpenChange={changeOpen}>
      <Popover.Portal>
        <Popover.Positioner
          anchor={() => document.querySelector<HTMLElement>('[data-reader-lab-bar]')}
          className="pointer-events-none z-[60] print:hidden"
          positionMethod="fixed"
          side="top"
          sideOffset={12}
        >
          <Popover.Popup
            className="pointer-events-auto relative max-h-[calc(100dvh-8rem)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-border bg-card p-5 text-foreground shadow-xl outline-none"
            finalFocus={() =>
              document.querySelector<HTMLButtonElement>('[data-reader-lab-bar] button')
            }
            initialFocus={closeRef}
          >
            <Popover.Title className="text-xl font-semibold">Compare directions here</Popover.Title>
            <Popover.Description className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Use Previous and Next in the bar below to compare this page. All directions takes you
              back to the cards. Exit lab returns you to Baseline.
            </Popover.Description>
            <Popover.Close
              className="mt-4 min-h-11 min-w-11 rounded-md border border-border bg-card px-4 text-sm font-semibold hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              ref={closeRef}
            >
              Got it
            </Popover.Close>
          </Popover.Popup>
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-full size-3 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r border-border bg-card"
          />
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
