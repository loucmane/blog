// @vitest-environment jsdom

import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createPortal } from 'react-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ThemeMenu } from './theme-menu'

const setTheme = vi.fn()

vi.mock('next-themes', () => ({
  useTheme: () => ({ resolvedTheme: 'light', setTheme, theme: 'light' }),
}))

class ResizeObserverStub {
  disconnect() {}
  observe() {}
  unobserve() {}
}

/** A same-origin frame that the page renders into, like a Reader Lab comparison preview. */
function frameDocument() {
  const frame = document.createElement('iframe')
  document.body.append(frame)
  const child = frame.contentDocument
  if (!child) throw new Error('Missing frame document')
  return child
}

describe('ThemeMenu', () => {
  beforeEach(() => {
    setTheme.mockClear()
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
  })

  afterEach(() => {
    cleanup()
    document.body.innerHTML = ''
    vi.unstubAllGlobals()
  })

  it('applies a selected color theme from the keyboard-accessible menu', async () => {
    const user = userEvent.setup()
    render(<ThemeMenu />)

    const trigger = screen.getByRole('button', { name: 'Choose color theme' })
    await waitFor(() => expect(trigger).toBeEnabled())
    await user.tab()
    expect(trigger).toHaveFocus()
    await user.keyboard('{Enter}')

    expect(
      (await screen.findAllByRole('menuitemradio')).map((item) => item.getAttribute('aria-label')),
    ).toEqual(['System theme', 'Light theme', 'Dark theme'])
    expect(screen.queryByText(/gentle|contrast/i)).not.toBeInTheDocument()

    const systemTheme = await screen.findByRole('menuitemradio', { name: 'System theme' })
    expect(systemTheme).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu', { name: 'Color theme' })).not.toBeInTheDocument()
    expect(trigger).toHaveFocus()

    await user.keyboard('{Enter}')
    const reopenedSystemTheme = await screen.findByRole('menuitemradio', {
      name: 'System theme',
    })
    expect(reopenedSystemTheme).toHaveFocus()
    const darkTheme = await screen.findByRole('menuitemradio', { name: 'Dark theme' })
    await user.keyboard('{ArrowUp}')
    expect(darkTheme).toHaveAttribute('data-highlighted')
    await user.click(darkTheme)

    expect(setTheme.mock.calls.at(-1)?.[0]).toBe('dark')
  })

  it('portals the popup into the page body, as Base UI does by default', async () => {
    const user = userEvent.setup()
    render(<ThemeMenu />)

    const trigger = screen.getByRole('button', { name: 'Choose color theme' })
    await waitFor(() => expect(trigger).toBeEnabled())
    await user.click(trigger)

    const menu = await screen.findByRole('menu')
    expect(menu.closest('[data-base-ui-portal]')?.parentElement).toBe(document.body)
  })

  it('keeps the popup in the document that owns the trigger, such as a preview frame', async () => {
    const child = frameDocument()
    render(<>{createPortal(<ThemeMenu />, child.body)}</>)
    const frame = within(child.body)

    const trigger = frame.getByRole('button', { name: 'Choose color theme' })
    await waitFor(() => expect(trigger).toBeEnabled())
    const user = userEvent.setup({ document: child })
    await user.click(trigger)

    const menu = await frame.findByRole('menu')
    expect(menu.closest('[data-base-ui-portal]')?.parentElement).toBe(child.body)
    expect(document.querySelector('[data-base-ui-portal]')).toBeNull()

    await user.click(frame.getByRole('menuitemradio', { name: 'Dark theme' }))
    expect(setTheme.mock.calls.at(-1)?.[0]).toBe('dark')
  })
})
