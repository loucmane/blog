export type StoryPath = `/stories/${string}`
export type SectionPath = `/sections/${string}`
export type PublicMediaPath = `/api/media/${string}`

export function storyPath(slug: string): StoryPath {
  return `/stories/${slug}`
}

export function sectionPath(slug: string): SectionPath {
  return `/sections/${slug}`
}

export function publicMediaPath(mediaId: string): PublicMediaPath {
  return `/api/media/${encodeURIComponent(mediaId)}`
}
