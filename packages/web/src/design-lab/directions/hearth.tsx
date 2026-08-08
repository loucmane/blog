import { Nunito_Sans } from 'next/font/google'
import type { CSSProperties, ReactNode } from 'react'

import { defineDesignLabDirection } from '../contract'
import type { DesignLabDirectionProps, DesignLabStory } from '../types'
import { BodyEditor, EditorFields, StoryCopy, StoryImage, wordCount } from '../view-helpers'
import styles from './hearth.module.css'

const hearthFont = Nunito_Sans({
  display: 'swap',
  fallback: ['Trebuchet MS', 'Arial'],
  subsets: ['latin'],
  variable: '--font-hearth',
})

const touchTarget: CSSProperties = { minHeight: 44, minWidth: 44 }
const minimumText: CSSProperties = { fontSize: 11 }

const stations = ['Write', 'Look', 'Ready', 'Out in the world'] as const

interface JourneyState {
  readonly currentIndex: number
  readonly sentence: string
  readonly state: DesignLabStory['status']
}

function journeyState(story: DesignLabStory): JourneyState {
  if (story.status === 'published') {
    return {
      currentIndex: 3,
      sentence: 'Published — readers can see this',
      state: 'published',
    }
  }
  if (story.status === 'scheduled') {
    return {
      currentIndex: 2,
      sentence: 'Scheduled — goes out Sunday 08:00',
      state: 'scheduled',
    }
  }
  return { currentIndex: 0, sentence: 'Draft — saved just now', state: 'draft' }
}

function Stitch({ current, complete }: { readonly complete: boolean; readonly current: boolean }) {
  return (
    <span aria-hidden="true" className={styles.stitch} data-complete={complete}>
      <svg viewBox="0 0 24 24">
        <circle className={styles.stitchGround} cx="12" cy="12" r="8" />
        <circle className={styles.stitchThread} cx="12" cy="12" data-current={current} r="8" />
      </svg>
    </span>
  )
}

function LifecycleThread({ story }: { readonly story: DesignLabStory }) {
  const journey = journeyState(story)

  return (
    <nav aria-label="Story journey" className={styles.journey}>
      <ol>
        {stations.map((station, index) => {
          const current = index === journey.currentIndex
          return (
            <li
              aria-current={current ? 'step' : undefined}
              data-complete={index <= journey.currentIndex}
              data-current={current}
              key={station}
            >
              <Stitch complete={index <= journey.currentIndex} current={current} />
              <span className={styles.stationLabel} data-ui-text="true" style={minimumText}>
                {station}
              </span>
              {current ? (
                <strong
                  className={styles.stateSentence}
                  data-state={journey.state}
                  data-testid="hearth-lifecycle-state"
                  data-ui-text="true"
                  style={minimumText}
                >
                  {journey.sentence}
                </strong>
              ) : (
                <span aria-hidden="true" className={styles.stateSpacer} />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function HearthRoot({
  children,
  className,
  view,
}: {
  readonly children: ReactNode
  readonly className: string
  readonly view: 'desk' | 'reader' | 'write'
}) {
  return (
    <section className={`${styles.root} ${className} ${hearthFont.variable}`} data-view={view}>
      {children}
    </section>
  )
}

function WorkroomHeader({ story }: { readonly story: DesignLabStory }) {
  return (
    <header className={styles.workroomHeader}>
      <div>
        <p className={styles.eyebrow} data-ui-text="true" style={minimumText}>
          Your writing table
        </p>
        <p className={styles.saved} data-ui-text="true" style={minimumText}>
          {story.saved}
        </p>
      </div>
      <LifecycleThread story={story} />
    </header>
  )
}

function ThreadRule() {
  return <span aria-hidden="true" className={styles.threadRule} />
}

function OwnerPhoto({
  className,
  pinned = false,
  story,
}: {
  readonly className: string
  readonly pinned?: boolean
  readonly story: DesignLabStory
}) {
  const hasCaption = Boolean(story.imageCaption || story.imageCredit)
  return (
    <figure className={`${styles.figure} ${className}`} data-pinned={pinned}>
      {pinned ? <span aria-hidden="true" className={styles.photoPin} /> : null}
      <StoryImage className={styles.photoImage!} story={story} />
      {hasCaption ? (
        <figcaption data-ui-text="true" style={minimumText}>
          {story.imageCaption ? <span>{story.imageCaption}</span> : null}
          {story.imageCredit ? <cite>{story.imageCredit}</cite> : null}
        </figcaption>
      ) : null}
    </figure>
  )
}

export function HearthDesk({ actions, story }: DesignLabDirectionProps) {
  return (
    <HearthRoot className={styles.desk!} view="desk">
      <WorkroomHeader story={story} />
      <main className={styles.deskMain}>
        <div className={styles.deskIntro}>
          <p className={styles.eyebrow} data-ui-text="true" style={minimumText}>
            One story in hand
          </p>
          <h1>{story.title}</h1>
          <button
            className={styles.primaryAction}
            onClick={actions.createStory}
            style={touchTarget}
            type="button"
          >
            Start a new post
          </button>
        </div>
        <article className={styles.swatchCard}>
          <OwnerPhoto className={styles.deskPhoto!} story={story} />
          <div className={styles.swatchCopy}>
            <p className={styles.eyebrow} data-ui-text="true" style={minimumText}>
              {story.section} · {wordCount(story)} words
            </p>
            <h2>{story.title}</h2>
            <p>{story.dek}</p>
          </div>
          <ThreadRule />
          <div className={styles.swatchActions}>
            <button onClick={() => actions.setView('write')} style={touchTarget} type="button">
              Keep writing
            </button>
            <button onClick={() => actions.setView('reader')} style={touchTarget} type="button">
              Look at it
            </button>
          </div>
        </article>
      </main>
    </HearthRoot>
  )
}

export function HearthWrite(props: DesignLabDirectionProps) {
  const { actions, story } = props
  return (
    <HearthRoot className={styles.write!} view="write">
      <WorkroomHeader story={story} />
      <main className={styles.writeMain}>
        <div className={styles.writeHeading}>
          <button
            className={styles.quietAction}
            onClick={() => actions.setView('desk')}
            style={touchTarget}
            type="button"
          >
            ← Writing table
          </button>
          <p className={styles.eyebrow} data-ui-text="true" style={minimumText}>
            Keep writing
          </p>
          <h1>{story.title}</h1>
        </div>
        <article className={styles.writingSurface}>
          <ThreadRule />
          <EditorFields {...props} />
          <div className={styles.pinnedPhoto}>
            <OwnerPhoto className={styles.writePhoto!} pinned story={story} />
            <button
              className={styles.photoAction}
              onClick={actions.openUpload}
              style={touchTarget}
              type="button"
            >
              {story.mediaId ? 'Replace photo' : 'Add photo'}
            </button>
          </div>
          <BodyEditor {...props} />
        </article>
        <div className={styles.writeActions}>
          <button
            className={styles.primaryAction}
            onClick={() => actions.setView('reader')}
            style={touchTarget}
            type="button"
          >
            Look at it
          </button>
          <button
            className={styles.secondaryAction}
            onClick={actions.openPublication}
            style={touchTarget}
            type="button"
          >
            Review publication
          </button>
        </div>
      </main>
    </HearthRoot>
  )
}

export function HearthReader({ actions, story }: DesignLabDirectionProps) {
  return (
    <HearthRoot className={styles.reader!} view="reader">
      <WorkroomHeader story={story} />
      <div className={styles.readerOwnerBar}>
        <button
          className={styles.quietAction}
          onClick={() => actions.setView('write')}
          style={touchTarget}
          type="button"
        >
          ← Back to writing
        </button>
      </div>
      <article className={styles.readerStory} data-testid="hearth-reader-story">
        <header>
          <p className={styles.readerSection}>{story.section}</p>
          <h1>{story.title}</h1>
          <p className={styles.readerDek}>{story.dek}</p>
        </header>
        <OwnerPhoto className={styles.readerPhoto!} story={story} />
        <StoryCopy className={styles.readerCopy!} story={story} />
      </article>
      <div className={styles.readerActionBar}>
        <button
          className={styles.primaryAction}
          onClick={actions.openPublication}
          style={touchTarget}
          type="button"
        >
          Review publication
        </button>
      </div>
    </HearthRoot>
  )
}

export const hearthDirection = defineDesignLabDirection({
  id: 'hearth',
  metadata: {
    character: 'Oat cloth, walnut ink, madder thread, and dye-indigo focus.',
    collection: 'Round 6 · Client set',
    name: 'Hearth',
    order: 'N5',
    ownerFit: 'The most humane option for an owner who wants writing to feel familiar.',
    risk: 'The craft language must never obscure literal publishing actions or status.',
    signature: 'A stitched thread carries each story from writing to the world.',
    thesis: 'Writing is handwork.',
  },
  views: { desk: HearthDesk, reader: HearthReader, write: HearthWrite },
})
