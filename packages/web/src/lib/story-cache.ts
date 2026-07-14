import { unstable_cache } from 'next/cache'

import { getPublishedFrameworkStory, storyCacheTag } from './framework-content'
import { normalizeStorySlug } from './request-security'

export function loadPublishedFrameworkStory(slug: string) {
  const normalizedSlug = normalizeStorySlug(slug)
  if (!normalizedSlug || !getPublishedFrameworkStory(normalizedSlug)) {
    return Promise.resolve(null)
  }

  return unstable_cache(
    async () => getPublishedFrameworkStory(normalizedSlug),
    ['framework-story', normalizedSlug],
    {
      revalidate: 3_600,
      tags: [storyCacheTag(normalizedSlug)],
    },
  )()
}
