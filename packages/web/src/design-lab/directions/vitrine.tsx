import { Montserrat, Newsreader } from 'next/font/google'
import type { CSSProperties, ReactNode } from 'react'

import { defineDesignLabDirection } from '../contract'
import type { DesignLabDirectionProps, DesignLabStory } from '../types'
import { BodyEditor, EditorFields, StoryCopy, StoryImage } from '../view-helpers'
import styles from './vitrine.module.css'

const vitrineDisplay = Montserrat({
  display: 'swap',
  fallback: ['Arial Narrow', 'Arial'],
  subsets: ['latin'],
  variable: '--font-vitrine-display',
  weight: ['200', '500'],
})

const vitrineText = Newsreader({
  display: 'swap',
  fallback: ['Georgia', 'Times New Roman'],
  subsets: ['latin'],
  variable: '--font-vitrine-text',
  weight: ['400', '600'],
})

const touchTarget: CSSProperties = { minHeight: 44, minWidth: 44 }
const minimumText: CSSProperties = { fontSize: 11 }

interface PlateState {
  readonly accent: boolean
  readonly lifecycle: string
  readonly nextAction: string
  readonly state: DesignLabStory['status']
}

function plateState(story: DesignLabStory): PlateState {
  if (story.status === 'published') {
    return {
      accent: true,
      lifecycle: 'Published',
      nextAction: 'Published — open Review publication to make changes.',
      state: 'published',
    }
  }
  if (story.status === 'scheduled') {
    return {
      accent: true,
      lifecycle: 'Scheduled — Sunday 08:00',
      nextAction: 'Ready to publish — open Review publication.',
      state: 'scheduled',
    }
  }
  return {
    accent: false,
    lifecycle: 'Draft — saved just now',
    nextAction: 'Keep writing — open the story to continue.',
    state: 'draft',
  }
}

function VitrineRoot({
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
      className={`${styles.root} ${className} ${vitrineDisplay.variable} ${vitrineText.variable}`}
      data-view={view}
    >
      {children}
    </section>
  )
}

function GalleryHeader({ label, saved }: { readonly label: string; readonly saved: string }) {
  return (
    <header className={styles.galleryHeader}>
      <p className={styles.wordmark} data-ui-text="true" style={minimumText}>
        Vitrine
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

function CaptionPlate({ story }: { readonly story: DesignLabStory }) {
  const status = plateState(story)

  return (
    <section aria-label="Story status" className={styles.captionPlate}>
      <div className={styles.plateIdentity}>
        <p className={styles.plateTitle}>{story.title}</p>
        <p className={styles.plateSection} data-ui-text="true" style={minimumText}>
          {story.section}
        </p>
      </div>
      <div className={styles.plateStatus}>
        <span
          aria-hidden="true"
          className={styles.stateMark}
          data-accent={status.accent}
          data-testid="vitrine-state-mark"
        />
        <strong aria-live="polite" data-state={status.state} data-testid="vitrine-lifecycle-state">
          {status.lifecycle}
        </strong>
        <p data-testid="vitrine-next-action">{status.nextAction}</p>
      </div>
    </section>
  )
}

function ExhibitFigure({
  className,
  story,
}: {
  readonly className: string
  readonly story: DesignLabStory
}) {
  return (
    <figure className={`${styles.exhibitFigure} ${className}`}>
      <div className={styles.case}>
        <StoryImage className={styles.exhibitImage!} story={story} />
        <h1>{story.title}</h1>
      </div>
      <CaptionPlate story={story} />
    </figure>
  )
}

function ImagePlate({ story }: { readonly story: DesignLabStory }) {
  const hasNotes = Boolean(story.imageCaption || story.imageCredit)
  return (
    <figure className={styles.imagePlate}>
      <div className={styles.case}>
        <StoryImage className={styles.editorImage!} story={story} />
      </div>
      {hasNotes ? (
        <figcaption data-ui-text="true" style={minimumText}>
          {story.imageCaption ? <span>{story.imageCaption}</span> : null}
          {story.imageCredit ? <cite>{story.imageCredit}</cite> : null}
        </figcaption>
      ) : null}
    </figure>
  )
}

export function VitrineDesk({ actions, story }: DesignLabDirectionProps) {
  return (
    <VitrineRoot className={styles.desk!} view="desk">
      <GalleryHeader label="Story desk" saved={story.saved} />
      <main className={styles.deskMain}>
        <ExhibitFigure className={styles.deskExhibit!} story={story} />
        <div className={styles.deskActions}>
          <button
            className={styles.primaryAction}
            onClick={actions.createStory}
            style={touchTarget}
            type="button"
          >
            Start a new post
          </button>
          <div className={styles.quietActions}>
            <button onClick={() => actions.setView('write')} style={touchTarget} type="button">
              Open story
            </button>
            <button onClick={() => actions.setView('reader')} style={touchTarget} type="button">
              Preview story
            </button>
          </div>
        </div>
      </main>
    </VitrineRoot>
  )
}

export function VitrineWrite(props: DesignLabDirectionProps) {
  const { actions, story } = props

  return (
    <VitrineRoot className={styles.write!} view="write">
      <header className={styles.writeHeader}>
        <button
          className={styles.quietButton}
          onClick={() => actions.setView('desk')}
          style={touchTarget}
          type="button"
        >
          ← Story desk
        </button>
        <div className={styles.writeIdentity}>
          <p className={styles.wordmark} data-ui-text="true" style={minimumText}>
            Vitrine · Write
          </p>
          <p className={styles.saved} data-ui-text="true" style={minimumText}>
            {story.saved}
          </p>
        </div>
        <button
          className={styles.reviewAction}
          data-testid="vitrine-publication-action"
          onClick={actions.openPublication}
          style={touchTarget}
          type="button"
        >
          Review publication
        </button>
      </header>
      <main className={styles.writeMain}>
        <div className={styles.writeIntroduction}>
          <p data-ui-text="true" style={minimumText}>
            Open case
          </p>
          <h1>{story.title}</h1>
        </div>
        <article className={`${styles.editorCase} ${styles.case}`}>
          <EditorFields {...props} />
          <ImagePlate story={story} />
          <button
            className={styles.imageAction}
            onClick={actions.openUpload}
            style={touchTarget}
            type="button"
          >
            {story.mediaId ? 'Replace image' : 'Add image'}
          </button>
          <div className={styles.bodyEngraving}>
            <BodyEditor {...props} />
          </div>
        </article>
        <CaptionPlate story={story} />
      </main>
    </VitrineRoot>
  )
}

export function VitrineReader({ actions, story }: DesignLabDirectionProps) {
  return (
    <VitrineRoot className={styles.reader!} view="reader">
      <GalleryHeader label="Reader preview" saved={story.saved} />
      <div className={styles.readerOwnerBar}>
        <button
          className={styles.quietButton}
          onClick={() => actions.setView('write')}
          style={touchTarget}
          type="button"
        >
          ← Back to writing
        </button>
        <button
          className={styles.reviewAction}
          data-testid="vitrine-reader-publication-action"
          onClick={actions.openPublication}
          style={touchTarget}
          type="button"
        >
          Review publication
        </button>
      </div>
      <div className={styles.readerPlate}>
        <CaptionPlate story={story} />
      </div>
      <article className={styles.readerStory} data-testid="vitrine-reader-story">
        <header>
          <p className={styles.readerSection}>{story.section}</p>
          <h1>{story.title}</h1>
          <p className={styles.readerDek}>{story.dek}</p>
        </header>
        <ImagePlate story={story} />
        <StoryCopy className={styles.readerCopy!} story={story} />
      </article>
    </VitrineRoot>
  )
}

export const vitrineDirection = defineDesignLabDirection({
  id: 'vitrine',
  metadata: {
    character: 'Gallery white, petrol black, exacting hairlines, and one gold state mark.',
    collection: 'Round 6 · Client set',
    name: 'Vitrine',
    order: 'N6',
    ownerFit: 'The most exclusive-feeling option for a brand that prefers to whisper.',
    risk: 'Its sparseness must keep literal actions and status consistently visible.',
    signature: 'A story is exhibited inside a line-drawn case with one caption plate.',
    thesis: 'The story under glass.',
  },
  views: { desk: VitrineDesk, reader: VitrineReader, write: VitrineWrite },
})
