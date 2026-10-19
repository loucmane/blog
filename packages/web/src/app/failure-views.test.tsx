// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import {
  defineReaderDirection,
  type ErrorDirectionProps,
  type NotFoundDirectionProps,
} from '@/reader-directions/contract'
import { baselineDirection } from '@/reader-directions/baseline'
import { resolveReaderPresentation } from '@/reader-lab/presentation'

import ErrorPage from './error'
import NotFound from './not-found'
import HomePage from './page'

vi.mock('@/reader-lab/presentation', () => ({ resolveReaderPresentation: vi.fn() }))
vi.mock('@/reader/cache', () => ({ loadHomeView: vi.fn(async () => ({ status: 'unavailable' })) }))
vi.mock('next/server', () => ({ connection: vi.fn(async () => undefined) }))
vi.mock('@/reader-lab/lab-bar', () => ({ ReaderLabBar: () => <aside aria-label="Reader Lab" /> }))

const lookup = vi.hoisted(() => ({ resolve: vi.fn(), find: vi.fn() }))
vi.mock('@/reader/components/resolve-error-presentation', () => ({
  resolveErrorPresentation: lookup.resolve,
}))
vi.mock('@/reader-directions/registry', () => ({
  readerDirections: {
    find: lookup.find,
    neighbours: () => ({ next: {}, previous: {}, position: 1, total: 1 }),
  },
}))

function OwnNotFound({ view }: NotFoundDirectionProps) {
  return (
    <main>
      <h1>{view.siteName}: not found</h1>
    </main>
  )
}
function OwnError({ reset, view, ...rest }: ErrorDirectionProps) {
  return (
    <main>
      <h1>{view.siteName}: error</h1>
      <button onClick={reset}>Retry</button>
      <output>{JSON.stringify(rest)}</output>
    </main>
  )
}
const own = defineReaderDirection({
  ...baselineDirection,
  id: 'custom',
  name: 'Custom',
  NotFound: OwnNotFound,
  Error: OwnError,
  Unavailable: OwnNotFound,
  tokens: { light: { '--paper': '#ffffff' } },
})
const fallback = defineReaderDirection({
  Article: () => null,
  Home: () => null,
  Section: () => null,
  id: 'fallback',
  name: 'Fallback',
  thesis: 'Uses baseline failure pages.',
})

beforeEach(() => {
  lookup.resolve.mockResolvedValue({ directionId: 'custom', lab: true })
  lookup.find.mockReturnValue(own)
})
afterEach(cleanup)

it.each([own, fallback])(
  'renders not-found and unavailable inside $id with one h1 and the lab bar',
  async (direction) => {
    vi.mocked(resolveReaderPresentation).mockResolvedValue({
      direction,
      lab: { direction, next: direction, previous: direction, position: 1, total: 1 },
    })
    for (const page of [NotFound, HomePage]) {
      const document = new DOMParser().parseFromString(
        renderToStaticMarkup(await page()),
        'text/html',
      )
      expect(document.querySelectorAll('h1')).toHaveLength(1)
      expect(document.querySelector(`[data-reader-direction="${direction.id}"] h1`)).not.toBeNull()
      expect(document.querySelector('[aria-label="Reader Lab"]')).not.toBeNull()
      expect(document.querySelector('h1')?.textContent).toBe(
        direction === own
          ? 'Magazine Foundation: not found'
          : page === NotFound
            ? 'Page not found'
            : 'Stories are unavailable',
      )
    }
  },
)

it.each([own, fallback])(
  'renders the authorized $id error view and wires reset without error details',
  async (direction) => {
    lookup.resolve.mockResolvedValue({ directionId: direction.id, lab: true })
    lookup.find.mockReturnValue(direction)
    const reset = vi.fn()
    const { container } = render(
      <ErrorPage error={new Error('PRIVATE FAILURE DETAILS')} reset={reset} />,
    )
    await waitFor(() =>
      expect(container.querySelector(`[data-reader-direction="${direction.id}"]`)).not.toBeNull(),
    )
    expect(container.querySelectorAll('h1')).toHaveLength(1)
    expect(container.textContent).not.toContain('PRIVATE FAILURE DETAILS')
    expect(screen.getByRole('complementary', { name: 'Reader Lab' })).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: direction === own ? 'Retry' : 'Try again' }))
    expect(reset).toHaveBeenCalledOnce()
  },
)

it('keeps a usable baseline error page when selection cannot be resolved', async () => {
  lookup.resolve.mockRejectedValue(new Error('Lookup failed'))
  const reset = vi.fn()
  const { container } = render(<ErrorPage error={new Error('Secret')} reset={reset} />)
  await waitFor(() => expect(lookup.resolve).toHaveBeenCalled())
  expect(container.querySelector('[data-reader-direction="baseline"] h1')?.textContent).toBe(
    'Something went wrong',
  )
  expect(container.querySelectorAll('h1')).toHaveLength(1)
  expect(container.textContent).not.toMatch(/Secret|Lookup failed/)
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  expect(reset).toHaveBeenCalledOnce()
})

it('does not load a lab view for a visitor even when a direction id is returned', async () => {
  lookup.resolve.mockResolvedValue({ directionId: 'custom', lab: false })
  const { container } = render(<ErrorPage error={new Error('Failure')} reset={() => {}} />)
  await act(async () => {})
  expect(lookup.find).not.toHaveBeenCalled()
  expect(container.querySelector('[data-reader-direction="baseline"]')).not.toBeNull()
  expect(screen.queryByRole('complementary', { name: 'Reader Lab' })).toBeNull()
})

it('discards a stale selection when another error replaces the failed page', async () => {
  let finish!: (value: { directionId: string; lab: boolean }) => void
  lookup.resolve.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve
      }),
  )
  const { container, rerender } = render(<ErrorPage error={new Error('First')} reset={() => {}} />)
  lookup.resolve.mockResolvedValue({ directionId: 'baseline', lab: false })
  rerender(<ErrorPage error={new Error('Second')} reset={() => {}} />)
  await act(async () => {
    finish({ directionId: 'custom', lab: true })
  })
  expect(container.querySelector('[data-reader-direction="baseline"]')).not.toBeNull()
  expect(container.querySelector('[data-reader-direction="custom"]')).toBeNull()
})
