import { describe, expect, it } from 'vitest'

import { authorPath, publicMediaPath, sectionPath, storyPath, topicPath } from './paths'

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
})
