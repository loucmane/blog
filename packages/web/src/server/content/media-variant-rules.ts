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
 * whenever variants are encoded differently: caches and storage then never hold bytes from two
 * encodings under one tag.
 */
export const mediaVariantRevision = 1

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
