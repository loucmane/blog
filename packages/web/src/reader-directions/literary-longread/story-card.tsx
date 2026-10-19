import Link from 'next/link'
import type { CSSProperties } from 'react'

import { ReaderImageCredit, ReaderImageView } from '@/reader/components/reader-image'
import { formatPublishedDate, formatReadingTime } from '@/reader/format'
import type { ReaderImage, StoryCard } from '@/reader/views'

import { SectionLabel } from './shell'

export const coverSizes =
  '(min-width: 1344px) 39rem, (min-width: 1024px) calc(50vw - 3rem), (min-width: 768px) calc(50vw - 1.5rem), calc(100vw - 2.5rem)'
export const cardSizes =
  '(min-width: 1344px) 38.25rem, (min-width: 1024px) calc(50vw - 3.75rem), (min-width: 768px) calc(50vw - 2.25rem), calc(100vw - 2.5rem)'
export const thumbnailSizes = '(min-width: 1024px) 10rem, (min-width: 768px) 6rem, 5rem'

/** Keep captions outside the crop; retain shared source, alt and credit semantics. */
export function LiteraryFigure({
  image,
  className,
  sizes,
  preload = false,
}: {
  readonly image: ReaderImage
  readonly className: string
  readonly sizes: string
  readonly preload?: boolean
}) {
  const focalStyle: CSSProperties & { '--ll-focal-point': string } = {
    '--ll-focal-point': `${image.focalPoint.x * 100}% ${image.focalPoint.y * 100}%`,
  }
  return (
    <figure className={className} style={focalStyle}>
      <div className="ll-image-frame">
        <ReaderImageView image={image} preload={preload} sizes={sizes} />
      </div>
      {image.caption || image.credit ? (
        <figcaption>
          {image.caption}
          <ReaderImageCredit image={image} />
        </figcaption>
      ) : null}
    </figure>
  )
}

export function LiteraryStoryMeta({ story }: { readonly story: StoryCard }) {
  return (
    <p className="ll-meta">
      <time dateTime={story.publishedAt}>{formatPublishedDate(story.publishedAt)}</time>
      <span aria-hidden="true"> · </span>
      <span>{formatReadingTime(story.readingMinutes)}</span>
    </p>
  )
}

export function LiteraryStoryCard({
  story,
  headingLevel = 3,
  sizes = cardSizes,
}: {
  readonly story: StoryCard
  readonly headingLevel?: 2 | 3
  readonly sizes?: string
}) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  return (
    <article className={`ll-card${story.image ? '' : ' ll-card-text'}`}>
      {story.image ? (
        <LiteraryFigure className="ll-card-image" image={story.image} sizes={sizes} />
      ) : null}
      <SectionLabel section={story.section} />
      <Heading className="ll-card-title">
        <Link href={story.href}>{story.title}</Link>
      </Heading>
      {story.dek ? <p className="ll-card-dek">{story.dek}</p> : null}
      <LiteraryStoryMeta story={story} />
    </article>
  )
}
