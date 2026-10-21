// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ErrorBoundaryHandler } from 'next/dist/client/components/error-boundary'
import { StrictMode, type ReactNode } from 'react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import ErrorPage from '@/app/error'
import { readerDirections } from '@/reader-directions/registry'

const lookup = vi.hoisted(() => vi.fn())
vi.mock('./resolve-error-presentation', () => ({ resolveErrorPresentation: lookup }))
vi.mock('@/reader-lab/lab-bar', () => ({ ReaderLabBar: () => <aside aria-label="Reader Lab" /> }))

const directions = [
  { directionId: 'baseline', lab: false },
  ...readerDirections.directions.map((direction) => ({ directionId: direction.id, lab: true })),
]

function FailingPage({ error }: { error: Error | null }) {
  if (error) throw error
  return <main>Recovered story</main>
}

// Next types caught values as unknown; this fixture deliberately throws only Error instances.
function TestErrorPage({ error, reset }: { error: unknown; reset: () => void }) {
  if (!(error instanceof Error)) throw error
  return <ErrorPage error={error} reset={reset} />
}

function boundary(children: ReactNode) {
  return (
    <StrictMode>
      <ErrorBoundaryHandler pathname="/stories/example" errorComponent={TestErrorPage}>
        {children}
      </ErrorBoundaryHandler>
    </StrictMode>
  )
}

beforeEach(async () => {
  // Preload the real lazy graph so these tests can control the selection lookup separately.
  await import('./lab-failure-page')
  lookup.mockReset()
  lookup.mockResolvedValue({ directionId: 'baseline', lab: false })
  // React reports the deliberately thrown render errors even when its boundary catches them.
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(cleanup)

it.each(directions)(
  'restores focus after repeated failed retries through the real app error page: $directionId, lab=$lab',
  async ({ directionId, lab }) => {
    lookup.mockResolvedValue({ directionId, lab })
    const error = new Error('Repeated render failure')
    const { container } = render(boundary(<FailingPage error={error} />))
    await waitFor(() =>
      expect(container.querySelector(`[data-reader-direction="${directionId}"]`)).not.toBeNull(),
    )
    await act(async () => {})
    expect(document.body).toHaveFocus()

    for (let retry = 0; retry < 2; retry += 1) {
      const button = screen.getByRole('button', { name: 'Try again' })
      button.focus()
      fireEvent.click(button)
      await waitFor(() => {
        expect(container.querySelector(`[data-reader-direction="${directionId}"]`)).not.toBeNull()
        expect(screen.getByRole('main')).toHaveFocus()
      })
      expect(button.isConnected).toBe(false)
      expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1')
      expect(screen.getAllByRole('main')).toHaveLength(1)
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    }
  },
)

it('restores baseline focus when the lookup rejects after a failed retry', async () => {
  lookup.mockRejectedValue(new Error('Lookup unavailable'))
  render(boundary(<FailingPage error={new Error('Render failed')} />))
  await act(async () => {})
  const button = screen.getByRole('button', { name: 'Try again' })
  button.focus()
  fireEvent.click(button)
  await waitFor(() => expect(screen.getByRole('main')).toHaveFocus())
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Something went wrong')
})

it.each([false, true])(
  'handles a delayed Lab view with reader focus moved away: %s',
  async (moveAway) => {
    lookup.mockResolvedValue({ directionId: 'literary-longread', lab: true })
    const { container } = render(
      <>
        <button>Outside the failure</button>
        {boundary(<FailingPage error={new Error('Render failed')} />)}
      </>,
    )
    await waitFor(() =>
      expect(container.querySelector('[data-reader-direction="literary-longread"]')).not.toBeNull(),
    )
    let finish!: (selection: { directionId: string; lab: boolean }) => void
    const selection = new Promise<{ directionId: string; lab: boolean }>((resolve) => {
      finish = resolve
    })
    lookup.mockReturnValue(selection)
    const button = screen.getByRole('button', { name: 'Try again' })
    button.focus()
    fireEvent.click(button)
    await waitFor(() => expect(screen.getByRole('main')).toHaveFocus())
    const outside = screen.getByRole('button', { name: 'Outside the failure' })
    if (moveAway) outside.focus()
    await act(async () => finish({ directionId: 'literary-longread', lab: true }))
    await waitFor(() =>
      expect(container.querySelector('[data-reader-direction="literary-longread"]')).not.toBeNull(),
    )
    expect(moveAway ? outside : screen.getByRole('main')).toHaveFocus()
  },
)

it('does not transfer retry focus to a later error after a successful recovery', async () => {
  let error: Error | null = new Error('First failure')
  function Page() {
    return <FailingPage error={error} />
  }
  const { rerender } = render(boundary(<Page />))
  await act(async () => {})
  error = null
  const button = screen.getByRole('button', { name: 'Try again' })
  button.focus()
  fireEvent.click(button)
  await act(async () => {})
  expect(screen.getByRole('main')).toHaveTextContent('Recovered story')
  error = new Error('Unrelated later failure')
  rerender(boundary(<Page />))
  await act(async () => {})
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Something went wrong')
  expect(document.body).toHaveFocus()
})
