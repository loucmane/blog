'use client'

import { Dialog } from '@base-ui/react/dialog'
import { useRef, useState } from 'react'

import { useLabIntroduction } from './use-lab-introduction'

const steps = [
  {
    title: 'Your own view of the magazine',
    description:
      'The Reader Lab shows your real public site in different design directions. Only you see the direction you choose, while you are signed in. Visitors keep seeing the baseline.',
  },
  {
    title: 'Choose a direction',
    description:
      'Each direction card describes a different look and feel. Choose “View the site in this direction” to explore the home page, or “Open latest story” to start reading. Try all five directions and compare them with Baseline.',
  },
  {
    title: 'Compare as you read',
    description:
      'The Reader Lab bar stays at the bottom of reader pages. Previous and Next change the direction on the same page. All directions returns to the cards. Exit lab returns the page to Baseline.',
  },
  {
    title: 'Try your own story',
    description:
      'Choose “Write a new post” in the lab. Write a title and story, wait for it to save, then choose Preview. When you are ready, choose “Publish now”. Return to the lab and open your latest story to compare it across directions.',
  },
  {
    title: 'Notice how it feels',
    description:
      'Judge reading comfort, how images fit, and how easily you find your way around. Try a phone-sized screen, switch to dark mode with Theme, and notice how quickly pages appear.',
  },
  {
    title: 'Return to the baseline',
    description:
      'Choose Exit lab in the reader bar or on this page to go back to Baseline. Your stories stay published. You can return here and choose “Take the tour” whenever you want a reminder.',
  },
] as const

const labHelpButton =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'

export function ReaderLabTour() {
  const { open, changeOpen } = useLabIntroduction('tour')
  const [step, setStep] = useState(0)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const current = steps[step]!

  return (
    // Keep keyboard focus inside the tour, but let outside presses dismiss it and activate cards.
    <Dialog.Root modal="trap-focus" open={open} onOpenChange={changeOpen}>
      <Dialog.Trigger className={labHelpButton} onClick={() => setStep(0)} ref={triggerRef}>
        Take the tour
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Popup
          className="fixed left-1/2 top-1/2 z-[60] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-6 text-foreground shadow-xl outline-none"
          finalFocus={triggerRef}
          initialFocus={closeRef}
        >
          <div className="flex items-center justify-between gap-4">
            <Dialog.Title className="text-xl font-semibold">Reader Lab tour</Dialog.Title>
            <Dialog.Close className={labHelpButton} ref={closeRef}>
              Close tour
            </Dialog.Close>
          </div>
          <div aria-atomic="true" aria-live="polite" className="mt-6">
            <p className="text-sm text-muted-foreground">
              Step {step + 1} of {steps.length}
            </p>
            <h2 className="mt-2 text-2xl font-semibold">{current.title}</h2>
            <Dialog.Description className="mt-3 leading-relaxed text-muted-foreground">
              {current.description}
            </Dialog.Description>
          </div>
          <div className="mt-6 flex justify-between gap-3">
            <button
              className={`${labHelpButton} disabled:opacity-50`}
              disabled={step === 0}
              onClick={() => setStep(step - 1)}
              type="button"
            >
              Back
            </button>
            <button
              className={labHelpButton}
              onClick={() => (step === steps.length - 1 ? changeOpen(false) : setStep(step + 1))}
              type="button"
            >
              {step === steps.length - 1 ? 'Finish tour' : 'Next step'}
            </button>
          </div>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
