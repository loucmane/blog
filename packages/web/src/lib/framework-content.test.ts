import { describe, expect, it } from 'vitest'

import {
  getFrameworkStory,
  getPublishedFrameworkStory,
  listPublishedFrameworkStories,
  storyCacheTag,
} from './framework-content'

describe('framework content boundary', () => {
  it('lists only published stories on reader surfaces', () => {
    expect(listPublishedFrameworkStories().map(({ slug }) => slug)).toEqual([
      'framework-migration-proof',
    ])
    expect(getPublishedFrameworkStory('private-framework-draft')).toBeNull()
  })

  it('retains drafts only for the isolated preview surface', () => {
    expect(getFrameworkStory('private-framework-draft')).toMatchObject({
      publishedAt: null,
      status: 'draft',
    })
  })

  it('uses a stable, slug-scoped cache tag', () => {
    expect(storyCacheTag('framework-migration-proof')).toBe('story:framework-migration-proof')
  })
})
