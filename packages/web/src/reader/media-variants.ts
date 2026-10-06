import {
  mediaVariantContentType,
  mediaVariantFormats,
  mediaVariantFormatsFor,
  mediaVariantWidths,
  type MediaVariant,
  type MediaVariantFormat,
  type MediaVariantWidth,
} from '@/server/content/media-variant-rules'

import { publicMediaPath, type PublicMediaPath } from './paths'
import type { ReaderImage } from './views'

/*
 * Resized variants live on the same checked route as their originals:
 * `/api/media/<id>?w=<width>&fm=<format>`. These helpers build those URLs for reader images and
 * read them back in the route.
 */

export type MediaRequest =
  | { readonly kind: 'invalid' }
  | { readonly kind: 'original' }
  | { readonly kind: 'variant'; readonly variant: MediaVariant }

function allowlisted<T extends number | string>(values: readonly T[], value: string): T | null {
  return values.find((candidate) => String(candidate) === value) ?? null
}

/**
 * Reads a public media query. An empty query asks for the original. A variant names exactly one
 * allowlisted `w` and one allowlisted `fm`. Any other value, a missing or repeated parameter, or
 * any other parameter makes the request invalid.
 */
export function parseMediaRequest(query: URLSearchParams): MediaRequest {
  const parameters = [...query.keys()]
  if (parameters.length === 0) return { kind: 'original' }
  const widths = query.getAll('w')
  const formats = query.getAll('fm')
  if (parameters.length !== 2 || widths.length !== 1 || formats.length !== 1) {
    return { kind: 'invalid' }
  }
  const width = allowlisted(mediaVariantWidths, widths[0] ?? '')
  const format = allowlisted(mediaVariantFormats, formats[0] ?? '')
  return width && format ? { kind: 'variant', variant: { format, width } } : { kind: 'invalid' }
}

export function mediaVariantPath(mediaId: string, variant: MediaVariant): PublicMediaPath {
  return `${publicMediaPath(mediaId)}?w=${variant.width}&fm=${variant.format}`
}

export interface MediaVariantCandidate {
  /** The width the variant actually has, for its `w` descriptor. */
  readonly descriptor: number
  readonly width: MediaVariantWidth
}

/**
 * The variant widths worth listing for an original of the given width. Variants never upscale, so
 * the list stops at the first width that reaches the original, and describes that one at the
 * original's width. When the width is unknown, every width is listed.
 */
export function mediaVariantCandidates(
  originalWidth: number | null,
): readonly MediaVariantCandidate[] {
  const candidates: MediaVariantCandidate[] = []
  for (const width of mediaVariantWidths) {
    if (originalWidth !== null && width >= originalWidth) {
      candidates.push({ descriptor: originalWidth, width })
      break
    }
    candidates.push({ descriptor: width, width })
  }
  return candidates
}

export interface ReaderImageSources {
  /** The `<img>` candidates, in the fallback format every browser decodes. */
  readonly fallback: { readonly src: PublicMediaPath; readonly srcSet: string }
  /** The `<source>` candidates, most preferred first. */
  readonly sources: readonly { readonly srcSet: string; readonly type: string }[]
}

/** The responsive sources for a reader image, or null when it is served only as its original. */
export function readerImageSources(
  image: Pick<ReaderImage, 'contentType' | 'mediaId' | 'width'>,
): ReaderImageSources | null {
  const formats = mediaVariantFormatsFor(image.contentType)
  const fallbackFormat = formats.at(-1)
  const candidates = mediaVariantCandidates(image.width)
  const widest = candidates.at(-1)
  if (!fallbackFormat || !widest) return null
  const srcSet = (format: MediaVariantFormat) =>
    candidates
      .map(
        ({ descriptor, width }) =>
          `${mediaVariantPath(image.mediaId, { format, width })} ${descriptor}w`,
      )
      .join(', ')
  return {
    fallback: {
      src: mediaVariantPath(image.mediaId, { format: fallbackFormat, width: widest.width }),
      srcSet: srcSet(fallbackFormat),
    },
    sources: formats
      .slice(0, -1)
      .map((format) => ({ srcSet: srcSet(format), type: mediaVariantContentType(format) })),
  }
}
