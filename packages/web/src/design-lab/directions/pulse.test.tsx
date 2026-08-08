// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ImgHTMLAttributes } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createDesignLabRegistry } from '../contract'
import { createDesignLabStory } from '../seed'
import type { DesignLabActions, DesignLabStory } from '../types'
import { PulseDesk, pulseDirection, PulseReader, PulseWrite } from './pulse'

const fontMocks = vi.hoisted(() => {
  const archivoOptions: unknown[] = []
  return {
    archivo: (options: unknown) => {
      archivoOptions.push(options)
      return { variable: 'pulse-display-font' }
    },
    archivoOptions,
  }
})

vi.mock('next/font/google', () => ({
  Archivo: fontMocks.archivo,
  IBM_Plex_Mono: () => ({ variable: 'pulse-stamp-font' }),
  Public_Sans: () => ({ variable: 'pulse-text-font' }),
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

describe('Pulse direction', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('uses Archivo as a variable font when requesting its width axis', () => {
    expect(fontMocks.archivoOptions).toContainEqual(
      expect.objectContaining({ axes: ['wdth'], weight: 'variable' }),
    )
  })

  it('validates in a test-local registry and renders the seed story in every required view', () => {
    const registry = createDesignLabRegistry([pulseDirection])
    expect(registry.list().map(({ id }) => id)).toEqual(['pulse'])
    expect(registry.first().metadata).toMatchObject({
      collection: 'Round 6 · Client set',
      name: 'Pulse',
      order: 'N7',
      thesis: 'A culture front page with a heartbeat.',
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
    ['draft', 'Draft', 'saved just now'],
    ['scheduled', 'Scheduled', 'Sunday 08:00'],
    ['published', 'Published', 'Readers can see this story now.'],
  ] as const)('pairs the %s lifecycle stamp with explicit text', (status, stamp, sentence) => {
    render(<PulseDesk actions={actions} story={story(status)} />)

    const lifecycle = screen.getByTestId('pulse-lifecycle-state')
    expect(lifecycle).toHaveAttribute('data-state', status)
    expect(lifecycle).toHaveAccessibleName(`${stamp} — ${sentence}`)
    expect(screen.getByTestId('pulse-lifecycle-stamp')).toHaveTextContent(stamp)
    expect(screen.getByTestId('pulse-lifecycle-sentence')).toHaveTextContent(sentence)
  })

  it('reserves exactly one yellow element for the primary action in every view', () => {
    const expectations = [
      [PulseDesk, 'Start a new post'],
      [PulseWrite, 'Review publication'],
      [PulseReader, 'Review publication'],
    ] as const

    for (const [View, actionName] of expectations) {
      const rendered = render(<View actions={actions} story={story()} />)
      const yellowElements = rendered.container.querySelectorAll('[data-pulse-yellow="true"]')
      expect(yellowElements).toHaveLength(1)
      expect(yellowElements.item(0)).toBe(rendered.getByRole('button', { name: actionName }))
      rendered.unmount()
    }
  })

  it('keeps every direction control at least 44px and marked utility text at least 11px', () => {
    for (const View of [PulseDesk, PulseWrite, PulseReader]) {
      const rendered = render(<View actions={actions} story={story()} />)

      for (const control of rendered.getAllByRole('button')) {
        expect(Number.parseFloat(getComputedStyle(control).minHeight)).toBeGreaterThanOrEqual(44)
        expect(Number.parseFloat(getComputedStyle(control).minWidth)).toBeGreaterThanOrEqual(44)
      }

      const smallestText = rendered.container.querySelectorAll('[data-ui-text="true"]')
      expect(smallestText.length).toBeGreaterThan(0)
      for (const element of smallestText) {
        expect(Number.parseFloat(getComputedStyle(element).fontSize)).toBeGreaterThanOrEqual(11)
      }
      rendered.unmount()
    }
  })

  it('keeps the desk journey literal and the section stamp motion singular', async () => {
    const user = userEvent.setup()
    render(<PulseDesk actions={actions} story={story()} />)

    expect(screen.getByTestId('pulse-section-stamp')).toHaveAttribute('data-motion', 'press-once')
    await user.click(screen.getByRole('button', { name: 'Start a new post' }))
    await user.click(screen.getByRole('button', { name: 'Open story' }))
    await user.click(screen.getByRole('button', { name: 'Preview story' }))
    expect(actions.createStory).toHaveBeenCalledOnce()
    expect(actions.setView).toHaveBeenNthCalledWith(1, 'write')
    expect(actions.setView).toHaveBeenNthCalledWith(2, 'reader')
  })

  it('keeps the live cover, shared fields, media, and publication actions connected', async () => {
    const user = userEvent.setup()
    const initial = story()
    const { rerender } = render(<PulseWrite actions={actions} story={initial} />)

    expect(screen.getByLabelText('Story title')).toHaveValue(initial.title)
    expect(screen.getByLabelText('Short summary')).toHaveValue(initial.dek)
    expect(screen.getByLabelText('Story body')).toHaveValue(initial.body)

    const revised = { ...initial, title: 'Culture moves at the speed of the room' }
    rerender(<PulseWrite actions={actions} story={revised} />)
    expect(screen.getByRole('heading', { level: 1, name: revised.title })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Add cover photo' }))
    await user.click(screen.getByRole('button', { name: 'Review publication' }))
    expect(actions.openUpload).toHaveBeenCalledOnce()
    expect(actions.openPublication).toHaveBeenCalledOnce()
  })

  it('keeps the reader feature to owner-authored copy and stamped image notes', async () => {
    const user = userEvent.setup()
    const ownerStory = {
      ...story('published'),
      imageCaption: 'Winter light crosses the studio floor',
      imageCredit: 'North House studio',
    }
    render(<PulseReader actions={actions} story={ownerStory} />)

    const article = screen.getByTestId('pulse-reader-story')
    expect(within(article).getByRole('heading', { level: 1 })).toHaveTextContent(ownerStory.title)
    expect(within(article).getByText(ownerStory.dek)).toBeInTheDocument()
    for (const paragraph of ownerStory.body.split(/\n\n+/)) {
      expect(within(article).getByText(paragraph)).toBeInTheDocument()
    }
    expect(within(article).getByText(ownerStory.imageCaption)).toBeInTheDocument()
    expect(within(article).getByText(ownerStory.imageCredit)).toBeInTheDocument()
    expect(within(article).queryByText('Review publication')).not.toBeInTheDocument()
    expect(article.contains(screen.getByTestId('pulse-lifecycle-state'))).toBe(false)

    await user.click(screen.getByTestId('pulse-reader-publication-action'))
    expect(actions.openPublication).toHaveBeenCalledOnce()
  })
})
