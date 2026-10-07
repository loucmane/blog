import { readerImageSources } from '@/reader/media-variants'
import type { ReaderImage } from '@/reader/views'

export interface SwissLeadImage {
  readonly image: ReaderImage
  readonly sizes: string
}

/** Render a real HTML hint: a server-component preload() can stay in the RSC payload. */
export function SwissImagePreload({ image, sizes }: SwissLeadImage) {
  const source = readerImageSources(image)?.sources[0]
  // React requires href to hoist the link into the document head. The first candidate
  // is a small fallback for older browsers; responsive preload support overrides it.
  const href = source ? source.srcSet.split(' ')[0] : image.src
  return (
    <link
      as="image"
      fetchPriority="high"
      // Preload only the preferred format, using exactly the picture's selection criteria.
      href={href}
      imageSizes={source ? sizes : undefined}
      imageSrcSet={source?.srcSet}
      rel="preload"
      type={source?.type ?? image.contentType}
    />
  )
}
