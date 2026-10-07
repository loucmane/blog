import { readerImageSources } from '@/reader/media-variants'
import type { ReaderImage } from '@/reader/views'

export interface CinematicLeadImage {
  readonly image: ReaderImage
  readonly sizes: string
}

// A real link is hoisted into HTML; an RSC preload() alone can stay in the Flight payload.
export function CinematicImagePreload({ image, sizes }: CinematicLeadImage) {
  const source = readerImageSources(image)?.sources[0]
  return (
    <link
      as="image"
      fetchPriority="high"
      href={source ? source.srcSet.split(' ')[0] : image.src}
      imageSizes={source ? sizes : undefined}
      imageSrcSet={source?.srcSet}
      rel="preload"
      type={source?.type ?? image.contentType}
    />
  )
}
