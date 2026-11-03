/*
 * The reader's path builders. They are defined once, in server/distribution/canonical.ts, the
 * single source of every public URL, and re-exported here under the names reader code imports.
 */
export {
  authorPath,
  publicMediaPath,
  sectionPath,
  storyPath,
  topicPath,
  type AuthorPath,
  type PublicMediaPath,
  type SectionPath,
  type StoryPath,
  type TopicPath,
} from '@/server/distribution/canonical'

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
