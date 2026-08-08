// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ImgHTMLAttributes } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createDesignLabRegistry } from '../contract'
import { createDesignLabStory } from '../seed'
import type { DesignLabActions, DesignLabStory } from '../types'
import { wordCount } from '../view-helpers'
import {
  MeridianDesk,
  meridianDirection,
  meridianPalette,
  MeridianReader,
  MeridianWrite,
} from './meridian'

vi.mock('next/font/google', () => ({
  Archivo: () => ({ variable: 'meridian-display-font' }),
  IBM_Plex_Mono: () => ({ variable: 'meridian-data-font' }),
  Public_Sans: () => ({ variable: 'meridian-text-font' }),
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

function luminance(hex: string): number {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((value) => Number.parseInt(value, 16) / 255)
    .map((value) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4))
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!
}

function contrast(first: string, second: string): number {
  const values = [luminance(first), luminance(second)].sort((left, right) => right - left)
  return (values[0]! + 0.05) / (values[1]! + 0.05)
}

describe('Meridian direction', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('validates in a test-local registry and renders the seed story in every required view', () => {
    const registry = createDesignLabRegistry([meridianDirection])
    expect(registry.list().map(({ id }) => id)).toEqual(['meridian'])
    expect(registry.first().metadata).toMatchObject({
      collection: 'Round 6 · Client set',
      name: 'Meridian',
      order: 'N9',
      thesis: 'The magazine as a native publishing instrument.',
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
    ['draft', 'DRAFT', 'Keep writing, then review publication.'],
    ['scheduled', 'SCHEDULED · SUN 08:00', 'This story is set for Sunday at 08:00.'],
    ['published', 'LIVE', 'Readers can see this story now.'],
  ] as const)(
    'pairs the %s signal chip with a plain next-action sentence',
    (status, chip, copy) => {
      render(<MeridianDesk actions={actions} story={story(status)} />)

      const lifecycle = screen.getByTestId('meridian-lifecycle-state')
      expect(lifecycle).toHaveAttribute('data-state', status)
      expect(lifecycle).toHaveAccessibleName(`${chip}. ${copy}`)
      expect(screen.getByTestId('meridian-lifecycle-chip')).toHaveTextContent(chip)
      expect(screen.getByTestId('meridian-lifecycle-sentence')).toHaveTextContent(copy)
    },
  )

  it('keeps the active story rail to real status, saved, section, length, and photography data', () => {
    const activeStory = story()
    render(<MeridianDesk actions={actions} story={activeStory} />)

    const rail = screen.getByRole('complementary', { name: 'Active story instrument' })
    expect(within(rail).getByText(activeStory.saved)).toBeInTheDocument()
    expect(within(rail).getByText(activeStory.section)).toBeInTheDocument()
    expect(within(rail).getByText(`${wordCount(activeStory)} words`)).toBeInTheDocument()
    expect(within(rail).getByText(activeStory.imageAlt)).toBeInTheDocument()
  })

  it('keeps the brief palette on the root and verifies its text pairings at WCAG AA', () => {
    const { container } = render(<MeridianDesk actions={actions} story={story()} />)
    const root = container.firstElementChild as HTMLElement

    expect(root.style.getPropertyValue('--meridian-field')).toBe(meridianPalette.field)
    expect(root.style.getPropertyValue('--meridian-recessed')).toBe(meridianPalette.recessed)
    expect(root.style.getPropertyValue('--meridian-pearl')).toBe(meridianPalette.pearl)
    expect(root.style.getPropertyValue('--meridian-tangerine')).toBe(meridianPalette.tangerine)
    expect(root.style.getPropertyValue('--meridian-sky')).toBe(meridianPalette.sky)
    expect(contrast(meridianPalette.pearl, meridianPalette.field)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(meridianPalette.pearl, meridianPalette.recessed)).toBeGreaterThanOrEqual(4.5)
    expect(contrast(meridianPalette.recessed, meridianPalette.tangerine)).toBeGreaterThanOrEqual(
      4.5,
    )
    expect(contrast(meridianPalette.recessed, meridianPalette.sky)).toBeGreaterThanOrEqual(4.5)
  })

  it('keeps every direction control at least 44px and marked utility text at least 11px', () => {
    for (const View of [MeridianDesk, MeridianWrite, MeridianReader]) {
      const rendered = render(<View actions={actions} story={story()} />)

      for (const control of rendered.getAllByRole('button')) {
        expect(Number.parseFloat(getComputedStyle(control).minHeight)).toBeGreaterThanOrEqual(44)
        expect(Number.parseFloat(getComputedStyle(control).minWidth)).toBeGreaterThanOrEqual(44)
      }
      const utilityText = rendered.container.querySelectorAll('[data-ui-text="true"]')
      expect(utilityText.length).toBeGreaterThan(0)
      for (const element of utilityText) {
        expect(Number.parseFloat(getComputedStyle(element).fontSize)).toBeGreaterThanOrEqual(11)
      }
      rendered.unmount()
    }
  })

  it('keeps every desk command identical to its visible shared action', async () => {
    const user = userEvent.setup()
    render(<MeridianDesk actions={actions} story={story()} />)

    for (const label of ['Start a new post', 'Open story', 'Preview story']) {
      await user.click(screen.getByRole('button', { name: label }))
      await user.click(screen.getByRole('button', { name: 'Command bar' }))
      const dialog = screen.getByRole('dialog', { name: 'Meridian commands' })
      await user.click(within(dialog).getByRole('button', { name: label }))
    }

    expect(actions.createStory).toHaveBeenCalledTimes(2)
    expect(actions.setView).toHaveBeenNthCalledWith(1, 'write')
    expect(actions.setView).toHaveBeenNthCalledWith(2, 'write')
    expect(actions.setView).toHaveBeenNthCalledWith(3, 'reader')
    expect(actions.setView).toHaveBeenNthCalledWith(4, 'reader')
  })

  it('keeps write commands identical to the visible editor, media, preview, and review controls', async () => {
    const user = userEvent.setup()
    render(<MeridianWrite actions={actions} story={story()} />)

    for (const label of ['Story desk', 'Preview story', 'Add cover photo', 'Review publication']) {
      await user.click(screen.getByRole('button', { name: new RegExp(label) }))
      await user.click(screen.getByRole('button', { name: 'Command bar' }))
      const dialog = screen.getByRole('dialog', { name: 'Meridian commands' })
      await user.click(within(dialog).getByRole('button', { name: label }))
    }

    expect(actions.setView).toHaveBeenNthCalledWith(1, 'desk')
    expect(actions.setView).toHaveBeenNthCalledWith(2, 'desk')
    expect(actions.setView).toHaveBeenNthCalledWith(3, 'reader')
    expect(actions.setView).toHaveBeenNthCalledWith(4, 'reader')
    expect(actions.openUpload).toHaveBeenCalledTimes(2)
    expect(actions.openPublication).toHaveBeenCalledTimes(2)
  })

  it('keeps reader commands identical to the visible writing and publication controls', async () => {
    const user = userEvent.setup()
    render(<MeridianReader actions={actions} story={story('published')} />)

    for (const label of ['Back to writing', 'Review publication']) {
      await user.click(screen.getByRole('button', { name: new RegExp(label) }))
      await user.click(screen.getByRole('button', { name: 'Command bar' }))
      const dialog = screen.getByRole('dialog', { name: 'Meridian commands' })
      await user.click(within(dialog).getByRole('button', { name: label }))
    }

    expect(actions.setView).toHaveBeenNthCalledWith(1, 'write')
    expect(actions.setView).toHaveBeenNthCalledWith(2, 'write')
    expect(actions.openPublication).toHaveBeenCalledTimes(2)
  })

  it('opens the command bar from the keyboard but suppresses the shortcut while typing', () => {
    render(<MeridianWrite actions={actions} story={story()} />)

    fireEvent.keyDown(screen.getByLabelText('Story title'), { key: 'k', metaKey: true })
    expect(screen.queryByRole('dialog', { name: 'Meridian commands' })).not.toBeInTheDocument()

    fireEvent.keyDown(document.body, { key: 'k', metaKey: true })
    const dialog = screen.getByRole('dialog', { name: 'Meridian commands' })
    const search = within(dialog).getByLabelText('Find a command')
    expect(search).toHaveFocus()

    fireEvent.keyDown(search, { key: 'k', metaKey: true })
    expect(screen.getByRole('dialog', { name: 'Meridian commands' })).toBeInTheDocument()
    fireEvent.keyDown(search, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: 'Meridian commands' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Command bar' })).toHaveFocus()
  })

  it('keeps the shared editor, outline, photography, preview, and publication journey connected', async () => {
    const user = userEvent.setup()
    const activeStory = story()
    render(<MeridianWrite actions={actions} story={activeStory} />)

    expect(screen.getByLabelText('Story title')).toHaveValue(activeStory.title)
    expect(screen.getByLabelText('Short summary')).toHaveValue(activeStory.dek)
    expect(screen.getByLabelText('Story body')).toHaveValue(activeStory.body)
    const outline = screen.getByRole('list', { name: 'Story outline' })
    expect(within(outline).getByText(activeStory.title)).toBeInTheDocument()
    expect(within(outline).getByText(activeStory.dek)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Add cover photo' }))
    await user.click(screen.getByRole('button', { name: 'Preview story' }))
    await user.click(screen.getByRole('button', { name: 'Review publication' }))
    expect(actions.openUpload).toHaveBeenCalledOnce()
    expect(actions.setView).toHaveBeenCalledWith('reader')
    expect(actions.openPublication).toHaveBeenCalledOnce()
  })

  it('keeps the softened reader article to owner-authored copy and image notes', async () => {
    const user = userEvent.setup()
    const ownerStory = {
      ...story('published'),
      imageCaption: 'Winter light crosses the studio floor',
      imageCredit: 'North House studio',
    }
    render(<MeridianReader actions={actions} story={ownerStory} />)

    const article = screen.getByTestId('meridian-reader-story')
    expect(within(article).getByRole('heading', { level: 1 })).toHaveTextContent(ownerStory.title)
    expect(within(article).getByText(ownerStory.dek)).toBeInTheDocument()
    for (const paragraph of ownerStory.body.split(/\n\n+/)) {
      expect(within(article).getByText(paragraph)).toBeInTheDocument()
    }
    expect(within(article).getByText(ownerStory.imageCaption)).toBeInTheDocument()
    expect(within(article).getByText(ownerStory.imageCredit)).toBeInTheDocument()
    expect(within(article).queryByText('Review publication')).not.toBeInTheDocument()
    expect(article.contains(screen.getByTestId('meridian-lifecycle-state'))).toBe(false)

    await user.click(screen.getByTestId('meridian-reader-publication-action'))
    expect(actions.openPublication).toHaveBeenCalledOnce()
  })
})
