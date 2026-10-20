// @vitest-environment jsdom
import { within } from '@testing-library/dom'
import { fireEvent, render } from '@testing-library/react'
import postcss from 'postcss'
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

import type { ReaderImage, StoryCard } from '@/reader/views'

import { literaryLongreadDirection as direction } from './index'
import { styles } from './styles'

const image: ReaderImage = {
  alt: 'The whole dining room',
  animated: false,
  caption: 'A long caption that needs room below the small index thumbnail.',
  contentType: 'image/jpeg',
  credit: { name: 'North House archive', url: 'https://example.org/archive' },
  focalPoint: { x: 0.25, y: 0.75 },
  height: 1200,
  mediaId: 'room',
  src: '/api/media/room',
  width: 1800,
}
const story: StoryCard = {
  dek: 'An introduction.',
  href: '/stories/room',
  image,
  publishedAt: '2026-10-19T12:00:00Z',
  readingMinutes: 4,
  section: null,
  slug: 'room',
  title: 'A room for reading',
}
const navigation = { sections: [] }
const failureView = { navigation, siteName: 'The supplied magazine name' }

function markup(element: ReactNode) {
  const container = document.createElement('div')
  container.innerHTML = renderToStaticMarkup(element)
  return container
}

describe('Literary Long-read b3', () => {
  it('sizes the cover for the source pixels used by its crop, keeping preload and picture identical', () => {
    const container = markup(<direction.Home view={{ lead: story, recent: [], navigation }} />)
    const cover = container.querySelector('.ll-cover-image img')!
    // 3:2 source in a 4:5 desktop frame: 624 * 1.5 / 0.8 = 1170 pixels.
    // Mobile is 4:3: (390 - 40) * 1.5 / (4/3) = 393.75 pixels before DPR.
    const sizes =
      '(min-width: 1344px) 73.125rem, (min-width: 1024px) calc(93.75vw - 5.625rem), (min-width: 768px) calc(93.75vw - 2.8125rem), calc(112.5vw - 2.8125rem)'
    expect(cover).toHaveAttribute('sizes', sizes)
    for (const source of container.querySelectorAll('.ll-cover-image source')) {
      expect(source).toHaveAttribute('sizes', sizes)
    }
    const preload = container.querySelectorAll('link[as="image"][href]')
    expect(preload).toHaveLength(1)
    expect(preload[0]).toHaveAttribute('imagesizes', sizes)
    expect(preload[0]).toHaveAttribute(
      'imagesrcset',
      container.querySelector('.ll-cover-image source')!.getAttribute('srcset'),
    )
  })

  it('does not inflate portrait crops, and keeps unknown dimensions on the shared original fallback', () => {
    const portrait = { ...image, width: 900, height: 1800 }
    const container = markup(
      <direction.Home view={{ lead: { ...story, image: portrait }, recent: [], navigation }} />,
    )
    expect(container.querySelector('main img')).toHaveAttribute(
      'sizes',
      '(min-width: 1344px) 39rem, (min-width: 1024px) calc(50vw - 3rem), (min-width: 768px) calc(50vw - 1.5rem), calc(100vw - 2.5rem)',
    )
    const unknown = markup(
      <direction.Home
        view={{
          lead: { ...story, image: { ...image, width: null, height: null } },
          recent: [],
          navigation,
        }}
      />,
    )
    expect(unknown.querySelector('main img')).toHaveAttribute('src', image.src)
    expect(unknown.querySelector('main img')).not.toHaveAttribute('sizes')
    expect(unknown.querySelector('link[as="image"][href]')).toHaveAttribute('href', image.src)
  })

  it('compensates cropped cards and all index preloads without promoting later images', () => {
    const home = markup(<direction.Home view={{ lead: null, recent: [], navigation }} />)
    expect(home.querySelector('link[as="image"][href]')).toBeNull()
    const cards = markup(
      <direction.Home view={{ lead: story, recent: [{ ...story, slug: 'second' }], navigation }} />,
    )
    expect(cards.querySelector('.ll-card img')).toHaveAttribute(
      'sizes',
      '(min-width: 1344px) 43.03125rem, (min-width: 1024px) calc(56.25vw - 4.21875rem), (min-width: 768px) calc(56.25vw - 2.53125rem), calc(112.5vw - 2.8125rem)',
    )
    expect(cards.querySelector('.ll-card img')).toHaveAttribute('loading', 'lazy')
    for (const stories of [
      [story],
      [
        { ...story, image: null },
        { ...story, slug: 'second' },
      ],
    ]) {
      const common = { navigation, stories, name: 'Rooms', slug: 'rooms' }
      for (const element of [
        <direction.Section
          key="section"
          view={{ ...common, href: '/sections/rooms', description: null }}
        />,
        <direction.Author key="author" view={{ ...common, href: '/authors/rooms', bio: null }} />,
        <direction.Topic
          key="topic"
          view={{ ...common, href: '/topics/rooms', description: null }}
        />,
      ]) {
        const container = markup(element)
        const preload = container.querySelector('link[as="image"][href]')
        expect(Boolean(preload)).toBe(Boolean(stories[0]!.image))
        if (preload) {
          const sizes = '(min-width: 1024px) 11.25rem, (min-width: 768px) 6.75rem, 5.625rem'
          expect(preload).toHaveAttribute('imagesizes', sizes)
          expect(container.querySelector('main img')).toHaveAttribute('sizes', sizes)
        } else {
          expect(container.querySelector('main img')).toHaveAttribute('loading', 'lazy')
        }
        expect(container.querySelector('figcaption')).toHaveTextContent(image.caption!)
        expect(container.querySelector('figcaption a')).toHaveAttribute('href', image.credit!.url)
      }
    }
  })

  it.each([
    ['NotFound', 'Page not found'],
    ['Unavailable', 'Stories are unavailable'],
    ['Error', 'Something went wrong'],
  ] as const)(
    'uses the LL failure shell for %s without content or preload dependencies',
    (kind, title) => {
      const View = direction[kind]
      const container = markup(<View view={failureView} reset={() => {}} />)
      const screen = within(container)
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(title)
      expect(screen.getAllByRole('main')).toHaveLength(1)
      expect(screen.getByRole('main')).toHaveAttribute('tabindex', '-1')
      expect(screen.getByRole('banner')).toHaveTextContent(failureView.siteName)
      expect(screen.getByRole('contentinfo')).toHaveTextContent(failureView.siteName)
      expect(screen.getByRole('link', { name: 'Skip to message' })).toHaveAttribute(
        'href',
        '#ll-main',
      )
      expect(screen.getByRole('link', { name: 'Return to all stories' })).toHaveAttribute(
        'href',
        '/',
      )
      expect(container.querySelector('.ll-failure')).not.toBeNull()
      expect(container.querySelectorAll('img, link[rel="preload"]')).toHaveLength(0)
      expect(screen.queryAllByRole('button')).toHaveLength(kind === 'Error' ? 1 : 0)
      expect(screen.queryAllByRole('alert')).toHaveLength(kind === 'Error' ? 1 : 0)
    },
  )

  it('invokes the real retry handler and keeps focus on retry when the failure view persists', () => {
    const reset = vi.fn()
    const { getByRole, rerender, unmount } = render(
      <direction.Error view={failureView} reset={reset} />,
    )
    const retry = getByRole('button', { name: 'Try again' })
    expect(retry).toHaveAttribute('type', 'button')
    retry.focus()
    fireEvent.click(retry)
    expect(reset).toHaveBeenCalledTimes(1)
    rerender(<direction.Error view={failureView} reset={reset} />)
    expect(retry).toHaveFocus()
    expect(getByRole('alert')).toHaveTextContent('Please try again.')
    unmount()
  })

  it('has scoped button focus, natural print images and a light print palette even from dark mode', () => {
    const css = postcss.parse(styles)
    const focus: string[] = []
    let print = ''
    css.walkRules((rule) => {
      if (rule.selector.includes('button') && rule.selector.includes(':focus-visible')) {
        focus.push(rule.toString())
      }
    })
    css.walkAtRules('media', (rule) => {
      if (rule.params === 'print') print = rule.toString()
    })
    expect(focus.join('')).toContain('outline: 2px solid var(--ll-accent)')
    expect(print).toContain('--ll-paper: #FBF8F2')
    expect(print).toContain('--ll-ink: #141414')
    expect(print).toContain('object-fit: contain')
    expect(print).toContain('height: auto')
    // The shared bar already collapses in print while preserving keyboard focus.
    expect(print).not.toContain('[data-reader-lab-bar]')
  })
})
