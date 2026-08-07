// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ImgHTMLAttributes } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createDesignLabRegistry } from '../contract'
import { createDesignLabStory } from '../seed'
import type { DesignLabActions, DesignLabStory } from '../types'
import { FullbleedDesk, FullbleedReader, fullbleedDirection, FullbleedWrite } from './fullbleed'

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

class ImageFailureStub {
  crossOrigin = ''
  decoding = 'async'
  onerror: null | (() => void) = null
  onload: null | (() => void) = null

  set src(_source: string) {
    queueMicrotask(() => this.onerror?.())
  }
}

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

describe('Fullbleed direction', () => {
  beforeEach(() => {
    vi.stubGlobal('Image', ImageFailureStub)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('validates in a test-local registry and renders every required view', () => {
    const registry = createDesignLabRegistry([fullbleedDirection])
    expect(registry.list().map(({ id }) => id)).toEqual(['fullbleed'])
    expect(registry.first().metadata).toMatchObject({
      collection: 'Round 5 · New concepts',
      name: 'Fullbleed',
      order: 'N3',
      thesis: 'The photograph is the interface.',
    })

    for (const view of ['desk', 'write', 'reader'] as const) {
      const rendered = render(
        createElement(registry.first().views[view], { actions, story: story() }),
      )
      expect(rendered.container.firstElementChild).toHaveAttribute('data-grade-source', 'fallback')
      rendered.unmount()
    }
  })

  it.each([
    ['draft', 'Draft, saved just now'],
    ['scheduled', 'Scheduled for Sunday 08:00'],
    ['published', 'Published 3 August'],
  ] as const)('pairs the %s grade bar with a plain-language state', (status, copy) => {
    render(<FullbleedDesk actions={actions} story={story(status)} />)

    expect(screen.getByTestId('fullbleed-grade-bar')).toHaveAttribute('data-state', status)
    expect(screen.getByTestId('fullbleed-lifecycle-state')).toHaveTextContent(copy)
  })

  it('renders the overlay scrim and engages the deterministic fallback palette', () => {
    const { container } = render(<FullbleedReader actions={actions} story={story()} />)
    const root = container.firstElementChild as HTMLElement

    expect(screen.getByTestId('fullbleed-overlay-scrim')).toBeInTheDocument()
    expect(root).toHaveAttribute('data-grade-source', 'fallback')
    expect(root.style.getPropertyValue('--fullbleed-primary')).toBe('#E62E6B')
    expect(root.style.getPropertyValue('--fullbleed-readable')).toBe('#19B8D7')
    expect(root.style.getPropertyValue('--fullbleed-secondary')).toBe('#19B8D7')
    expect(root.style.getPropertyValue('--fullbleed-scrim')).toBe('rgba(0, 0, 0, 0.84)')
  })

  it('moves through the edge-docked filmstrip from the keyboard', async () => {
    const user = userEvent.setup()
    render(<FullbleedDesk actions={actions} story={story()} />)
    const frames = screen.getAllByRole('button', { name: /Story frame/ })

    frames[0]!.focus()
    await user.keyboard('{ArrowRight}')
    expect(frames[1]).toHaveFocus()
    await user.keyboard('{End}')
    expect(frames[2]).toHaveFocus()
    await user.keyboard('{Home}')
    expect(frames[0]).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(actions.setView).toHaveBeenCalledWith('write')
  })

  it('keeps desk controls at least 44px and visible text at least 11px', () => {
    const { container } = render(<FullbleedDesk actions={actions} story={story()} />)

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

  it('keeps shared editing behavior and first-class media actions in the write view', async () => {
    const user = userEvent.setup()
    render(<FullbleedWrite actions={actions} story={story()} />)

    expect(screen.getByLabelText('Story title')).toHaveValue(
      'The quiet architecture of winter light',
    )
    expect(screen.getByLabelText('Short summary')).toBeInTheDocument()
    expect(screen.getByLabelText('Story body')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add image' }))
    await user.click(screen.getByRole('button', { name: 'Caption' }))
    await user.click(screen.getByRole('button', { name: 'Credit' }))
    expect(actions.openUpload).toHaveBeenCalledTimes(3)
  })
})
