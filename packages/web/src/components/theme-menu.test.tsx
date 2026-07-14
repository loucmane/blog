// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

describe('ThemeMenu', () => {
  beforeEach(() => {
    setTheme.mockClear()
    vi.stubGlobal('ResizeObserver', ResizeObserverStub)
  })

  afterEach(() => {
    cleanup()
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
})
