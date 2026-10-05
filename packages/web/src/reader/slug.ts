const readerSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** The longest slug the content model accepts (`assertValidSlug` in server/content/domain.ts). */
export const maxReaderSlugLength = 180

/**
 * Accepts exactly the slugs the content model can store, so every published story and section
 * stays reachable, and rejects anything else before it reaches the store or a cache key.
 */
export function normalizeReaderSlug(value: unknown): string | null {
  if (
    typeof value !== 'string' ||
    value.length < 2 ||
    value.length > maxReaderSlugLength ||
    !readerSlugPattern.test(value)
  ) {
    return null
  }
  return value
}
