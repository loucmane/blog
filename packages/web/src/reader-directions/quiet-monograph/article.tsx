import Link from 'next/link'

import { ArticleBody } from '@/reader/components/article-body'
import { ReaderFigure } from '@/reader/components/reader-image'
import type { AuthorLink } from '@/reader/views'

import type { ArticleDirectionProps } from '../contract'
import { ChecklistRow, isLongTitle, MetaLine, platePicture, Room, StoryList } from './plate'
import { MonographShell, SectionLabel } from './shell'

const englishList = new Intl.ListFormat('en', { type: 'conjunction' })

/** "By" and the credited authors as links, joined as an English list: "A, B, and C". */
function Byline({ authors }: { readonly authors: readonly AuthorLink[] }) {
  // Format the positions, so each list element maps back to its author.
  const parts = englishList.formatToParts(authors.map((_, position) => String(position)))
  return (
    <p className="qm-byline">
      By{' '}
      {parts.map((part) => {
        if (part.type !== 'element') return part.value
        const author = authors[Number(part.value)]!
        return (
          <Link href={author.href} key={author.href}>
            {author.name}
          </Link>
        )
      })}
    </p>
  )
}

/**
 * The story opens with its plate: the hero, whole, in the cover's box, with its caption as a wall
 * label. Then the header, the body in a 30em column, the topics under a short stone rule, and
 * Read next. DOM order is also focus and visual order at every width.
 */
export function MonographArticle({ imageSizes, view }: ArticleDirectionProps) {
  const hero = platePicture(view.hero, 'cover')
  const [next, ...more] = view.related
  return (
    <MonographShell
      leadImage={hero ? { image: hero.image, sizes: hero.sizes } : null}
      navigation={view.navigation}
    >
      <article className={hero ? 'qm-article' : 'qm-article qm-article-text'}>
        {hero ? (
          <div className="qm-hero" style={hero.style}>
            <ReaderFigure image={hero.image} preload sizes={hero.sizes} />
          </div>
        ) : null}
        <header className="qm-article-header">
          <SectionLabel section={view.section} />
          <h1 className={isLongTitle(view.title) ? 'qm-title-long' : undefined}>{view.title}</h1>
          {view.dek ? <p className="qm-dek">{view.dek}</p> : null}
          {view.authorLinks.length > 0 ? <Byline authors={view.authorLinks} /> : null}
          <MetaLine story={view} />
        </header>
        <div className="qm-body">
          <ArticleBody blocks={view.body} imageSizes={imageSizes} />
        </div>
        {view.topics.length > 0 ? (
          <footer className="qm-end">
            <h2 className="qm-label">Topics</h2>
            {/* eslint-disable-next-line jsx-a11y-x/no-redundant-roles -- Keeps list semantics in Safari. */}
            <ul role="list">
              {view.topics.map((topic) => (
                <li key={topic.href}>
                  <Link href={topic.href}>{topic.name}</Link>
                </li>
              ))}
            </ul>
          </footer>
        ) : null}
      </article>
      {next ? (
        // Not "Related stories": the editorial block of that name already labels a region.
        <section className="qm-read-next">
          <h2 className="qm-label">Read next</h2>
          <StoryList className="qm-read-next-list">
            <Room heading="h3" story={next} />
            {more.map((story) => (
              <ChecklistRow key={story.slug} story={story} />
            ))}
          </StoryList>
        </section>
      ) : null}
    </MonographShell>
  )
}
