import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

const storySlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const maxStorySlugLength = 120
const maxTokenLength = 512

export const previewScopeCookieName = 'magazine-preview-scope'
export const previewScopeLifetimeSeconds = 300

export function normalizeStorySlug(value: unknown): string | null {
  if (
    typeof value !== 'string' ||
    value.length > maxStorySlugLength ||
    !storySlugPattern.test(value)
  ) {
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
  if (
    !providedToken ||
    !expectedToken ||
    providedToken.length > maxTokenLength ||
    expectedToken.length > maxTokenLength
  ) {
    return false
  }

  const provided = createHash('sha256').update(providedToken).digest()
  const expected = createHash('sha256').update(expectedToken).digest()
  return timingSafeEqual(provided, expected)
}

export function createPreviewScope(
  slug: string,
  secret: string | undefined,
  now = Date.now(),
): string | null {
  const normalizedSlug = normalizeStorySlug(slug)
  if (!normalizedSlug || !secret || secret.length > maxTokenLength) {
    return null
  }

  const expiresAt = now + previewScopeLifetimeSeconds * 1_000
  const payload = `${normalizedSlug}.${expiresAt}`
  const signature = createHmac('sha256', secret).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

export function previewScopeMatches(
  value: string | undefined,
  expectedSlug: string,
  secret: string | undefined,
  now = Date.now(),
): boolean {
  if (!value || !secret || secret.length > maxTokenLength) {
    return false
  }

  const [slug, expiresAtValue, signature, ...extra] = value.split('.')
  const expiresAt = Number(expiresAtValue)
  if (
    extra.length > 0 ||
    !slug ||
    !signature ||
    normalizeStorySlug(slug) !== expectedSlug ||
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= now ||
    expiresAt > now + previewScopeLifetimeSeconds * 1_000
  ) {
    return false
  }

  const expectedSignature = createHmac('sha256', secret)
    .update(`${slug}.${expiresAt}`)
    .digest('base64url')
  return secureTokenMatches(signature, expectedSignature)
}
