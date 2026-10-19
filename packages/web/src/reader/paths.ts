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

const authorOrTopicSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * The longest author or taxonomy slug the content model takes in: import caps both at 200
 * characters (`id` in server/content/portability.ts), and the tables check only the kebab-case
 * shape (migrations/0001_content_foundation.sql).
 */
export const maxAuthorOrTopicSlugLength = 200

/**
 * Accepts exactly the author and topic slugs that storage and import accept, kebab-case from one
 * to `maxAuthorOrTopicSlugLength` characters, so every stored author and topic stays reachable.
 * Story and section slugs keep their own rule (`normalizeReaderSlug`, 2 to 180 characters).
 */
export function normalizeAuthorOrTopicSlug(value: unknown): string | null {
  if (
    typeof value !== 'string' ||
    value.length > maxAuthorOrTopicSlugLength ||
    !authorOrTopicSlugPattern.test(value)
  ) {
    return null
  }
  return value
}

/**
 * The author route resolves every slug `normalizeAuthorOrTopicSlug` accepts. The slug is encoded
 * anyway: the in-memory store does not check slugs, and an unchecked one must stay inside its own
 * path segment, where the route turns it away.
 */
export function authorPath(slug: string): AuthorPath {
  return `/authors/${encodeURIComponent(slug)}`
}

/** Encodes the slug, like `authorPath`; the topic route accepts the same slugs. */
export function topicPath(slug: string): TopicPath {
  return `/topics/${encodeURIComponent(slug)}`
}

export function publicMediaPath(mediaId: string): PublicMediaPath {
  return `/api/media/${encodeURIComponent(mediaId)}`
}
