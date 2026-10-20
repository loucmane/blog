import Link from 'next/link'

import { ArticleBody } from '@/reader/components/article-body'
import { ReaderFigure } from '@/reader/components/reader-image'
import { formatPublishedDate, formatReadingTime } from '@/reader/format'
import type { ArticleBlock, ArticleView, ReaderImage } from '@/reader/views'

import type { ArticleDirectionProps } from '../contract'
import { SwissLabelRow } from './index-row'
import { SwissShell } from './shell'
import { isLongTitle, platesAlone, SwissPlate } from './story-card'

/** A landscape hero spans columns 2–4. */
export const heroSizes =
  '(min-width: 1440px) 62.625rem, (min-width: 1024px) calc(70.5vw - 0.375rem), (min-width: 667px) 94vw, calc(100vw - 2.5rem)'
/** An upright hero spans columns 2–3; on tablets it takes one column of two, beside its caption. */
export const uprightHeroSizes =
  '(min-width: 1440px) 41.25rem, (min-width: 667px) calc(47vw - 0.75rem), (min-width: 600px) calc(50vw - 2rem), calc(100vw - 2.5rem)'

/**
 * Body figures stay at text width: the 65ch measure at the 20px body size (fonts.test.ts derives
 * it and both crossings from the regular face), or the column where it is narrower, columns 2–4
 * up to 1137px and the one-column page up to 846px. Grid and diptych galleries set two images
 * across it, with a 1.5rem gap, from 600px.
 */
export const articleImageSizes = {
  body: '(min-width: 1138px) 49.75rem, (min-width: 1024px) calc(70.5vw - 0.375rem), (min-width: 847px) 49.75rem, (min-width: 667px) 94vw, calc(100vw - 2.5rem)',
  gallery:
    '(min-width: 1138px) 24.125rem, (min-width: 1024px) calc(35.25vw - 0.9375rem), (min-width: 847px) 24.125rem, (min-width: 667px) calc(47vw - 0.75rem), (min-width: 600px) calc(50vw - 2rem), calc(100vw - 2.5rem)',
} as const

/** Upright below 1.2 times the height; an image without stored dimensions counts as landscape. */
function isUpright(image: ReaderImage) {
  return image.width !== null && image.height !== null && image.width < image.height * 1.2
}

/** The images a story shows as figures, in document order, nested blocks included. */
function figureImages(blocks: readonly ArticleBlock[]): readonly ReaderImage[] {
  return blocks.flatMap((block) => {
    switch (block.kind) {
      case 'image':
        return [block.image]
      case 'gallery':
        return block.images
      case 'quote':
      case 'editorial':
        return figureImages(block.blocks)
      case 'bulleted-list':
      case 'numbered-list':
      case 'checklist':
        return block.items.flatMap((item) => figureImages(item.blocks))
      default:
        return []
    }
  })
}

/** Each credit name once, in figure order: the hero's, then the body's. */
function imageCredits(view: ArticleView) {
  const images = [...(view.hero ? [view.hero] : []), ...figureImages(view.body)]
  return [...new Set(images.flatMap(({ credit }) => (credit ? [credit.name] : [])))]
}

/**
 * The story in DOM order, which is also its reading and focus order at every width: the header,
 * the rail of facts (beside the header, hero and body from 1024px), the hero, the body and the end
 * matter, then the related stories after the article.
 */
export function SwissArticle({ imageSizes, view }: ArticleDirectionProps) {
  const { hero } = view
  const heroSize = hero && isUpright(hero) ? uprightHeroSizes : heroSizes
  const credits = imageCredits(view)
  const alone = platesAlone(view.related.map(() => 1))
  return (
    <SwissShell
      navigation={view.navigation}
      leadImage={hero ? { image: hero, sizes: heroSize } : null}
    >
      <article className="si-article">
        <header className="si-article-header">
          <h1 className={isLongTitle(view.title) ? 'si-title-long' : undefined}>{view.title}</h1>
          {view.dek ? <p className="si-dek">{view.dek}</p> : null}
        </header>
        <dl className="si-rail">
          {view.section ? (
            <div>
              <dt>Section</dt>
              <dd>
                <Link href={view.section.href}>{view.section.name}</Link>
              </dd>
            </div>
          ) : null}
          {view.authorLinks.length ? (
            <div>
              <dt>{view.authorLinks.length === 1 ? 'Author' : 'Authors'}</dt>
              {view.authorLinks.map((author) => (
                <dd key={author.href}>
                  <Link href={author.href}>{author.name}</Link>
                </dd>
              ))}
            </div>
          ) : null}
          <div>
            <dt>Published</dt>
            <dd>
              <time dateTime={view.publishedAt}>{formatPublishedDate(view.publishedAt)}</time>
            </dd>
          </div>
          <div>
            <dt>Reading time</dt>
            <dd>{formatReadingTime(view.readingMinutes)}</dd>
          </div>
        </dl>
        {hero ? (
          <div className={isUpright(hero) ? 'si-hero si-hero-upright' : 'si-hero'}>
            <ReaderFigure image={hero} preload sizes={heroSize} />
          </div>
        ) : null}
        <div className="si-body">
          <ArticleBody blocks={view.body} imageSizes={imageSizes} />
        </div>
        {view.topics.length || credits.length ? (
          <dl className="si-end">
            {view.topics.length ? (
              <div>
                <dt>Topics</dt>
                {view.topics.map((topic) => (
                  <dd key={topic.href}>
                    <Link href={topic.href}>{topic.name}</Link>
                  </dd>
                ))}
              </div>
            ) : null}
            {credits.length ? (
              <div>
                <dt>Image credits</dt>
                {credits.map((name) => (
                  <dd key={name}>{name}</dd>
                ))}
              </div>
            ) : null}
          </dl>
        ) : null}
      </article>
      {view.related.length ? (
        <section className="si-related" aria-labelledby="si-related">
          <SwissLabelRow
            count={view.related.length}
            heading
            id="si-related"
            label="Related stories"
          />
          {/* eslint-disable-next-line jsx-a11y-x/no-redundant-roles -- Removed list styles drop list semantics in Safari. */}
          <ol className="si-plates" role="list" start={1}>
            {view.related.map((story, index) => (
              <SwissPlate
                key={story.slug}
                story={story}
                number={index + 1}
                alone={alone[index]}
                headingLevel={3}
              />
            ))}
          </ol>
        </section>
      ) : null}
    </SwissShell>
  )
}
