// @vitest-environment jsdom

import { screen, within } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { ownerSession } = vi.hoisted(() => ({ ownerSession: vi.fn() }))
vi.mock('next/headers', () => ({ headers: async () => new Headers() }))
vi.mock('next/navigation', () => ({
  redirect: (path: string) => {
    throw new Error(`REDIRECT ${path}`)
  },
}))
vi.mock('@/server/owner/session', () => ({ resolveOwnerSession: ownerSession }))

import OwnerWorkspaceLayout from './layout'

afterEach(() => {
  document.body.innerHTML = ''
})

describe('owner workspace layout', () => {
  it('links the publishing jobs page from the owner navigation', async () => {
    ownerSession.mockResolvedValue({ email: 'owner@example.test', id: 'owner', name: 'Owner' })

    document.body.innerHTML = renderToStaticMarkup(
      await OwnerWorkspaceLayout({ children: <p>Page</p> }),
    )

    const navigation = within(screen.getByRole('navigation', { name: 'Owner workspace' }))
    expect(navigation.getByRole('link', { name: 'Publishing jobs' })).toHaveAttribute(
      'href',
      '/owner/jobs',
    )
    expect(navigation.getAllByRole('link').map(({ textContent }) => textContent)).toEqual([
      'Stories',
      'New story',
      'Publishing jobs',
      'Reader Lab',
      'Account',
    ])
  })

  it('sends a visitor who is not signed in to sign-in', async () => {
    ownerSession.mockResolvedValue(null)

    await expect(OwnerWorkspaceLayout({ children: <p>Page</p> })).rejects.toThrow(
      'REDIRECT /owner/sign-in',
    )
  })
})
