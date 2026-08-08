import { Archivo, IBM_Plex_Mono, Public_Sans } from 'next/font/google'
import type { CSSProperties, ReactNode } from 'react'

import { defineDesignLabDirection } from '../contract'
import type { DesignLabDirectionProps, DesignLabStory } from '../types'
import { BodyEditor, EditorFields, StoryImage } from '../view-helpers'
import styles from './pulse.module.css'

const pulseDisplay = Archivo({
  axes: ['wdth'],
  display: 'swap',
  fallback: ['Arial Black', 'Helvetica Neue', 'Arial'],
  subsets: ['latin'],
  variable: '--font-pulse-display',
  weight: 'variable',
})

const pulseText = Public_Sans({
  display: 'swap',
  fallback: ['Helvetica Neue', 'Arial'],
  subsets: ['latin'],
  variable: '--font-pulse-text',
  weight: ['400', '600', '700'],
})

const pulseStamp = IBM_Plex_Mono({
  display: 'swap',
  fallback: ['Courier New', 'monospace'],
  subsets: ['latin'],
  variable: '--font-pulse-stamp',
  weight: ['500', '700'],
})

const touchTarget: CSSProperties = { minHeight: 44, minWidth: 44 }
const minimumText: CSSProperties = { fontSize: 11 }

interface LifecycleCopy {
  readonly sentence: string
  readonly stamp: string
  readonly state: DesignLabStory['status']
}

function lifecycleCopy(story: DesignLabStory): LifecycleCopy {
  if (story.status === 'published') {
    return {
      sentence: 'Readers can see this story now.',
      stamp: 'Published',
      state: 'published',
    }
  }
  if (story.status === 'scheduled') {
    return { sentence: 'Sunday 08:00', stamp: 'Scheduled', state: 'scheduled' }
  }
  return { sentence: 'saved just now', stamp: 'Draft', state: 'draft' }
}

function PulseRoot({
  children,
  className,
  view,
}: {
  readonly children: ReactNode
  readonly className: string
  readonly view: 'desk' | 'reader' | 'write'
}) {
  return (
    <section
      className={`${styles.root} ${className} ${pulseDisplay.variable} ${pulseText.variable} ${pulseStamp.variable}`}
      data-view={view}
    >
      {children}
    </section>
  )
}

function LifecycleStamp({ story }: { readonly story: DesignLabStory }) {
  const lifecycle = lifecycleCopy(story)

  return (
    <div
      aria-label={`${lifecycle.stamp} — ${lifecycle.sentence}`}
      aria-live="polite"
      className={styles.lifecycle}
      data-state={lifecycle.state}
      data-testid="pulse-lifecycle-state"
      role="status"
    >
      <strong data-testid="pulse-lifecycle-stamp">{lifecycle.stamp}</strong>
      <span aria-hidden="true" className={styles.lifecycleDash}>
        —
      </span>
      <span data-testid="pulse-lifecycle-sentence">{lifecycle.sentence}</span>
    </div>
  )
}

function SectionStamp({ section }: { readonly section: string }) {
  return (
    <span
      className={styles.sectionStamp}
      data-motion="press-once"
      data-testid="pulse-section-stamp"
      data-ui-text="true"
      style={minimumText}
    >
      {section}
    </span>
  )
}

function Masthead({ label, saved }: { readonly label: string; readonly saved: string }) {
  return (
    <header className={styles.masthead}>
      <p className={styles.wordmark} data-ui-text="true" style={minimumText}>
        Pulse
      </p>
      <p className={styles.viewLabel} data-ui-text="true" style={minimumText}>
        {label}
      </p>
      <p className={styles.saved} data-ui-text="true" style={minimumText}>
        {saved}
      </p>
    </header>
  )
}

function CoverFigure({
  compact = false,
  story,
}: {
  readonly compact?: boolean
  readonly story: DesignLabStory
}) {
  return (
    <section className={styles.cover} data-compact={compact}>
      <figure className={styles.coverFigure}>
        <StoryImage className={styles.coverImage!} story={story} />
        <SectionStamp section={story.section} />
      </figure>
      <div className={styles.coverTitle}>
        <h1>{story.title}</h1>
      </div>
      <p className={styles.coverDek}>{story.dek}</p>
    </section>
  )
}

function EditorialFigure({ story }: { readonly story: DesignLabStory }) {
  const hasNotes = Boolean(story.imageCaption || story.imageCredit)

  return (
    <figure className={styles.editorialFigure}>
      <StoryImage className={styles.editorialImage!} story={story} />
      {hasNotes ? (
        <figcaption data-ui-text="true" style={minimumText}>
          {story.imageCaption ? <span>{story.imageCaption}</span> : null}
          {story.imageCredit ? <cite>{story.imageCredit}</cite> : null}
        </figcaption>
      ) : null}
    </figure>
  )
}

function ReaderCopy({ story }: { readonly story: DesignLabStory }) {
  const paragraphs = story.body.split(/\n\n+/).filter(Boolean)
  const [opening, ...rest] = paragraphs

  return (
    <div className={styles.readerCopy}>
      {opening ? <p className={styles.readerLead}>{opening}</p> : null}
      <EditorialFigure story={story} />
      <div className={styles.readerText}>
        {rest.map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </div>
  )
}

export function PulseDesk({ actions, story }: DesignLabDirectionProps) {
  return (
    <PulseRoot className={styles.desk!} view="desk">
      <Masthead label="Story desk" saved={story.saved} />
      <main className={styles.deskGrid}>
        <CoverFigure story={story} />
        <aside className={styles.deskActions}>
          <p className={styles.actionLabel} data-ui-text="true" style={minimumText}>
            What happens next
          </p>
          <LifecycleStamp story={story} />
          <button
            className={styles.yellowAction}
            data-pulse-yellow="true"
            onClick={actions.createStory}
            style={touchTarget}
            type="button"
          >
            Start a new post
          </button>
          <button
            className={styles.inkAction}
            onClick={() => actions.setView('write')}
            style={touchTarget}
            type="button"
          >
            Open story
          </button>
          <button
            className={styles.quietAction}
            onClick={() => actions.setView('reader')}
            style={touchTarget}
            type="button"
          >
            Preview story
          </button>
        </aside>
      </main>
    </PulseRoot>
  )
}

export function PulseWrite(props: DesignLabDirectionProps) {
  const { actions, story } = props

  return (
    <PulseRoot className={styles.write!} view="write">
      <header className={styles.writeHeader}>
        <button
          className={styles.quietAction}
          onClick={() => actions.setView('desk')}
          style={touchTarget}
          type="button"
        >
          ← Story desk
        </button>
        <div className={styles.writeIdentity}>
          <p className={styles.wordmark} data-ui-text="true" style={minimumText}>
            Pulse · Write
          </p>
          <p className={styles.saved} data-ui-text="true" style={minimumText}>
            {story.saved}
          </p>
        </div>
        <button
          className={styles.yellowAction}
          data-pulse-yellow="true"
          data-testid="pulse-publication-action"
          onClick={actions.openPublication}
          style={touchTarget}
          type="button"
        >
          Review publication
        </button>
      </header>
      <main className={styles.writeGrid}>
        <aside className={styles.liveCover}>
          <p className={styles.blockLabel} data-ui-text="true" style={minimumText}>
            Live cover
          </p>
          <CoverFigure compact story={story} />
          <LifecycleStamp story={story} />
        </aside>
        <article className={styles.editor}>
          <section className={styles.editorBlock}>
            <p className={styles.blockLabel} data-ui-text="true" style={minimumText}>
              Story headline
            </p>
            <EditorFields {...props} />
          </section>
          <section className={styles.editorBlock}>
            <p className={styles.blockLabel} data-ui-text="true" style={minimumText}>
              Cover photo
            </p>
            <EditorialFigure story={story} />
            <button
              className={styles.inkAction}
              onClick={actions.openUpload}
              style={touchTarget}
              type="button"
            >
              {story.mediaId ? 'Replace cover photo' : 'Add cover photo'}
            </button>
          </section>
          <section className={styles.editorBlock}>
            <p className={styles.blockLabel} data-ui-text="true" style={minimumText}>
              Story body
            </p>
            <BodyEditor {...props} />
          </section>
        </article>
      </main>
    </PulseRoot>
  )
}

export function PulseReader({ actions, story }: DesignLabDirectionProps) {
  return (
    <PulseRoot className={styles.reader!} view="reader">
      <header className={styles.readerOwnerBar}>
        <button
          className={styles.quietAction}
          onClick={() => actions.setView('write')}
          style={touchTarget}
          type="button"
        >
          ← Back to writing
        </button>
        <LifecycleStamp story={story} />
        <button
          className={styles.yellowAction}
          data-pulse-yellow="true"
          data-testid="pulse-reader-publication-action"
          onClick={actions.openPublication}
          style={touchTarget}
          type="button"
        >
          Review publication
        </button>
      </header>
      <article className={styles.readerStory} data-testid="pulse-reader-story">
        <header className={styles.readerOpening}>
          <SectionStamp section={story.section} />
          <div className={styles.readerTitleBlock}>
            <h1>{story.title}</h1>
          </div>
          <p>{story.dek}</p>
        </header>
        <ReaderCopy story={story} />
      </article>
    </PulseRoot>
  )
}

export const pulseDirection = defineDesignLabDirection({
  id: 'pulse',
  metadata: {
    character: 'Paper, cobalt, scarlet, sun yellow, and ink assembled as a live cover.',
    collection: 'Round 6 · Client set',
    name: 'Pulse',
    order: 'N7',
    ownerFit: 'The highest-energy option for a magazine that covers the present tense.',
    risk: 'Its visual volume must never drown the one next action.',
    signature: 'A scarlet section stamp presses into a cobalt headline-and-image collision.',
    thesis: 'A culture front page with a heartbeat.',
  },
  views: { desk: PulseDesk, reader: PulseReader, write: PulseWrite },
})
