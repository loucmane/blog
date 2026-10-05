import Link from 'next/link'

import { formatPublishedDate, formatReadingTime } from '../format'
import type { StoryCard } from '../views'
import { ReaderImageView } from './reader-image'

interface StoryCardProps {
  readonly card: StoryCard
  readonly headingLevel: 2 | 3
  readonly imageSizes: string
  readonly preloadImage?: boolean
  readonly prominence?: 'lead' | 'standard'
}

export function StoryCardView({
  card,
  headingLevel,
  imageSizes,
  preloadImage = false,
  prominence = 'standard',
}: StoryCardProps) {
  const Heading = headingLevel === 2 ? 'h2' : 'h3'
  return (
    <article className="flex flex-col gap-3">
      {card.image ? (
        <ReaderImageView
          className="rounded-lg"
          image={card.image}
          preload={preloadImage}
          sizes={imageSizes}
        />
      ) : null}
      <div className="flex flex-col gap-2">
        {card.section ? (
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-primary">
            <Link className="underline-offset-4 hover:underline" href={card.section.href}>
              {card.section.name}
            </Link>
          </p>
        ) : null}
        <Heading
          className={
            prominence === 'lead'
              ? 'text-3xl font-semibold break-words md:text-5xl'
              : 'text-2xl font-semibold break-words'
          }
        >
          <Link className="underline-offset-4 hover:underline" href={card.href}>
            {card.title}
          </Link>
        </Heading>
        {card.dek ? <p className="text-lg text-muted-foreground">{card.dek}</p> : null}
        <p className="text-sm text-muted-foreground">
          <time dateTime={card.publishedAt}>{formatPublishedDate(card.publishedAt)}</time> ·{' '}
          {formatReadingTime(card.readingMinutes)}
        </p>
      </div>
    </article>
  )
}
