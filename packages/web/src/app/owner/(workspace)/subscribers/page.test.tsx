// @vitest-environment jsdom

import { screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ session: vi.fn(), runtime: vi.fn() }))
vi.mock('@/server/owner/session', () => ({ requireOwnerPageSession: mocks.session }))
vi.mock('@/server/subscriptions/runtime', () => ({ getSubscriptionRuntime: mocks.runtime }))
vi.mock('next/headers', () => ({ headers: async () => new Headers() }))

import { InMemoryContentRepository } from '@/server/content/in-memory-repository'
import { InMemorySubscriptionStore } from '@/server/subscriptions/in-memory-store'
import OwnerSubscribersPage from './page'

afterEach(() => {
  document.body.innerHTML = ''
  vi.clearAllMocks()
})

describe('subscriber privacy page', () => {
  it('renders labelled native forms and consequences before deletion without listing addresses', async () => {
    mocks.session.mockResolvedValue({ id: 'owner' })
    mocks.runtime.mockReturnValue({
      store: new InMemorySubscriptionStore(new InMemoryContentRepository()),
    })
    document.body.innerHTML = renderToStaticMarkup(
      await OwnerSubscribersPage({ searchParams: Promise.resolve({ result: 'not-found' }) }),
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Subscribers')
    expect(screen.getByRole('status')).toHaveTextContent(
      'No subscriber with that address; nothing was deleted.',
    )
    expect(screen.getByLabelText('Type the email address again to confirm')).toBeRequired()
    expect(screen.getByText(/anonymized record/)).toBeInTheDocument()
    const download = screen
      .getByRole('button', { name: 'Download subscriber data' })
      .closest('form')
    expect(download).toHaveAttribute('method', 'post')
    expect(download).toHaveAttribute('action', '/api/owner/subscribers/export')
    expect(
      screen.getByRole('button', { name: 'Delete personal data' }).closest('form'),
    ).toHaveAttribute('method', 'post')
    expect(document.body.textContent).not.toContain('@')
  })

  it('does not read subscriptions before the owner guard passes', async () => {
    mocks.session.mockRejectedValue(new Error('sign in'))
    await expect(OwnerSubscribersPage({ searchParams: Promise.resolve({}) })).rejects.toThrow(
      'sign in',
    )
    expect(mocks.runtime).not.toHaveBeenCalled()
  })
})
