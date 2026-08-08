// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ImgHTMLAttributes } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createDesignLabRegistry } from '../contract'
import { createDesignLabStory } from '../seed'
import type { DesignLabActions, DesignLabStory } from '../types'
import { LedgerDesk, ledgerDirection, LedgerReader, LedgerWrite } from './ledger'

vi.mock('next/font/google', () => ({
  IBM_Plex_Mono: () => ({ variable: 'ledger-data-font' }),
  IBM_Plex_Sans: () => ({ variable: 'ledger-text-font' }),
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

function savedStory(overrides: Partial<DesignLabStory> = {}): DesignLabStory {
  return {
    ...story(),
    server: { id: 'story-1', revisionId: 'revision-1', revisionNumber: 1, version: 1 },
    ...overrides,
  }
}

describe('Ledger direction', () => {
  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('validates in a test-local registry and renders the seed story in every required view', () => {
    const registry = createDesignLabRegistry([ledgerDirection])
    expect(registry.list().map(({ id }) => id)).toEqual(['ledger'])
    expect(registry.first().metadata).toMatchObject({
      collection: 'Round 6 · Client set',
      name: 'Ledger',
      order: 'N8',
      thesis: 'The magazine as a beautifully designed form.',
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
    ['draft', 'Draft', 'Draft — saved just now'],
    ['scheduled', 'Scheduled', 'Scheduled — Sunday 08:00'],
    ['published', 'Published', 'Published'],
  ] as const)('pairs the %s state with an explicit state-row sentence', (status, label, copy) => {
    render(<LedgerDesk actions={actions} story={story(status)} />)

    const stateRow = screen.getByTestId('ledger-row-state')
    expect(screen.getByTestId('ledger-lifecycle-state')).toHaveAttribute('data-state', status)
    expect(screen.getByTestId('ledger-lifecycle-copy')).toHaveTextContent(copy)
    expect(within(stateRow).getAllByText(label).length).toBeGreaterThan(0)
  })

  it('renders the story as a labeled specification sheet with a full-row primary action', async () => {
    const user = userEvent.setup()
    render(<LedgerDesk actions={actions} story={story()} />)

    const specification = screen.getByTestId('ledger-specification')
    for (const label of ['Title', 'Section', 'Length', 'Photography', 'State']) {
      expect(within(specification).getByText(label)).toBeInTheDocument()
    }
    await user.click(screen.getByRole('button', { name: 'Start a new post' }))
    await user.click(screen.getByRole('button', { name: 'Open story' }))
    await user.click(screen.getByRole('button', { name: 'Preview story' }))
    expect(actions.createStory).toHaveBeenCalledOnce()
    expect(actions.setView).toHaveBeenNthCalledWith(1, 'write')
    expect(actions.setView).toHaveBeenNthCalledWith(2, 'reader')
  })

  it('derives A–D readiness words from the existing story fields', () => {
    const { rerender } = render(<LedgerWrite actions={actions} story={savedStory()} />)

    for (const index of ['A', 'B', 'C', 'D']) {
      expect(screen.getByTestId(`ledger-readiness-${index}`)).toHaveTextContent('Done')
      expect(screen.getByTestId(`ledger-section-${index.toLowerCase()}`)).toHaveAttribute(
        'data-readiness',
        'done',
      )
    }

    rerender(
      <LedgerWrite
        actions={actions}
        story={savedStory({ body: '', dek: '', imageAlt: '', server: null, title: '' })}
      />,
    )
    for (const index of ['A', 'B', 'C', 'D']) {
      expect(screen.getByTestId(`ledger-readiness-${index}`)).toHaveTextContent('Needs you')
      expect(screen.getByTestId(`ledger-section-${index.toLowerCase()}`)).toHaveAttribute(
        'data-readiness',
        'needs-you',
      )
    }
  })

  it('keeps every direction control at least 44px and marked utility text at least 11px', () => {
    for (const View of [LedgerDesk, LedgerWrite, LedgerReader]) {
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

  it('keeps shared fields, photography, summary focus, preview, and publication connected', async () => {
    const user = userEvent.setup()
    const initial = story()
    render(<LedgerWrite actions={actions} story={initial} />)

    expect(screen.getByLabelText('Story title')).toHaveValue(initial.title)
    expect(screen.getByLabelText('Short summary')).toHaveValue(initial.dek)
    expect(screen.getByLabelText('Story body')).toHaveValue(initial.body)
    expect(
      screen.getByText('One good picture is enough. Describe it for every reader.'),
    ).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Add photograph' }))
    await user.click(screen.getByRole('button', { name: 'Edit summary above' }))
    expect(screen.getByLabelText('Short summary')).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Preview story' }))
    await user.click(screen.getByRole('button', { name: 'Review publication' }))
    expect(actions.openUpload).toHaveBeenCalledOnce()
    expect(actions.setView).toHaveBeenCalledWith('reader')
    expect(actions.openPublication).toHaveBeenCalledOnce()
  })

  it('keeps the indexed reader story to owner-authored copy and its numbered caption', async () => {
    const user = userEvent.setup()
    const ownerStory = savedStory({
      imageCaption: 'Winter light crosses the studio floor',
      imageCredit: 'North House studio',
      status: 'published',
    })
    render(<LedgerReader actions={actions} story={ownerStory} />)

    const article = screen.getByTestId('ledger-reader-story')
    const index = within(article).getByLabelText('Story index')
    expect(index).toHaveTextContent(ownerStory.section)
    expect(index).toHaveTextContent('Published')
    expect(index).toHaveTextContent('1 min read')
    expect(within(article).getByRole('heading', { level: 1 })).toHaveTextContent(ownerStory.title)
    expect(within(article).getByText(ownerStory.dek)).toBeInTheDocument()
    for (const paragraph of ownerStory.body.split(/\n\n+/)) {
      expect(within(article).getByText(paragraph)).toBeInTheDocument()
    }
    expect(within(article).getByText(`Fig. 1 — ${ownerStory.imageCaption}`)).toBeInTheDocument()
    expect(within(article).queryByText(ownerStory.imageCredit!)).not.toBeInTheDocument()
    expect(within(article).queryByText('Review publication')).not.toBeInTheDocument()

    await user.click(screen.getByTestId('ledger-reader-publication-action'))
    expect(actions.openPublication).toHaveBeenCalledOnce()
  })
})
