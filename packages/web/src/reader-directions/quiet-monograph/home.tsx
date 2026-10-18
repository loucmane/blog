import Link from 'next/link'

import { ReaderImageView } from '@/reader/components/reader-image'
import { formatPublishedDate } from '@/reader/format'

import type { HomeDirectionProps } from '../contract'
import { MonographShell, SectionLabel } from './shell'

const coverSizes = '(min-width: 1009px) 58rem, (min-width: 500px) 92vw, calc(100vw - 2.5rem)'

export function MonographHome({ view }: HomeDirectionProps) {
  const { lead } = view
  const recent = view.recent.slice(0, 3)
  const more = view.recent.slice(3)
  return (
    <MonographShell
      isHome
      leadImage={lead?.image ? { image: lead.image, sizes: coverSizes } : null}
      navigation={view.navigation}
    >
      {lead ? (
        <>
          <section
            aria-label="Lead story"
            className={`qm-cover${lead.image ? '' : ' qm-cover-text'}`}
          >
            <SectionLabel section={lead.section} />
            <h2 className="qm-cover-title">
              <Link href={lead.href}>{lead.title}</Link>
            </h2>
            {lead.image ? (
              <Link
                aria-label={`Read: ${lead.title}`}
                className="qm-cover-image"
                href={lead.href}
                tabIndex={-1}
              >
                <ReaderImageView image={lead.image} preload sizes={coverSizes} />
              </Link>
            ) : null}
            {lead.dek ? <p className="qm-cover-dek">{lead.dek}</p> : null}
            <Link className="qm-read" href={lead.href}>
              Read the story<span aria-hidden="true"> ↗</span>
              <span className="qm-sr-only">: {lead.title}</span>
            </Link>
          </section>
          {recent.length > 0 ? (
            <section aria-labelledby="qm-recent" className="qm-recent">
              <h2 className="qm-sr-only" id="qm-recent">
                Recent stories
              </h2>
              <ul className="qm-trio">
                {recent.map((story) => (
                  <li key={story.slug}>
                    <SectionLabel section={story.section} />
                    <h3 className="qm-card-title">
                      <Link href={story.href}>{story.title}</Link>
                    </h3>
                    <p className="qm-date">
                      <time dateTime={story.publishedAt}>
                        {formatPublishedDate(story.publishedAt)}
                      </time>
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {more.length > 0 ? (
            <section aria-labelledby="qm-more" className="qm-more">
              <h2 className="qm-label" id="qm-more">
                More stories
              </h2>
              <ul>
                {more.map((story) => (
                  <li key={story.slug}>
                    <SectionLabel section={story.section} />
                    <h3 className="qm-card-title">
                      <Link href={story.href}>{story.title}</Link>
                    </h3>
                    <p className="qm-date">
                      <time dateTime={story.publishedAt}>
                        {formatPublishedDate(story.publishedAt)}
                      </time>
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : (
        <section aria-labelledby="qm-empty" className="qm-empty">
          <h2 id="qm-empty">No stories yet</h2>
          <p>New stories will appear here when they are published.</p>
        </section>
      )}
    </MonographShell>
  )
}
