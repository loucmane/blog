import { timingSafeEqual } from 'node:crypto'

const storySlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function normalizeStorySlug(value: unknown): string | null {
  if (typeof value !== 'string' || !storySlugPattern.test(value)) {
    return null
  }
  return value
}

export function readBearerToken(value: string | null): string | null {
  const match = value?.match(/^Bearer ([^\s]+)$/)
  return match?.[1] ?? null
}

export function secureTokenMatches(
  providedToken: string | null,
  expectedToken: string | undefined,
): boolean {
  if (!providedToken || !expectedToken) {
    return false
  }

  const provided = Buffer.from(providedToken)
  const expected = Buffer.from(expectedToken)
  return provided.length === expected.length && timingSafeEqual(provided, expected)
}
