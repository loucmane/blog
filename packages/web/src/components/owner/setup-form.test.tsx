// @vitest-environment jsdom

import { createRequire } from 'node:module'

import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StrictMode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { OwnerSetupForm } from './setup-form'

const navigation = vi.hoisted(() => ({ refresh: vi.fn(), replace: vi.fn() }))
vi.mock('next/navigation', () => ({ useRouter: () => navigation }))

const token = 'unit-only-fragment-secret-with-at-least-32-bytes'
const fetchMock = vi.fn()
// Reuse the same axe engine pinned by our existing Playwright accessibility dependency.
const loadAxe = createRequire(createRequire(import.meta.url).resolve('@axe-core/playwright'))
const axe = loadAxe('axe-core') as {
  run: (element: HTMLElement, options: object) => Promise<{ violations: unknown[] }>
}

beforeEach(() => {
  window.history.replaceState({}, '', `/owner/setup#${token}`)
  fetchMock.mockReset().mockResolvedValue(new Response('{}'))
  vi.stubGlobal('fetch', fetchMock)
})
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('owner setup form', () => {
  it('passes axe structural accessibility checks before and after a field error', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 400 }))
    render(
      <main>
        <OwnerSetupForm email="owner@example.com" />
      </main>,
    )
    // jsdom has no layout or computed color rendering; browser contrast remains a host check.
    const options = { rules: { 'color-contrast': { enabled: false } } }
    expect((await axe.run(document.body, options)).violations).toEqual([])
    const input = screen.getByLabelText('Password', { exact: true })
    fireEvent.change(input, { target: { value: 'four unrelated words here' } })
    fireEvent.submit(input.closest('form')!)
    await waitFor(() => expect(input).toHaveAttribute('aria-invalid', 'true'))
    expect((await axe.run(document.body, options)).violations).toEqual([])
  })

  it('clears the fragment, explains the rules, supports keyboard visibility toggle, and posts the token only in the body', async () => {
    const user = userEvent.setup()
    render(
      <StrictMode>
        <OwnerSetupForm email="owner@example.com" />
      </StrictMode>,
    )
    expect(window.location.hash).toBe('')
    expect(document.body.innerHTML).not.toContain(token)
    const input = screen.getByLabelText('Password', { exact: true })
    expect(input).toHaveAttribute('minlength', '14')
    expect(input).toHaveAttribute('maxlength', '128')
    expect(input).toHaveAccessibleDescription(/14–128 characters.*several unrelated words/)
    await user.tab()
    expect(input).toHaveFocus()
    await user.type(input, 'four unrelated words here')
    await user.tab()
    expect(screen.getByRole('button', { name: 'Show password' })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(input).toHaveAttribute('type', 'text')
    await user.keyboard('{Enter}')
    expect(input).toHaveAttribute('type', 'password')
    await user.tab()
    await user.keyboard('{Enter}')
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/owner/reader-lab'))
    expect(fetchMock).toHaveBeenCalledExactlyOnceWith('/api/owner/setup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      credentials: 'same-origin',
      referrerPolicy: 'no-referrer',
      body: JSON.stringify({ token, password: 'four unrelated words here' }),
    })
    expect(navigation.refresh).toHaveBeenCalledOnce()
    expect(input).toHaveValue('')
  })

  it('does not use a query token or submit without the full fragment link', async () => {
    window.history.replaceState({}, '', `/owner/setup?token=${token}`)
    render(<OwnerSetupForm email="owner@example.com" />)
    expect(screen.getByRole('button', { name: 'Create account' })).toBeDisabled()
    expect(screen.getByText(/Open the full setup link/)).toBeVisible()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it.each([400, 403, 404, 429, 503])(
    'announces a safe, actionable error for status %s',
    async (status) => {
      fetchMock.mockResolvedValue(new Response(token, { status }))
      const user = userEvent.setup()
      render(<OwnerSetupForm email="owner@example.com" />)
      const input = screen.getByLabelText('Password', { exact: true })
      await user.type(input, 'four unrelated words here')
      await user.click(screen.getByRole('button', { name: 'Create account' }))
      expect(screen.getByRole('status')).not.toHaveTextContent('Creating your account')
      expect(screen.getByRole('status')).not.toHaveTextContent(token)
      expect(screen.getByRole('status').textContent).not.toBe('')
      if (status === 400) {
        expect(input).toHaveFocus()
        expect(input).toHaveAttribute('aria-invalid', 'true')
        expect(input).toHaveAccessibleDescription(/then try again/)
      }
      if (status === 404)
        expect(screen.getByRole('button', { name: 'Create account' })).toBeDisabled()
      expect(navigation.replace).not.toHaveBeenCalled()
    },
  )

  it('keeps the password on connection failure so the owner can retry', async () => {
    fetchMock.mockRejectedValue(new Error('offline'))
    render(<OwnerSetupForm email="owner@example.com" />)
    const input = screen.getByLabelText('Password', { exact: true })
    fireEvent.change(input, { target: { value: 'four unrelated words here' } })
    fireEvent.submit(input.closest('form')!)
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('Check your connection'),
    )
    expect(input).toHaveValue('four unrelated words here')
    expect(screen.getByRole('button', { name: 'Create account' })).toBeEnabled()
  })
})
