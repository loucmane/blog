import Image from 'next/image'

import type { ReaderImage } from '../views'

interface ReaderImageProps {
  readonly className?: string
  readonly image: ReaderImage
  readonly preload?: boolean
  readonly sizes: string
}

/**
 * Renders a stored image with its stored dimensions. Originals saved without dimensions fill a
 * 3:2 frame cropped around the focal point, so the layout never shifts while they load.
 */
export function ReaderImageView({ className, image, preload = false, sizes }: ReaderImageProps) {
  if (image.width !== null && image.height !== null) {
    return (
      <Image
        alt={image.alt}
        className={['h-auto w-full bg-muted', className].filter(Boolean).join(' ')}
        height={image.height}
        preload={preload}
        sizes={sizes}
        src={image.src}
        width={image.width}
      />
    )
  }
  return (
    <div
      className={['relative aspect-[3/2] w-full overflow-hidden bg-muted', className]
        .filter(Boolean)
        .join(' ')}
    >
      <Image
        alt={image.alt}
        className="object-cover"
        fill
        preload={preload}
        sizes={sizes}
        src={image.src}
        style={{ objectPosition: `${image.focalPoint.x * 100}% ${image.focalPoint.y * 100}%` }}
      />
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
