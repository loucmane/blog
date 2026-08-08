import { Archivo_Black, Archivo_Narrow } from 'next/font/google'
import type { CSSProperties, ReactNode } from 'react'

import { defineDesignLabDirection } from '../contract'
import type { DesignLabDirectionProps, DesignLabStory } from '../types'
import { BodyEditor, EditorFields, StoryCopy, StoryImage, wordCount } from '../view-helpers'
import styles from './spread.module.css'

const displayFont = Archivo_Black({
  fallback: ['Arial Black', 'Impact'],
  subsets: ['latin'],
  variable: '--font-spread-display',
  weight: '400',
})

const textFont = Archivo_Narrow({
  fallback: ['Arial Narrow', 'Helvetica Neue', 'Arial'],
  subsets: ['latin'],
  variable: '--font-spread-text',
  weight: ['400', '600', '700'],
})

const touchTarget: CSSProperties = { minHeight: 44, minWidth: 44 }
const minimumText: CSSProperties = { fontSize: 11 }

interface LifecycleImprint {
  readonly copy: string
  readonly state: DesignLabStory['status']
}

function lifecycleImprint(story: DesignLabStory): LifecycleImprint {
  if (story.status === 'published') return { copy: 'Published', state: 'published' }
  if (story.status === 'scheduled') {
    return { copy: 'Scheduled — Sunday 08:00', state: 'scheduled' }
  }
  return { copy: 'Draft — saved just now', state: 'draft' }
}

function Imprint({
  onActivate,
  story,
}: {
  readonly onActivate?: () => void
  readonly story: DesignLabStory
}) {
  const imprint = lifecycleImprint(story)

  if (onActivate) {
    return (
      <button
        aria-label={`${imprint.copy}. Open publication review`}
        className={styles.imprint}
        data-actionable="true"
        data-state={imprint.state}
        data-testid="spread-lifecycle-imprint"
        data-ui-text="true"
        onClick={onActivate}
        style={{ ...touchTarget, ...minimumText }}
        type="button"
      >
        {imprint.copy}
      </button>
    )
  }

  return (
    <p
      className={styles.imprint}
      data-actionable="false"
      data-state={imprint.state}
      data-testid="spread-lifecycle-imprint"
      data-ui-text="true"
      style={minimumText}
    >
      {imprint.copy}
    </p>
  )
}

function SpreadRoot({
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
      className={`${styles.root} ${className} ${displayFont.variable} ${textFont.variable}`}
      data-view={view}
    >
      {children}
    </section>
  )
}

function UtilityLine({ story }: { readonly story: DesignLabStory }) {
  return (
    <div className={styles.utilityLine} data-ui-text="true" style={minimumText}>
      <strong>{story.section}</strong>
      <span>{wordCount(story)} words</span>
      <span>{story.saved}</span>
    </div>
  )
}

function MobileActions({ actions }: Pick<DesignLabDirectionProps, 'actions'>) {
  return (
    <div className={styles.mobileActions} data-testid="spread-mobile-actions">
      <button onClick={actions.createStory} style={touchTarget} type="button">
        Begin a story
      </button>
      <button onClick={actions.openPublication} style={touchTarget} type="button">
        Review publication
      </button>
    </div>
  )
}

function OwnerFigure({
  className,
  story,
}: {
  readonly className: string
  readonly story: DesignLabStory
}) {
  const hasCaption = Boolean(story.imageCaption || story.imageCredit)
  return (
    <figure className={`${styles.figure} ${className}`}>
      <StoryImage className={styles.figureImage!} story={story} />
      {hasCaption ? (
        <figcaption data-ui-text="true" style={minimumText}>
          {story.imageCaption ? <span>{story.imageCaption}</span> : null}
          {story.imageCredit ? <cite>{story.imageCredit}</cite> : null}
        </figcaption>
      ) : null}
    </figure>
  )
}

export function SpreadDesk({ actions, story }: DesignLabDirectionProps) {
  return (
    <SpreadRoot className={styles.desk!} view="desk">
      <header className={styles.deskHeader}>
        <UtilityLine story={story} />
      </header>
      <main className={styles.deskSpread}>
        <div className={styles.deskHeadline}>
          <p className={styles.kicker} data-ui-text="true" style={minimumText}>
            {story.section}
          </p>
          <h1 className={styles.title}>{story.title}</h1>
        </div>
        <aside className={styles.deskRail}>
          <p className={styles.standfirst}>{story.dek}</p>
          <OwnerFigure className={styles.deskFigure!} story={story} />
          <div className={styles.folio}>
            <span aria-hidden="true">¶</span>
            <strong>{wordCount(story)}</strong>
            <span data-ui-text="true" style={minimumText}>
              words in this story
            </span>
          </div>
          <Imprint onActivate={actions.openPublication} story={story} />
        </aside>
      </main>
      <button
        className={styles.inkBar}
        onClick={actions.createStory}
        style={touchTarget}
        type="button"
      >
        <span>Begin a story</span>
        <span aria-hidden="true">→</span>
      </button>
      <MobileActions actions={actions} />
    </SpreadRoot>
  )
}

function LiveSpread({ story }: { readonly story: DesignLabStory }) {
  return (
    <article className={styles.liveSpread} data-testid="spread-live-preview">
      <div className={styles.previewUtility} data-ui-text="true" style={minimumText}>
        <span>{story.section}</span>
        <span>{wordCount(story)} words</span>
      </div>
      <h2 className={styles.title}>{story.title}</h2>
      <p>{story.dek}</p>
      <OwnerFigure className={styles.previewFigure!} story={story} />
      <Imprint story={story} />
    </article>
  )
}

export function SpreadWrite(props: DesignLabDirectionProps) {
  const { actions, story } = props
  return (
    <SpreadRoot className={styles.write!} view="write">
      <header className={styles.writeHeader}>
        <button
          className={styles.quietAction}
          onClick={() => actions.setView('desk')}
          style={touchTarget}
          type="button"
        >
          ← Desk
        </button>
        <div data-ui-text="true" style={minimumText}>
          <span>{story.section}</span>
          <strong>{story.saved}</strong>
        </div>
        <button
          className={styles.reviewAction}
          onClick={actions.openPublication}
          style={touchTarget}
          type="button"
        >
          Review publication
        </button>
      </header>
      <main className={styles.writeGrid}>
        <div className={styles.previewPane}>
          <p className={styles.paneLabel} data-ui-text="true" style={minimumText}>
            Live spread · updates as you write
          </p>
          <LiveSpread story={story} />
        </div>
        <article className={styles.editorPane}>
          <div className={styles.editorFolio} data-ui-text="true" style={minimumText}>
            <span>Story text</span>
            <span>{wordCount(story)} words</span>
          </div>
          <EditorFields {...props} />
          <div className={styles.editorMedia}>
            <OwnerFigure className={styles.editorFigure!} story={story} />
            <div aria-label="Editorial image actions" className={styles.mediaActions}>
              <button onClick={actions.openUpload} style={touchTarget} type="button">
                {story.mediaId ? 'Replace image' : 'Add image'}
              </button>
              <button onClick={actions.openUpload} style={touchTarget} type="button">
                Caption
              </button>
              <button onClick={actions.openUpload} style={touchTarget} type="button">
                Credit
              </button>
            </div>
          </div>
          <BodyEditor {...props} />
        </article>
      </main>
      <MobileActions actions={actions} />
    </SpreadRoot>
  )
}

export function SpreadReader({ actions, story }: DesignLabDirectionProps) {
  return (
    <SpreadRoot className={styles.reader!} view="reader">
      <header className={styles.readerHeader}>
        <UtilityLine story={story} />
        <button
          className={styles.quietAction}
          onClick={() => actions.setView('write')}
          style={touchTarget}
          type="button"
        >
          Back to writing
        </button>
      </header>
      <article className={styles.readerArticle}>
        <header className={styles.readerOpener}>
          <p className={styles.kicker} data-ui-text="true" style={minimumText}>
            {story.section}
          </p>
          <h1 className={styles.title}>{story.title}</h1>
          <p className={styles.readerStandfirst}>{story.dek}</p>
          <Imprint story={story} />
        </header>
        <StoryCopy className={styles.readerCopy!} story={story} />
        <OwnerFigure className={styles.readerFigure!} story={story} />
      </article>
      <MobileActions actions={actions} />
    </SpreadRoot>
  )
}

export const spreadDirection = defineDesignLabDirection({
  id: 'spread',
  metadata: {
    character: 'Paper white, hard ink, persimmon rules, and headline-scale tension.',
    collection: 'Round 6 · Client set',
    name: 'Spread',
    order: 'N4',
    ownerFit: 'The boldest text-forward option for a publication whose voice is its brand.',
    risk: 'Headline scale must preserve orientation and controls on narrow screens.',
    signature: 'The owner’s headline recomposes as the working magazine spread.',
    thesis: 'The headline is the interface.',
  },
  views: { desk: SpreadDesk, reader: SpreadReader, write: SpreadWrite },
})
