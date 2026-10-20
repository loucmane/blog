import Link from 'next/link'

import type { HomeDirectionProps } from '../contract'
import {
  ChecklistRow,
  isLongTitle,
  MetaLine,
  PlateBox,
  platePicture,
  Room,
  StoryList,
} from './plate'
import { MonographShell, SectionLabel } from './shell'

/** Home shows the newest story and at most 12 more: three rooms, then up to nine rows. */
const roomCount = 3
const earlierCount = 9

export function MonographHome({ view }: HomeDirectionProps) {
  const { lead } = view
  const cover = lead ? platePicture(lead.image, 'cover') : null
  const rooms = view.recent.slice(0, roomCount)
  const earlier = view.recent.slice(roomCount, roomCount + earlierCount)
  return (
    <MonographShell
      isHome
      leadImage={cover ? { image: cover.image, sizes: cover.sizes } : null}
      navigation={view.navigation}
    >
      {lead ? (
        <>
          <div
            className={cover ? 'qm-cover qm-plate' : 'qm-cover qm-plate qm-cover-text'}
            style={cover?.style}
          >
            <SectionLabel section={lead.section} />
            <h2
              className={`qm-plate-title qm-cover-title${isLongTitle(lead.title) ? ' qm-title-long' : ''}`}
            >
              <Link href={lead.href}>{lead.title}</Link>
            </h2>
            {cover ? <PlateBox picture={cover} preload /> : null}
            {lead.dek ? <p className="qm-dek">{lead.dek}</p> : null}
            <MetaLine story={lead} />
          </div>
          {rooms.length > 0 ? (
            <section className="qm-rooms">
              <h2 className="qm-sr-only">Recent stories</h2>
              <StoryList className="qm-room-list">
                {rooms.map((story) => (
                  <Room heading="h3" key={story.slug} story={story} />
                ))}
              </StoryList>
            </section>
          ) : null}
          {earlier.length > 0 ? (
            <section className="qm-earlier">
              <h2 className="qm-label">Earlier stories</h2>
              <StoryList className="qm-rows">
                {earlier.map((story) => (
                  <ChecklistRow key={story.slug} story={story} />
                ))}
              </StoryList>
            </section>
          ) : null}
        </>
      ) : (
        <section className="qm-empty">
          <h2>No stories yet</h2>
          <p>New stories will appear here when they are published.</p>
        </section>
      )}
    </MonographShell>
  )
}
