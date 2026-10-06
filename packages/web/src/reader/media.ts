import type { MediaAsset } from '@/server/content/domain'
import { mediaVariantRevision, type MediaVariant } from '@/server/content/media-variant-rules'

/*
 * Public media must stop being served on the next request after an unpublish, for example when
 * image rights expire. Any cache may keep a copy, but `no-cache` makes it ask the server before
 * every use. A strong ETag keeps that check cheap: the answer is a bodiless 304, given only after
 * the same visibility check as a full response.
 */
export const publicMediaCacheControl = 'public, no-cache'

const sha256Pattern = /^[0-9a-f]{64}$/
const entityTagPattern = /(?:W\/)?("[^"]*")/g

/**
 * The strong entity tag of a media original: the SHA-256 of its bytes, which also names its
 * storage key (`originals/<id>/<sha256>`). Returns null for a malformed checksum, so the response
 * goes out without a validator rather than with a broken one.
 */
export function mediaEntityTag(asset: Pick<MediaAsset, 'originalSha256'>): string | null {
  return sha256Pattern.test(asset.originalSha256) ? `"${asset.originalSha256}"` : null
}

/**
 * The strong entity tag of a variant, derived from what determines its bytes: the original's
 * checksum, the encoding revision, the width, and the format. Because it is known without reading
 * the variant, a 304 needs no storage access at all.
 */
export function mediaVariantEntityTag(
  asset: Pick<MediaAsset, 'originalSha256'>,
  variant: MediaVariant,
): string | null {
  return sha256Pattern.test(asset.originalSha256)
    ? `"${asset.originalSha256}-v${mediaVariantRevision}-${variant.width}.${variant.format}"`
    : null
}

/**
 * Whether an `If-None-Match` header matches the current entity tag. RFC 9110 uses the weak
 * comparison for this header, so `W/"x"` matches `"x"`, and `*` matches any current
 * representation.
 */
export function ifNoneMatchIncludes(header: string | null, entityTag: string): boolean {
  if (header === null) return false
  if (header.trim() === '*') return true
  for (const [, opaqueTag] of header.matchAll(entityTagPattern)) {
    if (opaqueTag === entityTag) return true
  }
  return false
}
