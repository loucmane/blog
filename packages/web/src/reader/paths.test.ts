import { describe, expect, it } from 'vitest'

import {
  authorPath,
  maxAuthorOrTopicSlugLength,
  normalizeAuthorOrTopicSlug,
  publicMediaPath,
  sectionPath,
  storyPath,
  topicPath,
} from './paths'

describe('reader paths', () => {
  it('builds story, section, author, and topic paths from reader slugs', () => {
    expect(storyPath('winter-light')).toBe('/stories/winter-light')
    expect(sectionPath('interiors')).toBe('/sections/interiors')
    expect(authorPath('alpha-writer')).toBe('/authors/alpha-writer')
    expect(topicPath('light')).toBe('/topics/light')
  })

  it('keeps an author or topic slug inside its own path segment', () => {
    // Imported author and taxonomy slugs are not checked against the reader slug rules.
    expect(authorPath('../owner')).toBe('/authors/..%2Fowner')
    expect(topicPath('light?x=1#top')).toBe('/topics/light%3Fx%3D1%23top')
    expect(publicMediaPath('media/one')).toBe('/api/media/media%2Fone')
  })

  it('accepts every author and topic slug that storage and import accept, and links it as is', () => {
    // Import takes 1 to 200 characters; the tables check the kebab-case shape.
    const longest = 'a'.repeat(maxAuthorOrTopicSlugLength)

    expect(maxAuthorOrTopicSlugLength).toBe(200)
    for (const slug of ['c', '7', 'c-d', 'alpha-writer', longest]) {
      expect(normalizeAuthorOrTopicSlug(slug), slug).toBe(slug)
      expect(authorPath(slug)).toBe(`/authors/${slug}`)
      expect(topicPath(slug)).toBe(`/topics/${slug}`)
    }
  })

  it('rejects empty, oversized, malformed, and non-string author and topic slugs', () => {
    for (const value of [
      '',
      'a'.repeat(maxAuthorOrTopicSlugLength + 1),
      'C',
      'Upper-case',
      '-c',
      'c-',
      'c--d',
      'c d',
      ' c',
      'c_d',
      'é',
      '../c',
      'c/d',
      42,
      null,
      undefined,
    ]) {
      expect(normalizeAuthorOrTopicSlug(value), String(value)).toBeNull()
    }
  })
})
