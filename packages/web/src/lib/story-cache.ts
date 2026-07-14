import { unstable_cache } from 'next/cache'

import { getPublishedFrameworkStory, storyCacheTag } from './framework-content'

export function loadPublishedFrameworkStory(slug: string) {
  return unstable_cache(async () => getPublishedFrameworkStory(slug), ['framework-story', slug], {
    revalidate: 3_600,
    tags: [storyCacheTag(slug)],
  })()
}
