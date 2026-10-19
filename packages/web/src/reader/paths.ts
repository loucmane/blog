export type StoryPath = `/stories/${string}`
export type SectionPath = `/sections/${string}`
export type AuthorPath = `/authors/${string}`
export type TopicPath = `/topics/${string}`
export type PublicMediaPath = `/api/media/${string}`

export function storyPath(slug: string): StoryPath {
  return `/stories/${slug}`
}

export function sectionPath(slug: string): SectionPath {
  return `/sections/${slug}`
}

/**
 * Imported author and taxonomy slugs are not checked against the reader slug rules, so the author
 * and topic paths encode the slug to keep it inside one path segment.
 */
export function authorPath(slug: string): AuthorPath {
  return `/authors/${encodeURIComponent(slug)}`
}

/** Encodes the slug, like `authorPath`. */
export function topicPath(slug: string): TopicPath {
  return `/topics/${encodeURIComponent(slug)}`
}

export function publicMediaPath(mediaId: string): PublicMediaPath {
  return `/api/media/${encodeURIComponent(mediaId)}`
}
