// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ImgHTMLAttributes } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createDesignLabRegistry } from '../contract'
import { createDesignLabStory } from '../seed'
import type { DesignLabActions, DesignLabStory } from '../types'
import { SpreadDesk, spreadDirection, SpreadReader, SpreadWrite } from './spread'

vi.mock('next/font/google', () => ({
  Archivo_Black: () => ({ variable: 'spread-display-font' }),
  Archivo_Narrow: () => ({ variable: 'spread-text-font' }),
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

describe('Spread direction', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('validates in a test-local registry and renders the seed story in every required view', () => {
    const registry = createDesignLabRegistry([spreadDirection])
    expect(registry.list().map(({ id }) => id)).toEqual(['spread'])
    expect(registry.first().metadata).toMatchObject({
      collection: 'Round 6 · Client set',
      name: 'Spread',
      order: 'N4',
      thesis: 'The headline is the interface.',
    })

    for (const view of ['desk', 'write', 'reader'] as const) {
      const rendered = render(
        createElement(registry.first().views[view], { actions, story: story() }),
      )
      expect(rendered.getByRole('heading', { name: story().title })).toBeInTheDocument()
      expect(rendered.container.firstElementChild).toHaveAttribute('data-view', view)
      rendered.unmount()
    }
  })

  it.each([
    ['draft', 'Draft — saved just now'],
    ['scheduled', 'Scheduled — Sunday 08:00'],
    ['published', 'Published'],
  ] as const)('pairs the %s lifecycle with visible imprint text', (status, copy) => {
    render(<SpreadDesk actions={actions} story={story(status)} />)

    const imprint = screen.getByTestId('spread-lifecycle-imprint')
    expect(imprint).toHaveAttribute('data-actionable', 'true')
    expect(imprint).toHaveAttribute('data-state', status)
    expect(imprint).toHaveTextContent(copy)
  })

  it('keeps a compact mobile action bar with explicit owner actions', async () => {
    const user = userEvent.setup()
    render(<SpreadReader actions={actions} story={story()} />)

    const bar = screen.getByTestId('spread-mobile-actions')
    await user.click(within(bar).getByRole('button', { name: 'Begin a story' }))
    await user.click(within(bar).getByRole('button', { name: 'Review publication' }))
    expect(actions.createStory).toHaveBeenCalledOnce()
    expect(actions.openPublication).toHaveBeenCalledOnce()
  })

  it('keeps every direction control at least 44px and marked utility text at least 11px', () => {
    const { container } = render(<SpreadDesk actions={actions} story={story()} />)

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

  it('keeps the write preview live and the shared owner fields editable', async () => {
    const user = userEvent.setup()
    const initial = story()
    const { rerender } = render(<SpreadWrite actions={actions} story={initial} />)
    const preview = screen.getByTestId('spread-live-preview')

    expect(within(preview).getByRole('heading', { name: initial.title })).toBeInTheDocument()
    expect(screen.getByLabelText('Story title')).toHaveValue(initial.title)
    expect(screen.getByLabelText('Short summary')).toHaveValue(initial.dek)
    expect(screen.getByLabelText('Story body')).toHaveValue(initial.body)

    const revised = { ...initial, title: 'A headline recomposed live' }
    rerender(<SpreadWrite actions={actions} story={revised} />)
    expect(
      within(screen.getByTestId('spread-live-preview')).getByRole('heading', {
        name: revised.title,
      }),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Add image' }))
    await user.click(screen.getByRole('button', { name: 'Caption' }))
    await user.click(screen.getByRole('button', { name: 'Credit' }))
    expect(actions.openUpload).toHaveBeenCalledTimes(3)
  })
})
