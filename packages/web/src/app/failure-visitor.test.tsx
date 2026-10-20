// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'

import ErrorPage from './error'
import NotFound from './not-found'

const calls = vi.hoisted(() => ({
  registry: vi.fn(),
  resolve: vi.fn(async () => ({ directionId: 'quiet-monograph', lab: false })),
}))
vi.mock('@/reader/components/resolve-error-presentation', () => ({
  resolveErrorPresentation: calls.resolve,
}))
vi.mock('@/reader-lab/presentation', () => ({
  resolveReaderPresentation: vi.fn(() => {
    throw new Error('Not available during static rendering')
  }),
}))
vi.mock('@/reader-directions/registry', () => {
  calls.registry()
  throw new Error('Visitors must never import the registry')
})
afterEach(cleanup)

it.each(['error', 'not-found'] as const)(
  'never imports the registry for a visitor on %s',
  async (kind) => {
    const { container } = render(
      kind === 'error' ? <ErrorPage error={new Error('Failure')} reset={() => {}} /> : <NotFound />,
    )
    await act(async () => {})
    expect(calls.resolve).toHaveBeenCalledOnce()
    expect(calls.registry).not.toHaveBeenCalled()
    expect(container.querySelector('[data-reader-direction="baseline"]')).not.toBeNull()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(screen.getByRole('banner').querySelector('a')?.textContent).toBe('Magazine Foundation')
    expect(screen.getByRole('link', { name: 'Magazine Foundation' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Return home' })).toHaveAttribute('href', '/')
    expect(screen.getAllByRole('link')).toHaveLength(2)
    expect(screen.queryByRole('navigation')).toBeNull()
    expect(screen.queryByRole('complementary', { name: 'Reader Lab' })).toBeNull()
  },
)

it('keeps home/retry usable when authorized lab code fails to load', async () => {
  calls.resolve.mockResolvedValue({ directionId: 'quiet-monograph', lab: true })
  const reset = vi.fn()
  for (const kind of ['error', 'not-found']) {
    const { container, unmount } = render(
      kind === 'error' ? <ErrorPage error={new Error('Failure')} reset={reset} /> : <NotFound />,
    )
    await waitFor(() => expect(calls.registry).toHaveBeenCalledOnce())
    await act(async () => {})
    expect(container.querySelector('[data-reader-direction="baseline"]')).not.toBeNull()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getAllByRole('main')).toHaveLength(1)
    expect(screen.getByRole('link', { name: 'Return home' }).getAttribute('href')).toBe('/')
    if (kind === 'error') {
      fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
      expect(reset).toHaveBeenCalledOnce()
    }
    unmount()
  }
})
