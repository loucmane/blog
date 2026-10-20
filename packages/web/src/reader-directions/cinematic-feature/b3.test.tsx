// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ReaderImage, StoryCard } from '@/reader/views'

import type { ReaderFailureView } from '../contract'
import { cinematicFeatureDirection as direction } from './index'
import { CinematicStoryCard, featureSizes } from './story-card'

afterEach(cleanup)

const failure: ReaderFailureView = {
  siteName: 'Supplied magazine name',
  navigation: { sections: [{ name: 'Places', slug: 'places', href: '/sections/places' }] },
}

describe('Cinematic b3 recovery pages', () => {
  it.each([
    ['NotFound', 'Page not found'],
    ['Error', 'Something went wrong'],
    ['Unavailable', 'Stories are unavailable'],
  ] as const)(
    'renders %s in its own shell with supplied identity and a safe way home',
    (kind, title) => {
      const View = direction[kind]
      const { container } = render(<View view={failure} reset={vi.fn()} />)
      expect(container.querySelector('.cf-page')).toBeTruthy()
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(title)
      expect(screen.getAllByRole('banner')).toHaveLength(1)
      expect(screen.getAllByRole('contentinfo')).toHaveLength(1)
      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('id', 'cf-main')
      expect(main).toHaveAttribute('tabindex', '-1')
      expect(within(main).getByRole('link', { name: 'All stories' })).toHaveAttribute('href', '/')
      expect(screen.getByRole('link', { name: 'Supplied magazine name' })).toHaveAttribute(
        'href',
        '/',
      )
      expect(screen.getByRole('contentinfo')).toHaveTextContent(failure.siteName)
      expect(screen.getByRole('navigation', { name: 'Sections' })).toHaveTextContent('Places')
      expect(container.querySelector('img, link[as="image"], pre, details')).toBeNull()
      expect(container.querySelector('.cf-failure')).toBeTruthy()
      expect(screen.queryByRole('button', { name: 'Try again' }) !== null).toBe(kind === 'Error')
    },
  )

  it('calls the supplied retry without dropping button focus, even with no navigation', () => {
    const reset = vi.fn()
    render(<direction.Error view={{ ...failure, navigation: { sections: [] } }} reset={reset} />)
    const button = screen.getByRole('button', { name: 'Try again' })
    expect(button).toHaveAttribute('type', 'button')
    button.focus()
    fireEvent.click(button)
    expect(reset).toHaveBeenCalledOnce()
    expect(button).toHaveFocus()
    expect(button).toHaveClass('cf-retry')
  })
})

const image: ReaderImage = {
  mediaId: 'media-probe',
  src: '/api/media/media-probe',
  contentType: 'image/jpeg',
  width: 1200,
  height: 1800,
  animated: false,
  alt: 'A portrait of the supplied place',
  caption: 'A separate caption',
  credit: { name: 'Photographer', url: 'https://example.com/credit' },
  focalPoint: { x: 0.25, y: 0.75 },
}
const story: StoryCard = {
  slug: 'portrait',
  href: '/stories/portrait',
  title: 'A portrait story',
  dek: 'The whole supplied summary.',
  section: null,
  readingMinutes: 3,
  publishedAt: '2026-10-20T00:00:00.000Z',
  image,
}

describe('Cinematic b3 lead and fallback media', () => {
  it.each([
    ['portrait', image],
    ['unknown dimensions', { ...image, width: null, height: null }],
    ['animated', { ...image, animated: true }],
    ['GIF', { ...image, contentType: 'image/gif' }],
    ['oversized', { ...image, width: 9000, height: 9000 }],
  ] as const)(
    'preserves %s media, captions and preload parity on every collection type',
    (_, candidate) => {
      const stories: StoryCard[] = [
        { ...story, image: candidate },
        { ...story, slug: 'later', href: '/stories/later' },
      ]
      const common = {
        name: 'Collection',
        slug: 'collection',
        stories,
        navigation: { sections: [] },
      }
      for (const element of [
        <direction.Section
          key="section"
          view={{ ...common, href: '/sections/collection', description: null }}
        />,
        <direction.Author
          key="author"
          view={{ ...common, href: '/authors/collection', bio: null }}
        />,
        <direction.Topic
          key="topic"
          view={{ ...common, href: '/topics/collection', description: null }}
        />,
      ]) {
        const container = document.createElement('div')
        container.innerHTML = renderToStaticMarkup(element)
        const lead = container.querySelector('.cf-feature img')!
        const preload = container.querySelectorAll('link[as="image"][href]')
        expect(preload).toHaveLength(1)
        expect(lead).toHaveAttribute('alt', image.alt)
        expect(lead).toHaveAttribute('fetchpriority', 'high')
        expect(lead).not.toHaveAttribute('loading', 'lazy')
        const source = container.querySelector('.cf-feature source')
        if (source) {
          expect(preload[0]).toHaveAttribute('imagesrcset', source.getAttribute('srcset'))
          expect(preload[0]).toHaveAttribute('imagesizes', featureSizes)
          expect(lead).toHaveAttribute('sizes', featureSizes)
        } else {
          expect(preload[0]).toHaveAttribute('href', candidate.src)
          expect(preload[0]).not.toHaveAttribute('imagesrcset')
          expect(lead).toHaveAttribute('src', candidate.src)
        }
        expect(container.querySelector('.cf-feature figcaption')).toHaveTextContent(image.caption!)
        expect(container.querySelector('.cf-feature figcaption a')).toHaveAttribute(
          'href',
          image.credit!.url,
        )
        expect(container.querySelector('a a')).toBeNull()
        expect(container.querySelectorAll('img[fetchpriority="high"]')).toHaveLength(1)
      }
    },
  )

  it('does not reserve an image or caption for unavailable media', () => {
    const container = document.createElement('div')
    container.innerHTML = renderToStaticMarkup(
      <CinematicStoryCard story={{ ...story, image: null }} />,
    )
    expect(container.querySelector('img, figure, figcaption, picture')).toBeNull()
    expect(container.querySelector('.cf-card-text')).toHaveTextContent(story.title)
  })
})
