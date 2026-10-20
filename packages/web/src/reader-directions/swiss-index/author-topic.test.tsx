// @vitest-environment jsdom
import { within } from '@testing-library/dom'
import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { beforeAll, describe, expect, it } from 'vitest'

import { formatPublishedDate, formatReadingTime } from '@/reader/format'
import { readAuthorView, readHomeView, readTopicView } from '@/reader/read-model'
import type { AuthorView, StoryCard, TopicView } from '@/reader/views'
import { InMemoryContentRepository } from '@/server/content/in-memory-repository'
import { InMemoryOriginalObjectStore } from '@/server/content/media'
import { labAuthors, labTopics } from '@/server/lab/north-house'
import { seedLabContent } from '@/server/lab/seed'

import { SwissAuthor } from './author'
import { swissIndexDirection } from './index'
import { cardSizes, platesAlone } from './story-card'
import { SwissTopic } from './topic'

function markup(element: ReactNode) {
  const container = document.createElement('div')
  container.innerHTML = renderToStaticMarkup(element)
  return { document: container, screen: within(container) }
}

/** Every link in `root` that points to `href`. */
function linksTo(root: Element, href: string) {
  return [...root.querySelectorAll('a')].filter((link) => link.getAttribute('href') === href)
}

function storyCount(count: number) {
  return `${count} ${count === 1 ? 'story' : 'stories'}`
}

/**
 * The section a level-2 heading names. A detached container cannot resolve `aria-labelledby`
 * for a role query, so the link from section to heading is asserted directly.
 */
function regionNamedBy(screen: ReturnType<typeof within>, name: string) {
  const heading = screen.getByRole('heading', { level: 2, name })
  const region = heading.closest('section')!
  expect(region).toHaveAttribute('aria-labelledby', heading.id)
  return region
}

/** The page header: its label row's label and count, the h1, and the dek when present. */
function header(document: Element) {
  const element = document.querySelector('main > header')!
  expect(element).toHaveClass('si-page-header')
  const labels = [...element.querySelectorAll('.si-label-row .si-label')].map(
    (item) => item.textContent,
  )
  return {
    dek: element.querySelector('.si-dek'),
    labels,
    title: within(element as HTMLElement).getByRole('heading', { level: 1 }),
  }
}

/** Checks index rows against their stories, numbered from `start`, with or without the section. */
function expectIndexRows(list: HTMLElement, stories: readonly StoryCard[], start: number) {
  expect(list.tagName).toBe('OL')
  expect(list).toHaveClass('si-index')
  expect(list).toHaveAttribute('start', String(start))
  expect(list).toHaveAttribute('role', 'list')
  const items = within(list).getAllByRole('listitem')
  expect(items).toHaveLength(stories.length)
  items.forEach((item, index) => {
    const story = stories[index]!
    const title = within(item).getByRole('heading', { level: 3 })
    expect(title).toHaveTextContent(story.title)
    expect(within(title).getByRole('link')).toHaveAttribute('href', story.href)
    expect(linksTo(item, story.href)).toHaveLength(1)
    expect(item.querySelector('time')).toHaveAttribute('datetime', story.publishedAt)
    expect(item.querySelector('time')).toHaveTextContent(formatPublishedDate(story.publishedAt))
    expect(item).toHaveTextContent(formatReadingTime(story.readingMinutes))
    // A topic or an author crosses sections: rows keep the section, once per layout.
    if (story.section) expect(linksTo(item, story.section.href)).toHaveLength(2)
    const number = item.querySelector('.si-number')!
    expect(number).toHaveTextContent(String(start + index).padStart(2, '0'))
    expect(number).toHaveAttribute('aria-hidden', 'true')
  })
}

describe('Swiss Index author and topic pages with real published North House content', () => {
  let authors: AuthorView[]
  let topics: TopicView[]
  let everyStory: StoryCard[]

  beforeAll(async () => {
    const repository = new InMemoryContentRepository()
    await seedLabContent({ objects: new InMemoryOriginalObjectStore(), repository })
    const source = { mediaAvailable: true, repository }
    authors = await Promise.all(
      labAuthors.map(async ({ slug }) => (await readAuthorView(source, slug))!),
    )
    topics = await Promise.all(
      labTopics.map(async ({ slug }) => (await readTopicView(source, slug))!),
    )
    const home = await readHomeView(source)
    everyStory = [home.lead!, ...home.recent]
  })

  it('registers its own author and topic pages', () => {
    expect(swissIndexDirection.Author).toBe(SwissAuthor)
    expect(swissIndexDirection.Topic).toBe(SwissTopic)
  })

  it('heads an author page with its label row, the name as the only h1, and the bio only when stored', () => {
    expect(authors.some(({ bio }) => bio === null)).toBe(true)
    expect(authors.some(({ bio }) => bio !== null)).toBe(true)
    for (const view of authors) {
      const { document, screen } = markup(<SwissAuthor view={view} />)
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
      const { dek, labels, title } = header(document)
      expect(title).toHaveTextContent(view.name)
      expect(labels).toEqual(['Author', storyCount(view.stories.length)])
      if (view.bio) {
        expect(dek).toHaveTextContent(view.bio)
        expect(dek).toHaveClass('si-bio')
      } else {
        expect(dek).toBeNull()
      }
      // Nothing on an author page is the current section.
      expect(document.querySelectorAll('[aria-current]')).toHaveLength(0)
    }
  })

  it('lists every story by an author as an index row, a bibliography without plates or images', () => {
    for (const view of authors) {
      expect(view.stories.length).toBeGreaterThan(0)
      const { document, screen } = markup(<SwissAuthor view={view} />)
      const stories = regionNamedBy(screen, 'Stories')
      expect(stories).toHaveClass('si-stories')
      expect(within(stories).getByText(storyCount(view.stories.length))).toBeTruthy()
      expectIndexRows(within(stories).getByRole('list'), view.stories, 1)
      const main = document.querySelector('main')!
      expect(main.querySelector('img, picture, .si-plates, .si-number-plate')).toBeNull()
      expect(document.querySelector('link[as="image"]')).toBeNull()
    }
  })

  it('shows an author without published stories as an empty bibliography', () => {
    const view = { ...authors[0]!, stories: [] }
    const { document, screen } = markup(<SwissAuthor view={view} />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(header(document).labels).toEqual(['Author', '0 stories'])
    expect(screen.getByText(`No published stories by ${view.name} yet.`)).toBeTruthy()
    const main = document.querySelector('main')!
    expect(within(main).getByRole('link', { name: 'Front page' })).toHaveAttribute('href', '/')
    expect(screen.queryByRole('heading', { name: 'Stories' })).toBeNull()
    expect(main.querySelector('ol')).toBeNull()
  })

  it('sets page titles over 80 characters at the long title size on author and topic pages', () => {
    const named = (length: number) =>
      'Ingrid Halvorsen and the long table '.repeat(4).slice(0, length)
    for (const length of [80, 81]) {
      const author = markup(<SwissAuthor view={{ ...authors[0]!, name: named(length) }} />)
      const topic = markup(<SwissTopic view={{ ...topics[0]!, name: named(length) }} />)
      for (const { screen } of [author, topic]) {
        const title = screen.getByRole('heading', { level: 1 })
        expect(title.textContent).toBe(named(length))
        expect(title.classList.contains('si-title-long')).toBe(length > 80)
      }
    }
  })

  it('heads a topic page as a section page with the label Topic and a description only when stored', () => {
    for (const view of topics) {
      const { document, screen } = markup(<SwissTopic view={view} />)
      expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
      const { dek, labels, title } = header(document)
      expect(title).toHaveTextContent(view.name)
      expect(labels).toEqual(['Topic', storyCount(view.stories.length)])
      expect(view.description).toBeNull()
      expect(dek).toBeNull()
      expect(document.querySelectorAll('[aria-current]')).toHaveLength(0)
    }
    const description = 'Rooms planned around the low northern sun.'
    const { screen } = markup(<SwissTopic view={{ ...topics[0]!, description }} />)
    expect(screen.getByText(description)).toHaveClass('si-dek')
  })

  it('sets a topic’s first four stories as numbered plates and preloads only plate 01’s image', () => {
    expect(topics.some((view) => view.stories[0]?.image)).toBe(true)
    expect(topics.some((view) => view.stories[0] && !view.stories[0].image)).toBe(true)
    for (const view of topics) {
      const { document, screen } = markup(<SwissTopic view={view} />)
      const list = screen.getByRole('list', { name: `${view.name} stories` })
      expect(list.tagName).toBe('OL')
      expect(list).toHaveClass('si-plates')
      expect(list).toHaveAttribute('start', '1')
      expect(list).toHaveAttribute('role', 'list')
      const stories = view.stories.slice(0, 4)
      const alone = platesAlone(stories.map(() => 1))
      const plates = [...list.children] as HTMLElement[]
      expect(plates).toHaveLength(stories.length)
      plates.forEach((plate, index) => {
        const story = stories[index]!
        const title = within(plate).getByRole('heading', { level: 2 })
        expect(title).toHaveTextContent(story.title)
        expect(linksTo(plate, story.href)).toHaveLength(1)
        if (story.image) {
          const image = plate.querySelector('img')!
          expect(image).toHaveAttribute('sizes', cardSizes)
          expect(image.getAttribute('loading')).toBe(index === 0 ? null : 'lazy')
        } else {
          const shares = alone[index]!.length < 2
          expect(Boolean(plate.querySelector('.si-number-plate'))).toBe(shares)
        }
      })
      const preloads = document.querySelectorAll('link[rel="preload"][as="image"]')
      expect(preloads).toHaveLength(view.stories[0]?.image ? 1 : 0)
      if (view.stories[0]?.image) expect(preloads[0]).toHaveAttribute('imagesizes', cardSizes)
    }
  })

  it('lists a topic’s stories from 05 as index rows that keep the section column', () => {
    expect(everyStory.length).toBeGreaterThan(4)
    const view = { ...topics[0]!, stories: everyStory }
    const { screen } = markup(<SwissTopic view={view} />)
    expect(screen.getByRole('list', { name: `${view.name} stories` }).children).toHaveLength(4)
    const earlier = regionNamedBy(screen, `Earlier stories on ${view.name}`)
    expect(earlier).toHaveClass('si-earlier')
    expect(within(earlier).getByText(storyCount(everyStory.length - 4))).toBeTruthy()
    expectIndexRows(within(earlier).getByRole('list'), everyStory.slice(4), 5)
    expect(earlier.querySelector('img')).toBeNull()
  })

  it('shows a topic without published stories as an empty list with a way to the front page', () => {
    const view = { ...topics[0]!, stories: [] }
    const { document, screen } = markup(<SwissTopic view={view} />)
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(header(document).labels).toEqual(['Topic', '0 stories'])
    expect(screen.getByText('No published stories on this topic yet.')).toBeTruthy()
    expect(
      within(document.querySelector('main')!).getByRole('link', { name: 'Front page' }),
    ).toHaveAttribute('href', '/')
    expect(screen.queryByRole('list', { name: `${view.name} stories` })).toBeNull()
    expect(document.querySelector('link[as="image"]')).toBeNull()
  })
})
