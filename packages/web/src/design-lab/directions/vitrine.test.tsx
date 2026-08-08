// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ImgHTMLAttributes } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createDesignLabRegistry } from '../contract'
import { createDesignLabStory } from '../seed'
import type { DesignLabActions, DesignLabStory } from '../types'
import { VitrineDesk, vitrineDirection, VitrineReader, VitrineWrite } from './vitrine'

vi.mock('next/font/google', () => ({
  Montserrat: () => ({ variable: 'vitrine-display-font' }),
  Newsreader: () => ({ variable: 'vitrine-text-font' }),
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

describe('Vitrine direction', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('validates in a test-local registry and renders the seed story in every required view', () => {
    const registry = createDesignLabRegistry([vitrineDirection])
    expect(registry.list().map(({ id }) => id)).toEqual(['vitrine'])
    expect(registry.first().metadata).toMatchObject({
      collection: 'Round 6 · Client set',
      name: 'Vitrine',
      order: 'N6',
      thesis: 'The story under glass.',
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
    ['draft', 'Draft — saved just now', 'false'],
    ['scheduled', 'Scheduled — Sunday 08:00', 'true'],
    ['published', 'Published', 'true'],
  ] as const)(
    'pairs the %s lifecycle with text and a restrained state mark',
    (status, copy, accent) => {
      render(<VitrineDesk actions={actions} story={story(status)} />)

      expect(screen.getByTestId('vitrine-lifecycle-state')).toHaveAttribute('data-state', status)
      expect(screen.getByTestId('vitrine-lifecycle-state')).toHaveTextContent(copy)
      expect(screen.getByTestId('vitrine-state-mark')).toHaveAttribute('data-accent', accent)
    },
  )

  it('names the next publication action in the caption plate', () => {
    render(<VitrineDesk actions={actions} story={story('scheduled')} />)

    expect(screen.getByTestId('vitrine-next-action')).toHaveTextContent(
      'Ready to publish — open Review publication.',
    )
  })

  it('keeps every direction control at least 44px and marked utility text at least 11px', () => {
    const { container } = render(<VitrineDesk actions={actions} story={story()} />)

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

  it('keeps the owner journey literal from the desk', async () => {
    const user = userEvent.setup()
    render(<VitrineDesk actions={actions} story={story()} />)

    await user.click(screen.getByRole('button', { name: 'Start a new post' }))
    await user.click(screen.getByRole('button', { name: 'Open story' }))
    await user.click(screen.getByRole('button', { name: 'Preview story' }))
    expect(actions.createStory).toHaveBeenCalledOnce()
    expect(actions.setView).toHaveBeenNthCalledWith(1, 'write')
    expect(actions.setView).toHaveBeenNthCalledWith(2, 'reader')
  })

  it('keeps shared fields editable and routes image and publication actions', async () => {
    const user = userEvent.setup()
    const initial = story()
    const { rerender } = render(<VitrineWrite actions={actions} story={initial} />)

    expect(screen.getByLabelText('Story title')).toHaveValue(initial.title)
    expect(screen.getByLabelText('Short summary')).toHaveValue(initial.dek)
    expect(screen.getByLabelText('Story body')).toHaveValue(initial.body)

    const revised = { ...initial, title: 'An object held in winter light' }
    rerender(<VitrineWrite actions={actions} story={revised} />)
    expect(screen.getByRole('heading', { level: 1, name: revised.title })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Add image' }))
    await user.click(screen.getByRole('button', { name: 'Review publication' }))
    expect(actions.openUpload).toHaveBeenCalledOnce()
    expect(actions.openPublication).toHaveBeenCalledOnce()
  })

  it('shows the exact save-confidence state quietly in write chrome', () => {
    render(<VitrineWrite actions={actions} story={{ ...story(), saved: 'Saved just now' }} />)

    const saved = screen.getByText('Saved just now', { exact: true })
    expect(saved).toHaveAttribute('data-ui-text', 'true')
    expect(Number.parseFloat(getComputedStyle(saved).fontSize)).toBeGreaterThanOrEqual(11)
  })

  it('keeps the public exhibition to owner-authored copy and optional plate notes', async () => {
    const user = userEvent.setup()
    const ownerStory = {
      ...story('published'),
      imageCaption: 'Winter light across the gallery room',
      imageCredit: 'North House studio',
    }
    render(<VitrineReader actions={actions} story={ownerStory} />)

    const article = screen.getByTestId('vitrine-reader-story')
    expect(within(article).getByRole('heading', { level: 1 })).toHaveTextContent(ownerStory.title)
    expect(within(article).getByText(ownerStory.dek)).toBeInTheDocument()
    expect(within(article).getByText(ownerStory.imageCaption)).toBeInTheDocument()
    expect(within(article).getByText(ownerStory.imageCredit)).toBeInTheDocument()
    expect(within(article).queryByText('Reader preview')).not.toBeInTheDocument()
    expect(within(article).queryByText('Review publication')).not.toBeInTheDocument()
    const lifecycle = screen.getByTestId('vitrine-lifecycle-state')
    expect(lifecycle).toHaveTextContent('Published')
    expect(screen.getByTestId('vitrine-next-action')).toHaveTextContent(
      'Published — open Review publication to make changes.',
    )
    expect(article.contains(lifecycle)).toBe(false)

    await user.click(screen.getByTestId('vitrine-reader-publication-action'))
    expect(actions.openPublication).toHaveBeenCalledOnce()
  })
})
