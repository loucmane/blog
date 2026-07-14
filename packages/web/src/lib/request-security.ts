import { createHash, createHmac, timingSafeEqual } from 'node:crypto'

const storySlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const maxStorySlugLength = 120
const maxTokenLength = 512
const minimumConfiguredSecretBytes = 32
const previewTokenDomain = 'magazine-preview-token'
const previewScopeDomain = 'magazine-preview-scope'

export const previewScopeCookieName = 'magazine-preview-scope'
export const previewScopeLifetimeSeconds = 300
export const previewTokenLifetimeSeconds = 300
export const maxPreviewRequestBytes = 2_048
export const maxRevalidationRequestBytes = 1_024

export type BoundedJsonResult =
  { ok: true; value: unknown } | { ok: false; reason: 'invalid' | 'too-large' }

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

export function configuredSecretIsStrong(value: string | undefined): value is string {
  if (!value) {
    return false
  }

  const bytes = Buffer.byteLength(value, 'utf8')
  return bytes >= minimumConfiguredSecretBytes && bytes <= maxTokenLength
}

export function configuredSecretsAreDistinct(
  ...values: ReadonlyArray<string | undefined>
): boolean {
  const configured = values.filter((value): value is string => value !== undefined)
  return new Set(configured).size === configured.length
}

function createSignedPreviewValue(
  domain: string,
  slug: string,
  secret: string | undefined,
  lifetimeSeconds: number,
  now = Date.now(),
): string | null {
  const normalizedSlug = normalizeStorySlug(slug)
  if (!normalizedSlug || !configuredSecretIsStrong(secret)) {
    return null
  }

  const expiresAt = now + lifetimeSeconds * 1_000
  const payload = `v1.${normalizedSlug}.${expiresAt}`
  const signature = createHmac('sha256', secret).update(`${domain}:${payload}`).digest('base64url')
  return `${payload}.${signature}`
}

function signedPreviewValueMatches(
  domain: string,
  value: string | undefined,
  expectedSlug: string,
  secret: string | undefined,
  lifetimeSeconds: number,
  now = Date.now(),
): boolean {
  if (!value || !configuredSecretIsStrong(secret)) {
    return false
  }

  const [version, slug, expiresAtValue, signature, ...extra] = value.split('.')
  const expiresAt = Number(expiresAtValue)
  if (
    extra.length > 0 ||
    version !== 'v1' ||
    !slug ||
    !signature ||
    normalizeStorySlug(slug) !== expectedSlug ||
    !Number.isSafeInteger(expiresAt) ||
    expiresAt <= now ||
    expiresAt > now + lifetimeSeconds * 1_000
  ) {
    return false
  }

  const expectedSignature = createHmac('sha256', secret)
    .update(`${domain}:v1.${slug}.${expiresAt}`)
    .digest('base64url')
  return secureTokenMatches(signature, expectedSignature)
}

export function createPreviewToken(
  slug: string,
  secret: string | undefined,
  now = Date.now(),
): string | null {
  return createSignedPreviewValue(
    previewTokenDomain,
    slug,
    secret,
    previewTokenLifetimeSeconds,
    now,
  )
}

export function previewTokenMatches(
  value: string | undefined,
  expectedSlug: string,
  secret: string | undefined,
  now = Date.now(),
): boolean {
  return signedPreviewValueMatches(
    previewTokenDomain,
    value,
    expectedSlug,
    secret,
    previewTokenLifetimeSeconds,
    now,
  )
}

export function createPreviewScope(
  slug: string,
  secret: string | undefined,
  now = Date.now(),
): string | null {
  return createSignedPreviewValue(
    previewScopeDomain,
    slug,
    secret,
    previewScopeLifetimeSeconds,
    now,
  )
}

export function previewScopeMatches(
  value: string | undefined,
  expectedSlug: string,
  secret: string | undefined,
  now = Date.now(),
): boolean {
  return signedPreviewValueMatches(
    previewScopeDomain,
    value,
    expectedSlug,
    secret,
    previewScopeLifetimeSeconds,
    now,
  )
}

export function previewScopeCookieOptions(siteUrl: URL) {
  return {
    httpOnly: true,
    maxAge: previewScopeLifetimeSeconds,
    path: '/preview',
    sameSite: 'strict' as const,
    secure: siteUrl.protocol === 'https:',
  }
}

export function requestOriginMatches(
  originHeader: string | null,
  expectedOrigin: URL,
  fetchSiteHeader: string | null,
): boolean {
  if (fetchSiteHeader && fetchSiteHeader !== 'same-origin') {
    return false
  }

  if (!originHeader) {
    return fetchSiteHeader === 'same-origin'
  }

  if (originHeader === 'null') {
    return false
  }

  try {
    const origin = new URL(originHeader)
    return (
      ['http:', 'https:'].includes(origin.protocol) &&
      !origin.username &&
      !origin.password &&
      !origin.search &&
      !origin.hash &&
      origin.pathname === '/' &&
      origin.origin === expectedOrigin.origin
    )
  } catch {
    return false
  }
}

export async function readBoundedJson(
  request: Request,
  maxBytes = maxPreviewRequestBytes,
): Promise<BoundedJsonResult> {
  const declaredLength = request.headers.get('content-length')
  if (declaredLength !== null) {
    if (!/^\d+$/.test(declaredLength)) {
      return { ok: false, reason: 'invalid' }
    }
    if (Number(declaredLength) > maxBytes) {
      return { ok: false, reason: 'too-large' }
    }
  }

  if (!request.body) {
    return { ok: false, reason: 'invalid' }
  }

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let totalBytes = 0

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        break
      }

      totalBytes += value.byteLength
      if (totalBytes > maxBytes) {
        await reader.cancel().catch(() => undefined)
        return { ok: false, reason: 'too-large' }
      }
      chunks.push(value)
    }
  } catch {
    return { ok: false, reason: 'invalid' }
  } finally {
    reader.releaseLock()
  }

  const bytes = new Uint8Array(totalBytes)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }

  try {
    const value: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes))
    return { ok: true, value }
  } catch {
    return { ok: false, reason: 'invalid' }
  }
}
