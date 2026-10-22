// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ErrorBoundaryHandler } from 'next/dist/client/components/error-boundary'
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime'
import { StrictMode, Suspense, type ReactNode } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import ErrorPage from '@/app/error'
import { baselineDirection } from '@/reader-directions/baseline'
import { readerDirections } from '@/reader-directions/registry'
import { ReaderPage } from '@/reader-lab/reader-page'
import type { ReaderPresentation } from '@/reader-lab/presentation'

import { ReaderRecoveryScope } from './failure-boundary'

const lookup = vi.hoisted(() => vi.fn())
vi.mock('./resolve-error-presentation', () => ({ resolveErrorPresentation: lookup }))
vi.mock('@/reader-lab/lab-bar', () => ({ ReaderLabBar: () => <aside aria-label="Reader Lab" /> }))

const directions = [
  { directionId: 'baseline', lab: false },
  ...readerDirections.directions.map((direction) => ({ directionId: direction.id, lab: true })),
]

function FailingPage({
  error,
  presentation = { direction: baselineDirection, lab: null },
}: {
  error: Error | null
  presentation?: ReaderPresentation
}) {
  if (error) throw error
  return (
    <ReaderPage presentation={presentation}>
      <main>Recovered story</main>
    </ReaderPage>
  )
}

// Next types caught values as unknown; this fixture deliberately throws only Error instances.
function TestErrorPage({ error, reset }: { error: unknown; reset: () => void }) {
  if (!(error instanceof Error)) throw error
  return <ErrorPage error={error} reset={reset} />
}

function boundary(children: ReactNode, pathname = '/stories/example') {
  return (
    <StrictMode>
      <PathnameContext value={pathname}>
        <ReaderRecoveryScope>
          <ErrorBoundaryHandler pathname={pathname} errorComponent={TestErrorPage}>
            {children}
          </ErrorBoundaryHandler>
        </ReaderRecoveryScope>
      </PathnameContext>
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

it('cancels restoration when the reader focuses a baseline control before Lab replaces it', async () => {
  lookup.mockResolvedValue({ directionId: 'literary-longread', lab: true })
  const { container } = render(boundary(<FailingPage error={new Error('Render failed')} />))
  await waitFor(() =>
    expect(container.querySelector('[data-reader-direction="literary-longread"]')).not.toBeNull(),
  )
  let finish!: (selection: { directionId: string; lab: boolean }) => void
  lookup.mockReturnValue(
    new Promise<{ directionId: string; lab: boolean }>((resolve) => {
      finish = resolve
    }),
  )
  const retry = screen.getByRole('button', { name: 'Try again' })
  retry.focus()
  fireEvent.click(retry)
  await waitFor(() => expect(screen.getByRole('main')).toHaveFocus())

  const baselineControl = screen.getByRole('button', { name: 'Try again' })
  baselineControl.focus()
  expect(baselineControl).toHaveFocus()
  await act(async () => finish({ directionId: 'literary-longread', lab: true }))
  await waitFor(() =>
    expect(container.querySelector('[data-reader-direction="literary-longread"]')).not.toBeNull(),
  )
  expect(baselineControl.isConnected).toBe(false)
  expect(document.body).toHaveFocus()
})

it.each(
  directions.flatMap((selection) =>
    (['failure', 'recovery'] as const).map((outcome) => ({ ...selection, outcome })),
  ),
)(
  'retains retry intent through a committed loading fallback until $outcome: $directionId, lab=$lab',
  async ({ directionId, lab, outcome }) => {
    lookup.mockResolvedValue({ directionId, lab })
    const direction = readerDirections.find(directionId) ?? baselineDirection
    const presentation = {
      direction,
      lab: lab ? { direction, ...readerDirections.neighbours(directionId) } : null,
    }
    let phase: 'error' | 'loading' | 'ready' = 'error'
    let finish!: () => void
    const loading = new Promise<void>((resolve) => {
      finish = resolve
    })
    const error = new Error('Render failed')
    function Page() {
      if (phase === 'loading') throw loading
      return <FailingPage error={phase === 'error' ? error : null} presentation={presentation} />
    }
    const content = () =>
      boundary(
        <Suspense fallback={<main aria-busy="true">Loading story</main>}>
          <Page />
        </Suspense>,
      )
    const { container, rerender } = render(content())
    const selectedView = () =>
      expect(container.querySelector(`[data-reader-direction="${directionId}"]`)).not.toBeNull()
    await waitFor(selectedView)
    phase = 'loading'
    const retry = screen.getByRole('button', { name: 'Try again' })
    retry.focus()
    fireEvent.click(retry)
    await screen.findByText('Loading story')
    await act(async () => {})
    expect(retry.isConnected).toBe(false)
    expect(document.body).toHaveFocus()

    phase = outcome === 'failure' ? 'error' : 'ready'
    await act(async () => finish())
    if (outcome === 'failure') {
      await waitFor(selectedView)
      expect(screen.getByRole('main')).toHaveFocus()
    } else {
      expect(screen.getByRole('main')).toHaveTextContent('Recovered story')
      phase = 'error'
      rerender(content())
      await screen.findByRole('button', { name: 'Try again' })
      await waitFor(selectedView)
      expect(document.body).toHaveFocus()
    }
  },
)

it.each(['loading', 'outside'] as const)(
  'cancels a suspended retry when the reader focuses a %s control',
  async (destination) => {
    let loading = false
    let finish!: () => void
    const pending = new Promise<void>((resolve) => {
      finish = resolve
    })
    function Page(): ReactNode {
      if (loading) throw pending
      throw new Error('Render failed')
    }
    render(
      <>
        <button>Outside control</button>
        {boundary(
          <Suspense fallback={<button>Loading control</button>}>
            <Page />
          </Suspense>,
        )}
      </>,
    )
    await act(async () => {})
    loading = true
    const retry = screen.getByRole('button', { name: 'Try again' })
    retry.focus()
    fireEvent.click(retry)
    await screen.findByRole('button', { name: 'Loading control' })
    const control = screen.getByRole('button', {
      name: destination === 'loading' ? 'Loading control' : 'Outside control',
    })
    control.focus()
    loading = false
    await act(async () => finish())
    expect(screen.getByRole('main')).not.toHaveFocus()
    expect(destination === 'loading' ? document.body : control).toHaveFocus()
  },
)

it('discards a suspended retry on navigation, including a return to the original path', async () => {
  let loading = false
  let finish!: () => void
  const pending = new Promise<void>((resolve) => {
    finish = resolve
  })
  function Page(): ReactNode {
    if (loading) throw pending
    throw new Error('Render failed')
  }
  const content = (pathname: string) =>
    boundary(
      <Suspense fallback={<p>Loading story</p>}>
        <Page />
      </Suspense>,
      pathname,
    )
  const { rerender } = render(content('/stories/first'))
  await act(async () => {})
  loading = true
  const retry = screen.getByRole('button', { name: 'Try again' })
  retry.focus()
  fireEvent.click(retry)
  await screen.findByText('Loading story')
  loading = false
  rerender(content('/stories/second'))
  await act(async () => finish())
  expect(screen.getByRole('main')).not.toHaveFocus()
  rerender(content('/stories/first'))
  await act(async () => {})
  expect(document.body).toHaveFocus()
})

it('keeps pending retries isolated from other scopes and their recovery markers', async () => {
  const reset = vi.fn()
  const error = new Error('Render failed')
  const content = (phase: 'error' | 'loading' | 'recover-other' | 'failed') => (
    <StrictMode>
      <ReaderRecoveryScope>
        {phase === 'loading' || phase === 'recover-other' ? (
          <p>Loading story</p>
        ) : (
          <ErrorPage key={phase} error={error} reset={reset} />
        )}
      </ReaderRecoveryScope>
      <ReaderRecoveryScope>
        {phase === 'loading' ? (
          <ErrorPage error={error} reset={reset} />
        ) : (
          <FailingPage error={null} />
        )}
      </ReaderRecoveryScope>
    </StrictMode>
  )
  const { rerender } = render(content('error'))
  await act(async () => {})
  const retry = screen.getByRole('button', { name: 'Try again' })
  retry.focus()
  fireEvent.click(retry)
  rerender(content('loading'))
  await act(async () => {})
  expect(document.body).toHaveFocus()
  rerender(content('recover-other'))
  await act(async () => {})
  expect(screen.getByRole('main')).toHaveTextContent('Recovered story')
  rerender(content('failed'))
  await act(async () => {})
  expect(
    screen.getAllByRole('main').find((main) => main.textContent?.includes('Something')),
  ).toHaveFocus()
})

it('discards retry intent when its scope is disposed', async () => {
  const reset = vi.fn()
  const content = (key: string) => (
    <ReaderRecoveryScope key={key}>
      <ErrorPage error={new Error('Render failed')} reset={reset} />
    </ReaderRecoveryScope>
  )
  const { rerender } = render(content('old'))
  await act(async () => {})
  const retry = screen.getByRole('button', { name: 'Try again' })
  retry.focus()
  fireEvent.click(retry)
  rerender(content('new'))
  await act(async () => {})
  expect(document.body).toHaveFocus()
})

it('does not confirm recovery when a Lab failure presentation commits', async () => {
  let finish!: (selection: { directionId: string; lab: boolean }) => void
  lookup.mockReturnValue(
    new Promise((resolve) => {
      finish = resolve
    }),
  )
  const reset = vi.fn()
  const content = (key: string) => (
    <ReaderRecoveryScope>
      <ErrorPage key={key} error={new Error('Render failed')} reset={reset} />
    </ReaderRecoveryScope>
  )
  const { container, rerender } = render(content('first'))
  const retry = screen.getByRole('button', { name: 'Try again' })
  retry.focus()
  fireEvent.click(retry)
  await act(async () => finish({ directionId: 'literary-longread', lab: true }))
  expect(container.querySelector('[data-reader-direction="literary-longread"]')).not.toBeNull()
  lookup.mockResolvedValue({ directionId: 'baseline', lab: false })
  rerender(content('second'))
  await act(async () => {})
  expect(screen.getByRole('main')).toHaveFocus()
})

it('preserves resolved reader markup and focus during hydration', async () => {
  const page = <FailingPage error={null} />
  const scoped = <ReaderRecoveryScope>{page}</ReaderRecoveryScope>
  const markup = renderToString(scoped)
  expect(markup).toBe(renderToString(page))
  const container = document.createElement('div')
  container.innerHTML = markup
  document.body.append(container)
  const main = container.querySelector('main')
  const onRecoverableError = vi.fn()
  const root = hydrateRoot(container, scoped, { onRecoverableError })
  try {
    await act(async () => {})
    expect(container.innerHTML).toBe(markup)
    expect(container.querySelector('main')).toBe(main)
    expect(document.body).toHaveFocus()
    expect(onRecoverableError).not.toHaveBeenCalled()
    expect(lookup).not.toHaveBeenCalled()
  } finally {
    await act(async () => root.unmount())
    container.remove()
  }
})
