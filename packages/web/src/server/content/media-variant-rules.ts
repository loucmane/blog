/*
 * Which resized variants of a public image exist. A variant is named by an allowlisted width and
 * format only, so a request can never pick an arbitrary size or encoding, and every variant maps
 * to exactly one stored object.
 */

/** The widths, in pixels, a variant can be requested at. */
export const mediaVariantWidths = [320, 640, 960, 1280, 1920] as const
export type MediaVariantWidth = (typeof mediaVariantWidths)[number]

/** The formats a variant can be requested in. */
export const mediaVariantFormats = ['avif', 'webp', 'jpeg', 'png'] as const
export type MediaVariantFormat = (typeof mediaVariantFormats)[number]

export interface MediaVariant {
  readonly format: MediaVariantFormat
  readonly width: MediaVariantWidth
}

/**
 * The encoding revision. It is part of every variant's storage key and entity tag, so advance it
 * whenever variants are encoded differently or made from different originals: caches and storage
 * then never hold bytes from two revisions under one tag. Revision 1 made first-frame variants of
 * animated originals; revision 2 makes none.
 */
export const mediaVariantRevision = 2

/**
 * Originals with more pixels get no variants, and are refused before any decoding: 8192 × 8192,
 * more than any common camera short of medium format. With the per-process concurrency limit, this
 * bounds the memory that making variants can use, whatever the originals claim to be.
 */
export const MAX_MEDIA_VARIANT_INPUT_PIXELS = 8192 * 8192

const contentTypes: Readonly<Record<MediaVariantFormat, string>> = {
  avif: 'image/avif',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

export function mediaVariantContentType(format: MediaVariantFormat): string {
  return contentTypes[format]
}

/**
 * The formats an original's variants come in, last the fallback that every browser decodes. AVIF
 * and WebP come first. The fallback is JPEG for a JPEG original and PNG for the rest, which may be
 * transparent. A GIF has no variants: it may be animated, and a variant keeps only one frame.
 */
export function mediaVariantFormatsFor(contentType: string): readonly MediaVariantFormat[] {
  switch (contentType) {
    case 'image/jpeg':
      return ['avif', 'webp', 'jpeg']
    case 'image/avif':
    case 'image/png':
    case 'image/webp':
      return ['avif', 'webp', 'png']
    default:
      return []
  }
}

/**
 * What was measured about an original when it was stored, from its own bytes. Null means it was
 * not measured: originals stored before measuring began, or bytes whose header could not be read.
 */
export interface MediaOriginalFacts {
  /** Whether the original has more than one frame, as an animation does. */
  readonly animated: boolean | null
  /** The height readers see, in pixels, after the EXIF orientation is applied. */
  readonly height: number | null
  /** The width readers see, in pixels, after the EXIF orientation is applied. */
  readonly width: number | null
}

/**
 * Whether what was measured about an original rules variants out. An animated original gets none,
 * since a variant keeps only one frame, and neither does one above the pixel limit. Facts that were
 * never measured rule nothing out here: making a variant checks the original's own bytes too.
 */
export function mediaVariantsRuledOut(facts: MediaOriginalFacts): boolean {
  if (facts.animated === true) return true
  return (
    facts.width !== null &&
    facts.height !== null &&
    facts.width * facts.height > MAX_MEDIA_VARIANT_INPUT_PIXELS
  )
}
