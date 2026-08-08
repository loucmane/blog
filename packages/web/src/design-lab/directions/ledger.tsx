import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google'
import type { CSSProperties, ReactNode } from 'react'

import { defineDesignLabDirection } from '../contract'
import type { DesignLabDirectionProps, DesignLabStory } from '../types'
import { BodyEditor, EditorFields, StoryImage, wordCount } from '../view-helpers'
import styles from './ledger.module.css'

const ledgerText = IBM_Plex_Sans({
  display: 'swap',
  fallback: ['Helvetica Neue', 'Arial', 'sans-serif'],
  subsets: ['latin'],
  variable: '--font-ledger-text',
  weight: ['400', '500'],
})

const ledgerData = IBM_Plex_Mono({
  display: 'swap',
  fallback: ['Courier New', 'monospace'],
  subsets: ['latin'],
  variable: '--font-ledger-data',
  weight: ['400', '500'],
})

const touchTarget: CSSProperties = { minHeight: 44, minWidth: 44 }
const minimumText: CSSProperties = { fontSize: 11 }

type SignalTone = 'done' | 'info' | 'needs'

interface LifecycleState {
  readonly copy: string
  readonly label: 'Draft' | 'Published' | 'Scheduled'
  readonly state: DesignLabStory['status']
  readonly tone: SignalTone
}

interface SectionState {
  readonly ready: boolean
  readonly tone: SignalTone
  readonly word: 'Done' | 'Needs you'
}

function lifecycleState(story: DesignLabStory): LifecycleState {
  if (story.status === 'published') {
    return { copy: 'Published', label: 'Published', state: 'published', tone: 'done' }
  }
  if (story.status === 'scheduled') {
    return {
      copy: 'Scheduled — Sunday 08:00',
      label: 'Scheduled',
      state: 'scheduled',
      tone: 'info',
    }
  }
  return {
    copy: 'Draft — saved just now',
    label: 'Draft',
    state: 'draft',
    tone: 'needs',
  }
}

function sectionState(ready: boolean): SectionState {
  return ready
    ? { ready: true, tone: 'done', word: 'Done' }
    : { ready: false, tone: 'needs', word: 'Needs you' }
}

function readiness(story: DesignLabStory) {
  return {
    photography: sectionState(Boolean(story.imageAlt.trim())),
    publication: sectionState(Boolean(story.server)),
    summary: sectionState(story.dek.trim().length >= 12),
    write: sectionState(story.title.trim().length >= 4 && story.body.trim().length >= 20),
  }
}

function LedgerRoot({
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
      className={`${styles.root} ${className} ${ledgerText.variable} ${ledgerData.variable}`}
      data-view={view}
    >
      {children}
    </section>
  )
}

function UtilityText({ children }: { readonly children: ReactNode }) {
  return (
    <span className={styles.utility} data-ui-text="true" style={minimumText}>
      {children}
    </span>
  )
}

function Signal({
  label,
  testId,
  tone,
}: {
  readonly label: string
  readonly testId?: string
  readonly tone: SignalTone
}) {
  return (
    <span
      className={styles.signal}
      data-testid={testId}
      data-tone={tone}
      data-ui-text="true"
      style={minimumText}
    >
      <i aria-hidden="true" />
      {label}
    </span>
  )
}

function Lifecycle({ story }: { readonly story: DesignLabStory }) {
  const lifecycle = lifecycleState(story)

  return (
    <span
      aria-live="polite"
      className={styles.lifecycle}
      data-state={lifecycle.state}
      data-testid="ledger-lifecycle-state"
      role="status"
    >
      <Signal label={`State: ${lifecycle.label}`} tone={lifecycle.tone} />
      <span data-testid="ledger-lifecycle-copy">{lifecycle.copy}</span>
    </span>
  )
}

function LedgerHeader({ saved, view }: { readonly saved: string; readonly view: string }) {
  return (
    <header className={styles.ledgerHeader}>
      <UtilityText>Ledger / Editorial system</UtilityText>
      <UtilityText>{view}</UtilityText>
      <UtilityText>{saved}</UtilityText>
    </header>
  )
}

function SpecificationRow({
  label,
  status,
  tone,
  value,
}: {
  readonly label: string
  readonly status: string
  readonly tone: SignalTone
  readonly value: ReactNode
}) {
  return (
    <div className={styles.specificationRow} data-testid={`ledger-row-${label.toLowerCase()}`}>
      <dt>
        <UtilityText>{label}</UtilityText>
      </dt>
      <dd>{value}</dd>
      <dd>
        <Signal label={status} tone={tone} />
      </dd>
    </div>
  )
}

function SectionHeader({
  detail,
  index,
  state,
  title,
}: {
  readonly detail: string
  readonly index: 'A' | 'B' | 'C' | 'D'
  readonly state: SectionState
  readonly title: string
}) {
  return (
    <header className={styles.sectionHeader}>
      <span className={styles.sectionIndex}>{index}</span>
      <div>
        <h2>{title}</h2>
        <p>{detail}</p>
      </div>
      <Signal label={state.word} testId={`ledger-readiness-${index}`} tone={state.tone} />
    </header>
  )
}

function OwnerFigure({ story }: { readonly story: DesignLabStory }) {
  return (
    <figure className={styles.ownerFigure}>
      <StoryImage className={styles.figureImage!} story={story} />
      {story.imageCaption ? (
        <figcaption>
          <UtilityText>{story.imageCaption}</UtilityText>
        </figcaption>
      ) : null}
    </figure>
  )
}

export function LedgerDesk({ actions, story }: DesignLabDirectionProps) {
  const checks = readiness(story)
  const words = wordCount(story)

  return (
    <LedgerRoot className={styles.desk!} view="desk">
      <LedgerHeader saved={story.saved} view="Story desk / 01" />
      <main className={styles.deskSheet}>
        <div className={styles.sheetHeading}>
          <UtilityText>Active story specification</UtilityText>
          <p>One record. Every field names what is ready and what needs you.</p>
        </div>
        <dl className={styles.specification} data-testid="ledger-specification">
          <SpecificationRow
            label="Title"
            status={story.title.trim().length >= 4 ? 'Done' : 'Needs you'}
            tone={story.title.trim().length >= 4 ? 'done' : 'needs'}
            value={<h1>{story.title}</h1>}
          />
          <SpecificationRow label="Section" status="Set" tone="info" value={story.section} />
          <SpecificationRow
            label="Length"
            status="Measured"
            tone="info"
            value={`${words} ${words === 1 ? 'word' : 'words'}`}
          />
          <SpecificationRow
            label="Photography"
            status={checks.photography.word}
            tone={checks.photography.tone}
            value={story.imageAlt || 'Add a description'}
          />
          <SpecificationRow
            label="State"
            status={lifecycleState(story).label}
            tone={lifecycleState(story).tone}
            value={<Lifecycle story={story} />}
          />
        </dl>
        <button
          className={styles.primaryAction}
          onClick={actions.createStory}
          style={touchTarget}
          type="button"
        >
          <span>Start a new post</span>
          <span aria-hidden="true">→</span>
        </button>
        <div className={styles.deskActions}>
          <button
            className={styles.secondaryAction}
            onClick={() => actions.setView('write')}
            style={touchTarget}
            type="button"
          >
            Open story
          </button>
          <button
            className={styles.secondaryAction}
            onClick={() => actions.setView('reader')}
            style={touchTarget}
            type="button"
          >
            Preview story
          </button>
        </div>
      </main>
    </LedgerRoot>
  )
}

export function LedgerWrite(props: DesignLabDirectionProps) {
  const { actions, story } = props
  const checks = readiness(story)

  return (
    <LedgerRoot className={styles.write!} view="write">
      <header className={styles.writeBar}>
        <button
          className={styles.quietAction}
          onClick={() => actions.setView('desk')}
          style={touchTarget}
          type="button"
        >
          ← Story desk
        </button>
        <div>
          <UtilityText>Ledger / Write</UtilityText>
          <span className={styles.saved}>{story.saved}</span>
        </div>
        <button
          className={styles.primaryAction}
          data-testid="ledger-publication-action"
          onClick={actions.openPublication}
          style={touchTarget}
          type="button"
        >
          Review publication
        </button>
      </header>
      <main className={styles.writeSheet}>
        <header className={styles.writeTitle}>
          <UtilityText>Working record / four sections</UtilityText>
          <h1>{story.title}</h1>
        </header>
        <section
          className={styles.formSection}
          data-readiness={checks.write.ready ? 'done' : 'needs-you'}
          data-testid="ledger-section-a"
        >
          <SectionHeader
            detail="Headline, short summary, and the story itself."
            index="A"
            state={checks.write}
            title="Write"
          />
          <div className={styles.fields}>
            <EditorFields {...props} />
            <BodyEditor {...props} />
          </div>
        </section>
        <section
          className={styles.formSection}
          data-readiness={checks.photography.ready ? 'done' : 'needs-you'}
          data-testid="ledger-section-b"
        >
          <SectionHeader
            detail="One good picture is enough. Describe it for every reader."
            index="B"
            state={checks.photography}
            title="Photography"
          />
          <div className={styles.photoField}>
            <OwnerFigure story={story} />
            <div className={styles.photoNotes}>
              <UtilityText>Image description</UtilityText>
              <p>{story.imageAlt || 'No description yet.'}</p>
              <button
                className={styles.secondaryAction}
                onClick={actions.openUpload}
                style={touchTarget}
                type="button"
              >
                {story.mediaId ? 'Replace photograph' : 'Add photograph'}
              </button>
            </div>
          </div>
        </section>
        <section
          className={styles.formSection}
          data-readiness={checks.summary.ready ? 'done' : 'needs-you'}
          data-testid="ledger-section-c"
        >
          <SectionHeader
            detail="The short summary readers see before the story."
            index="C"
            state={checks.summary}
            title="Summary"
          />
          <div className={styles.summaryProof}>
            <p>{story.dek}</p>
            <button
              className={styles.secondaryAction}
              onClick={() => document.getElementById('design-lab-summary')?.focus()}
              style={touchTarget}
              type="button"
            >
              Edit summary above
            </button>
          </div>
        </section>
        <section
          className={styles.formSection}
          data-readiness={checks.publication.ready ? 'done' : 'needs-you'}
          data-testid="ledger-section-d"
        >
          <SectionHeader
            detail="Check the public result, timing, and final readiness."
            index="D"
            state={checks.publication}
            title="Publication"
          />
          <div className={styles.publicationField}>
            <Lifecycle story={story} />
            <button
              className={styles.secondaryAction}
              onClick={() => actions.setView('reader')}
              style={touchTarget}
              type="button"
            >
              Preview story
            </button>
          </div>
        </section>
      </main>
    </LedgerRoot>
  )
}

export function LedgerReader({ actions, story }: DesignLabDirectionProps) {
  const paragraphs = story.body.split(/\n\n+/).filter(Boolean)
  const minutes = Math.max(1, Math.ceil(wordCount(story) / 220))
  const dateLine =
    story.status === 'scheduled'
      ? 'Sunday 08:00'
      : story.status === 'published'
        ? 'Published'
        : 'saved just now'

  return (
    <LedgerRoot className={styles.reader!} view="reader">
      <header className={styles.readerOwnerBar}>
        <button
          className={styles.quietAction}
          onClick={() => actions.setView('write')}
          style={touchTarget}
          type="button"
        >
          ← Back to writing
        </button>
        <Lifecycle story={story} />
        <button
          className={styles.primaryAction}
          data-testid="ledger-reader-publication-action"
          onClick={actions.openPublication}
          style={touchTarget}
          type="button"
        >
          Review publication
        </button>
      </header>
      <article className={styles.readerStory} data-testid="ledger-reader-story">
        <header className={styles.readerOpening}>
          <div aria-label="Story index" className={styles.storyIndex}>
            <UtilityText>{story.section}</UtilityText>
            <UtilityText>{dateLine}</UtilityText>
            <UtilityText>{minutes} min read</UtilityText>
          </div>
          <h1>{story.title}</h1>
          <p className={styles.readerDek}>{story.dek}</p>
        </header>
        <figure className={styles.readerFigure}>
          <StoryImage className={styles.readerImage!} story={story} />
          {story.imageCaption ? <figcaption>Fig. 1 — {story.imageCaption}</figcaption> : null}
        </figure>
        <div className={styles.readerCopy}>
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </article>
    </LedgerRoot>
  )
}

export const ledgerDirection = defineDesignLabDirection({
  id: 'ledger',
  metadata: {
    character: 'Neutral field, graphite ink, visible rules, and functional state signals.',
    collection: 'Round 6 · Client set',
    name: 'Ledger',
    order: 'N8',
    ownerFit: 'The most systematic option for an owner who finds confidence in clear order.',
    risk: 'Its information density must feel helpful rather than bureaucratic.',
    signature: 'A visible twelve-column form carries the story from record to publication.',
    thesis: 'The magazine as a beautifully designed form.',
  },
  views: { desk: LedgerDesk, reader: LedgerReader, write: LedgerWrite },
})
