// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ImgHTMLAttributes } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createDesignLabRegistry } from '../contract'
import { createDesignLabStory } from '../seed'
import type { DesignLabActions, DesignLabStory } from '../types'
import { HearthDesk, hearthDirection, HearthReader, HearthWrite } from './hearth'

vi.mock('next/font/google', () => ({
  Nunito_Sans: () => ({ variable: 'hearth-font' }),
}))

vi.mock('next/image', () => ({
  default: ({
    alt,
    fill: _fill,
    priority: _priority,
    unoptimized: _unoptimized,
    ...props
  }: ImgHTMLAttributes<HTMLImageElement> & {
    readonly fill?: boolean
    readonly priority?: boolean
    readonly unoptimized?: boolean
  }) => (
    // eslint-disable-next-line @next/next/no-img-element -- this test double preserves Next Image output semantics
    <img alt={alt ?? ''} {...props} />
  ),
}))

const actions: DesignLabActions = {
  change: vi.fn(),
  createStory: vi.fn(),
  openPublication: vi.fn(),
  openUpload: vi.fn(),
  setView: vi.fn(),
}

function story(status: DesignLabStory['status'] = 'draft'): DesignLabStory {
  return { ...createDesignLabStory(), status }
}

describe('Hearth direction', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('validates in a test-local registry and renders the seed story in every required view', () => {
    const registry = createDesignLabRegistry([hearthDirection])
    expect(registry.list().map(({ id }) => id)).toEqual(['hearth'])
    expect(registry.first().metadata).toMatchObject({
      collection: 'Round 6 · Client set',
      name: 'Hearth',
      order: 'N5',
      thesis: 'Writing is handwork.',
    })

    for (const view of ['desk', 'write', 'reader'] as const) {
      const rendered = render(
        createElement(registry.first().views[view], { actions, story: story() }),
      )
      expect(rendered.getByRole('heading', { level: 1, name: story().title })).toBeInTheDocument()
      expect(rendered.container.firstElementChild).toHaveAttribute('data-view', view)
      rendered.unmount()
    }
  })

  it.each([
    ['draft', 'Write', 'Draft — saved just now'],
    ['scheduled', 'Ready', 'Scheduled — goes out Sunday 08:00'],
    ['published', 'Out in the world', 'Published — readers can see this'],
  ] as const)('pairs the %s lifecycle with a named current station', (status, station, copy) => {
    render(<HearthDesk actions={actions} story={story(status)} />)

    const current = screen
      .getAllByRole('listitem')
      .find((item) => item.hasAttribute('aria-current'))
    expect(current).toHaveAttribute('aria-current', 'step')
    expect(current).toHaveTextContent(station)
    expect(screen.getByTestId('hearth-lifecycle-state')).toHaveAttribute('data-state', status)
    expect(screen.getByTestId('hearth-lifecycle-state')).toHaveTextContent(copy)
  })

  it('keeps the owner journey literal from the writing table', async () => {
    const user = userEvent.setup()
    render(<HearthDesk actions={actions} story={story()} />)

    await user.click(screen.getByRole('button', { name: 'Start a new post' }))
    await user.click(screen.getByRole('button', { name: 'Keep writing' }))
    await user.click(screen.getByRole('button', { name: 'Look at it' }))
    expect(actions.createStory).toHaveBeenCalledOnce()
    expect(actions.setView).toHaveBeenNthCalledWith(1, 'write')
    expect(actions.setView).toHaveBeenNthCalledWith(2, 'reader')
  })

  it('keeps every direction control at least 44px and marked utility text at least 11px', () => {
    const { container } = render(<HearthDesk actions={actions} story={story()} />)

    for (const control of screen.getAllByRole('button')) {
      expect(Number.parseFloat(getComputedStyle(control).minHeight)).toBeGreaterThanOrEqual(44)
      expect(Number.parseFloat(getComputedStyle(control).minWidth)).toBeGreaterThanOrEqual(44)
    }

    const smallestText = container.querySelectorAll('[data-ui-text="true"]')
    expect(smallestText.length).toBeGreaterThan(0)
    for (const element of smallestText) {
      expect(Number.parseFloat(getComputedStyle(element).fontSize)).toBeGreaterThanOrEqual(11)
    }
  })

  it('keeps the shared owner fields editable and routes photo, preview, and review actions', async () => {
    const user = userEvent.setup()
    const initial = story()
    const { rerender } = render(<HearthWrite actions={actions} story={initial} />)

    expect(screen.getByLabelText('Story title')).toHaveValue(initial.title)
    expect(screen.getByLabelText('Short summary')).toHaveValue(initial.dek)
    expect(screen.getByLabelText('Story body')).toHaveValue(initial.body)

    const revised = { ...initial, title: 'A story shaped by hand' }
    rerender(<HearthWrite actions={actions} story={revised} />)
    expect(screen.getByRole('heading', { level: 1, name: revised.title })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Add photo' }))
    await user.click(screen.getByRole('button', { name: 'Look at it' }))
    await user.click(screen.getByRole('button', { name: 'Review publication' }))
    expect(actions.openUpload).toHaveBeenCalledOnce()
    expect(actions.setView).toHaveBeenCalledWith('reader')
    expect(actions.openPublication).toHaveBeenCalledOnce()
  })

  it('keeps the public story to owner-authored copy and optional photo notes', () => {
    const ownerStory = {
      ...story('published'),
      imageCaption: 'Winter light across the workroom table',
      imageCredit: 'North House studio',
    }
    render(<HearthReader actions={actions} story={ownerStory} />)

    const article = screen.getByTestId('hearth-reader-story')
    expect(within(article).getByRole('heading', { level: 1 })).toHaveTextContent(ownerStory.title)
    expect(within(article).getByText(ownerStory.dek)).toBeInTheDocument()
    expect(within(article).getByText(ownerStory.imageCaption)).toBeInTheDocument()
    expect(within(article).getByText(ownerStory.imageCredit)).toBeInTheDocument()
    expect(within(article).queryByText('Your writing table')).not.toBeInTheDocument()
  })
})
