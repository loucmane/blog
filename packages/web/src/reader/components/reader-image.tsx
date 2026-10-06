import { readerImageSources } from '../media-variants'
import type { ReaderImage } from '../views'

interface ReaderImageProps {
  readonly className?: string
  readonly image: ReaderImage
  /** Marks the page's lead image: it loads at once, at high priority, instead of lazily. */
  readonly preload?: boolean
  readonly sizes: string
}

/**
 * Renders a stored image as resized variants over the allowlisted widths: AVIF and WebP sources
 * for browsers that decode them, and a fallback in the original's type. Images with stored
 * dimensions keep them. Originals saved without dimensions fill a 3:2 frame cropped around the
 * focal point, so the layout never shifts while they load. A GIF loads as its original, since it
 * may be animated.
 *
 * Every variant loads from the public media route, which checks on every request that a visible
 * story still uses the image. The Next image optimizer would keep serving its cached copies after
 * an unpublish.
 *
 * A lead image is not preloaded with a `<link>`: from a server component, `preload()` only reaches
 * the RSC payload, and Next 16.3.8 does not write it into the HTML. The image is in the initial
 * HTML, eager and at high priority, so the browser finds and fetches it first anyway.
 */
export function ReaderImageView({ className, image, preload = false, sizes }: ReaderImageProps) {
  const variants = readerImageSources(image)
  const dimensions =
    image.width !== null && image.height !== null
      ? { height: image.height, width: image.width }
      : null
  const picture = (
    // `contents` keeps the picture out of layout, so the image is laid out as before.
    <picture className="contents">
      {variants?.sources.map((source) => (
        <source key={source.type} sizes={sizes} srcSet={source.srcSet} type={source.type} />
      ))}
      <img
        alt={image.alt}
        className={
          dimensions
            ? ['h-auto w-full bg-muted', className].filter(Boolean).join(' ')
            : 'absolute inset-0 h-full w-full object-cover'
        }
        decoding="async"
        fetchPriority={preload ? 'high' : undefined}
        height={dimensions?.height}
        loading={preload ? undefined : 'lazy'}
        sizes={variants ? sizes : undefined}
        src={variants?.fallback.src ?? image.src}
        srcSet={variants?.fallback.srcSet}
        style={
          dimensions
            ? undefined
            : { objectPosition: `${image.focalPoint.x * 100}% ${image.focalPoint.y * 100}%` }
        }
        width={dimensions?.width}
      />
    </picture>
  )
  if (dimensions) return picture
  return (
    <div
      className={['relative aspect-[3/2] w-full overflow-hidden bg-muted', className]
        .filter(Boolean)
        .join(' ')}
    >
      {picture}
    </div>
  )
}

export function ReaderImageCredit({ image }: { readonly image: ReaderImage }) {
  if (!image.credit) return null
  return (
    <span>
      {' '}
      Credit:{' '}
      {image.credit.url ? (
        <a className="underline underline-offset-2" href={image.credit.url} rel="noreferrer">
          {image.credit.name}
        </a>
      ) : (
        image.credit.name
      )}
    </span>
  )
}

interface ReaderFigureProps extends ReaderImageProps {
  readonly captionClassName?: string
}

export function ReaderFigure({ captionClassName, ...imageProps }: ReaderFigureProps) {
  const { image } = imageProps
  return (
    <figure>
      <ReaderImageView {...imageProps} />
      {image.caption || image.credit ? (
        <figcaption className={captionClassName}>
          {image.caption}
          <ReaderImageCredit image={image} />
        </figcaption>
      ) : null}
    </figure>
  )
}
