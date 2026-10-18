// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ReaderLabBarHelp } from './lab-bar-help'
import { ReaderLabTour } from './lab-tour'
import { labIntroductionKeys } from './use-lab-introduction'

beforeEach(() => {
  window.localStorage.clear()
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

describe('Reader Lab introduction', () => {
  it('opens on the first visit, dismisses with Escape, restores focus and can replay from step one', async () => {
    const user = userEvent.setup()
    const first = render(<ReaderLabTour />)
    expect(await screen.findByRole('dialog', { name: 'Reader Lab tour' })).toBeVisible()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Close tour' })).toHaveFocus())
    await user.click(screen.getByRole('button', { name: 'Next step' }))
    expect(screen.getByText('Step 2 of 6')).toBeVisible()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Take the tour' })).toHaveFocus()
    expect(window.localStorage.getItem(labIntroductionKeys.tour)).toBe('dismissed')
    first.unmount()

    render(<ReaderLabTour />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Take the tour' }))
    expect(await screen.findByText('Step 1 of 6')).toBeVisible()
  })

  it('remembers a seen tour even when navigation happened before dismissal', () => {
    window.localStorage.setItem(labIntroductionKeys.tour, 'seen')
    render(<ReaderLabTour />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('dismisses on an outside press without swallowing the direction action', async () => {
    const user = userEvent.setup()
    const openDirection = vi.fn()
    render(
      <>
        <ReaderLabTour />
        <button onClick={openDirection} type="button">
          View the site in this direction
        </button>
      </>,
    )
    await waitFor(() => expect(screen.getByRole('button', { name: 'Close tour' })).toHaveFocus())
    await user.click(screen.getByText('View the site in this direction'))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(openDirection).toHaveBeenCalledOnce()
    expect(window.localStorage.getItem(labIntroductionKeys.tour)).toBe('dismissed')
  })

  it('traps keyboard focus and completes all six steps', async () => {
    const user = userEvent.setup()
    render(<ReaderLabTour />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Close tour' })).toHaveFocus())
    await user.tab({ shift: true })
    await waitFor(() => expect(screen.getByRole('button', { name: 'Next step' })).toHaveFocus())
    for (let index = 0; index < 5; index++) {
      await user.click(screen.getByRole('button', { name: 'Next step' }))
    }
    expect(screen.getByText('Step 6 of 6')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByText('Step 5 of 6')).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Next step' }))
    await user.click(screen.getByRole('button', { name: 'Finish tour' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('still opens, dismisses and replays when access to storage throws', async () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('Storage blocked')
    })
    const user = userEvent.setup()
    render(<ReaderLabTour />)
    await user.click(await screen.findByRole('button', { name: 'Close tour' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Take the tour' }))
    expect(await screen.findByRole('dialog')).toBeVisible()
  })

  it('allows dismissal when reading succeeds but storing the preference fails', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Quota exceeded')
    })
    const user = userEvent.setup()
    render(<ReaderLabTour />)
    await user.click(await screen.findByRole('button', { name: 'Close tour' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('shows bar help once independently of the tour, then restores focus to the bar', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(labIntroductionKeys.tour, 'dismissed')
    const bar = (
      <section data-reader-lab-bar="">
        <button type="button">Previous direction</button>
        <ReaderLabBarHelp />
      </section>
    )
    const first = render(bar)
    expect(await screen.findByRole('dialog', { name: 'Compare directions here' })).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Got it' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Previous direction' })).toHaveFocus()
    expect(window.localStorage.getItem(labIntroductionKeys.bar)).toBe('dismissed')
    first.unmount()
    render(bar)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it.each(['Previous direction', 'Next direction', 'All directions', 'Exit lab'])(
    'lets an outside press activate %s while bar help is open',
    async (label) => {
      const user = userEvent.setup()
      const navigate = vi.fn()
      render(
        <section data-reader-lab-bar="">
          <button onClick={navigate} type="button">
            {label}
          </button>
          <ReaderLabBarHelp />
        </section>,
      )
      await waitFor(() => expect(screen.getByRole('button', { name: 'Got it' })).toHaveFocus())
      await user.click(screen.getByText(label))
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      expect(navigate).toHaveBeenCalledOnce()
      expect(window.localStorage.getItem(labIntroductionKeys.bar)).toBe('dismissed')
    },
  )
})
