import { Archivo, IBM_Plex_Mono, Public_Sans } from 'next/font/google'
import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from 'react'

import { defineDesignLabDirection } from '../contract'
import type { DesignLabDirectionProps, DesignLabStory, DesignLabView } from '../types'
import { BodyEditor, EditorFields, StoryImage, wordCount } from '../view-helpers'
import styles from './meridian.module.css'

const meridianDisplay = Archivo({
  axes: ['wdth'],
  display: 'swap',
  fallback: ['Arial Black', 'Helvetica Neue', 'Arial'],
  subsets: ['latin'],
  variable: '--font-meridian-display',
  weight: 'variable',
})

const meridianText = Public_Sans({
  display: 'swap',
  fallback: ['Helvetica Neue', 'Arial'],
  subsets: ['latin'],
  variable: '--font-meridian-text',
  weight: ['400', '600', '700'],
})

const meridianData = IBM_Plex_Mono({
  display: 'swap',
  fallback: ['Courier New', 'monospace'],
  subsets: ['latin'],
  variable: '--font-meridian-data',
  weight: ['500', '600'],
})

export const meridianPalette = Object.freeze({
  field: '#33172B',
  pearl: '#F2ECF0',
  recessed: '#220E1D',
  seam: '#4A2B40',
  sky: '#7FB8E6',
  tangerine: '#F27B35',
})

const meridianVariables = {
  '--meridian-field': meridianPalette.field,
  '--meridian-pearl': meridianPalette.pearl,
  '--meridian-recessed': meridianPalette.recessed,
  '--meridian-seam': meridianPalette.seam,
  '--meridian-sky': meridianPalette.sky,
  '--meridian-tangerine': meridianPalette.tangerine,
} as CSSProperties

const touchTarget: CSSProperties = { minHeight: 44, minWidth: 44 }
const minimumText: CSSProperties = { fontSize: 11 }

interface MeridianLifecycle {
  readonly chip: 'DRAFT' | 'LIVE' | 'SCHEDULED · SUN 08:00'
  readonly sentence: string
  readonly state: 'draft' | 'published' | 'scheduled'
}

interface MeridianCommand {
  readonly action: () => void
  readonly id: string
  readonly label: string
}

function lifecycleFor(story: DesignLabStory): MeridianLifecycle {
  if (story.status === 'published') {
    return { chip: 'LIVE', sentence: 'Readers can see this story now.', state: 'published' }
  }
  if (story.status === 'scheduled') {
    return {
      chip: 'SCHEDULED · SUN 08:00',
      sentence: 'This story is set for Sunday at 08:00.',
      state: 'scheduled',
    }
  }
  return {
    chip: 'DRAFT',
    sentence: 'Keep writing, then review publication.',
    state: 'draft',
  }
}

function targetAcceptsText(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  return (
    ['INPUT', 'SELECT', 'TEXTAREA'].includes(target.tagName) ||
    target.isContentEditable ||
    Boolean(target.closest('[contenteditable="true"]'))
  )
}

function MeridianRoot({
  children,
  className,
  view,
}: {
  readonly children: ReactNode
  readonly className: string
  readonly view: DesignLabView
}) {
  return (
    <section
      className={`${styles.root} ${className} ${meridianDisplay.variable} ${meridianText.variable} ${meridianData.variable}`}
      data-view={view}
      style={meridianVariables}
    >
      {children}
    </section>
  )
}

function UtilityText({ children }: { readonly children: ReactNode }) {
  return (
    <span className={styles.utilityText} data-ui-text="true" style={minimumText}>
      {children}
    </span>
  )
}

function LifecycleSignal({ story }: { readonly story: DesignLabStory }) {
  const lifecycle = lifecycleFor(story)

  return (
    <div
      aria-label={`${lifecycle.chip}. ${lifecycle.sentence}`}
      aria-live="polite"
      className={styles.lifecycleSignal}
      data-state={lifecycle.state}
      data-testid="meridian-lifecycle-state"
      role="status"
    >
      <strong data-testid="meridian-lifecycle-chip">{lifecycle.chip}</strong>
      <p data-testid="meridian-lifecycle-sentence">{lifecycle.sentence}</p>
    </div>
  )
}

function InstrumentRow({ label, value }: { readonly label: string; readonly value: ReactNode }) {
  return (
    <div className={styles.instrumentRow}>
      <dt>
        <UtilityText>{label}</UtilityText>
      </dt>
      <dd>{value}</dd>
    </div>
  )
}

function InstrumentRail({ story }: { readonly story: DesignLabStory }) {
  const words = wordCount(story)

  return (
    <aside aria-label="Active story instrument" className={styles.instrumentRail}>
      <header className={styles.railHeader}>
        <UtilityText>Meridian / active story</UtilityText>
        <span aria-hidden="true" className={styles.coordinateMark}>
          M—09
        </span>
      </header>
      <LifecycleSignal story={story} />
      <dl className={styles.instrumentRows}>
        <InstrumentRow label="Saved" value={story.saved} />
        <InstrumentRow label="Section" value={story.section} />
        <InstrumentRow label="Length" value={`${words} ${words === 1 ? 'word' : 'words'}`} />
        <InstrumentRow label="Photography" value={story.imageAlt.trim() || 'No description yet'} />
      </dl>
    </aside>
  )
}

function CommandBar({ commands }: { readonly commands: readonly MeridianCommand[] }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && open) {
        event.preventDefault()
        setOpen(false)
        triggerRef.current?.focus()
        return
      }
      if (
        event.key.toLowerCase() === 'k' &&
        (event.metaKey || event.ctrlKey) &&
        !targetAcceptsText(event.target)
      ) {
        event.preventDefault()
        setQuery('')
        setOpen((current) => !current)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  const normalizedQuery = query.trim().toLocaleLowerCase()
  const visibleCommands = normalizedQuery
    ? commands.filter(({ label }) => label.toLocaleLowerCase().includes(normalizedQuery))
    : commands

  function run(command: MeridianCommand) {
    command.action()
    setOpen(false)
    triggerRef.current?.focus()
  }

  return (
    <div
      className={styles.commandDock}
      data-motion="bar-rise-120"
      data-testid="meridian-command-bar"
    >
      <button
        aria-controls="meridian-command-panel"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Command bar"
        className={styles.commandTrigger}
        onClick={() => {
          setQuery('')
          setOpen((current) => !current)
        }}
        ref={triggerRef}
        style={touchTarget}
        type="button"
      >
        <span>Command bar</span>
        <kbd aria-hidden="true">⌘K</kbd>
      </button>
      {open ? (
        <div
          aria-labelledby={titleId}
          aria-modal="false"
          className={styles.commandPanel}
          id="meridian-command-panel"
          role="dialog"
        >
          <header className={styles.commandHeader}>
            <div>
              <UtilityText>Visible controls</UtilityText>
              <h2 id={titleId}>Meridian commands</h2>
            </div>
            <button
              aria-label="Close command bar"
              className={styles.commandClose}
              onClick={() => {
                setOpen(false)
                triggerRef.current?.focus()
              }}
              style={touchTarget}
              type="button"
            >
              ×
            </button>
          </header>
          <label className={styles.commandSearch}>
            <span className="sr-only">Find a command</span>
            <input
              aria-label="Find a command"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Type a visible action"
              ref={inputRef}
              value={query}
            />
          </label>
          <ul className={styles.commandList}>
            {visibleCommands.map((command) => (
              <li key={command.id}>
                <button
                  className={styles.commandItem}
                  onClick={() => run(command)}
                  style={touchTarget}
                  type="button"
                >
                  <span>{command.label}</span>
                  <span aria-hidden="true">↗</span>
                </button>
              </li>
            ))}
          </ul>
          <p aria-live="polite" className={styles.commandCount} role="status">
            {visibleCommands.length === 0
              ? 'No visible action matches.'
              : `${visibleCommands.length} visible ${visibleCommands.length === 1 ? 'action' : 'actions'}.`}
          </p>
        </div>
      ) : null}
    </div>
  )
}

function EditorialFigure({ story }: { readonly story: DesignLabStory }) {
  const hasNotes = Boolean(story.imageCaption || story.imageCredit)

  return (
    <figure className={styles.editorialFigure}>
      <StoryImage className={styles.storyImage!} story={story} />
      {hasNotes ? (
        <figcaption>
          {story.imageCaption ? <span>{story.imageCaption}</span> : null}
          {story.imageCredit ? <cite>{story.imageCredit}</cite> : null}
        </figcaption>
      ) : null}
    </figure>
  )
}

function StoryOutline({ story }: { readonly story: DesignLabStory }) {
  const paragraphs = story.body.split(/\n\n+/).filter(Boolean)

  return (
    <section className={styles.outlinePanel}>
      <header>
        <UtilityText>Meta / outline</UtilityText>
        <h2>Story outline</h2>
      </header>
      <dl className={styles.outlineMeta}>
        <InstrumentRow label="Section" value={story.section} />
        <InstrumentRow label="Words" value={wordCount(story)} />
      </dl>
      <ol aria-label="Story outline" className={styles.outlineList}>
        <li>
          <UtilityText>Headline</UtilityText>
          <p>{story.title}</p>
        </li>
        <li>
          <UtilityText>Summary</UtilityText>
          <p>{story.dek}</p>
        </li>
        {paragraphs.map((paragraph, index) => (
          <li key={paragraph}>
            <UtilityText>Body {String(index + 1).padStart(2, '0')}</UtilityText>
            <p>{paragraph}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}

export function MeridianDesk({ actions, story }: DesignLabDirectionProps) {
  const commands: readonly MeridianCommand[] = [
    { action: actions.createStory, id: 'create-story', label: 'Start a new post' },
    { action: () => actions.setView('write'), id: 'open-story', label: 'Open story' },
    { action: () => actions.setView('reader'), id: 'preview-story', label: 'Preview story' },
  ]

  return (
    <MeridianRoot className={styles.desk!} view="desk">
      <header className={styles.topBar}>
        <UtilityText>Meridian / story desk</UtilityText>
        <UtilityText>{story.saved}</UtilityText>
      </header>
      <main className={styles.dockedLayout}>
        <InstrumentRail story={story} />
        <section className={styles.focusPanel} data-motion="panel-160">
          <header className={styles.focusHeader}>
            <div>
              <UtilityText>Focused story / {story.section}</UtilityText>
              <h1>{story.title}</h1>
            </div>
            <p>{story.dek}</p>
          </header>
          <EditorialFigure story={story} />
          <footer className={styles.focusActions}>
            <button
              className={styles.primaryAction}
              onClick={actions.createStory}
              style={touchTarget}
              type="button"
            >
              Start a new post
            </button>
            <button
              className={styles.secondaryAction}
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
          </footer>
        </section>
      </main>
      <CommandBar commands={commands} />
    </MeridianRoot>
  )
}

export function MeridianWrite(props: DesignLabDirectionProps) {
  const { actions, story } = props
  const mediaAction = story.mediaId ? 'Replace cover photo' : 'Add cover photo'
  const commands: readonly MeridianCommand[] = [
    { action: () => actions.setView('desk'), id: 'story-desk', label: 'Story desk' },
    { action: () => actions.setView('reader'), id: 'preview-story', label: 'Preview story' },
    { action: actions.openUpload, id: 'cover-photo', label: mediaAction },
    { action: actions.openPublication, id: 'publication', label: 'Review publication' },
  ]

  return (
    <MeridianRoot className={styles.write!} view="write">
      <header className={styles.writeBar}>
        <button
          className={styles.quietAction}
          onClick={() => actions.setView('desk')}
          style={touchTarget}
          type="button"
        >
          ← Story desk
        </button>
        <div className={styles.writeIdentity}>
          <UtilityText>Meridian / write</UtilityText>
          <span>{story.saved}</span>
        </div>
        <div className={styles.writeActions}>
          <button
            className={styles.secondaryAction}
            onClick={() => actions.setView('reader')}
            style={touchTarget}
            type="button"
          >
            Preview story
          </button>
          <button
            className={styles.primaryAction}
            data-testid="meridian-publication-action"
            onClick={actions.openPublication}
            style={touchTarget}
            type="button"
          >
            Review publication
          </button>
        </div>
      </header>
      <main className={styles.dockedLayout}>
        <InstrumentRail story={story} />
        <section className={styles.writeWorkspace} data-motion="panel-160">
          <article className={styles.editorPane}>
            <header className={styles.paneHeader}>
              <UtilityText>Shared editor</UtilityText>
              <h1>{story.title}</h1>
            </header>
            <div className={styles.editorFields}>
              <EditorFields {...props} />
              <BodyEditor {...props} />
            </div>
          </article>
          <aside className={styles.metaPane}>
            <StoryOutline story={story} />
            <section className={styles.photoPanel}>
              <header>
                <UtilityText>Photography</UtilityText>
                <h2>Cover image</h2>
              </header>
              <EditorialFigure story={story} />
              <p>{story.imageAlt}</p>
              <button
                className={styles.secondaryAction}
                onClick={actions.openUpload}
                style={touchTarget}
                type="button"
              >
                {mediaAction}
              </button>
            </section>
          </aside>
        </section>
      </main>
      <CommandBar commands={commands} />
    </MeridianRoot>
  )
}

export function MeridianReader({ actions, story }: DesignLabDirectionProps) {
  const paragraphs = story.body.split(/\n\n+/).filter(Boolean)
  const commands: readonly MeridianCommand[] = [
    { action: () => actions.setView('write'), id: 'back-to-writing', label: 'Back to writing' },
    { action: actions.openPublication, id: 'publication', label: 'Review publication' },
  ]

  return (
    <MeridianRoot className={styles.reader!} view="reader">
      <header className={styles.readerOwnerBar}>
        <button
          className={styles.quietAction}
          onClick={() => actions.setView('write')}
          style={touchTarget}
          type="button"
        >
          ← Back to writing
        </button>
        <LifecycleSignal story={story} />
        <button
          className={styles.primaryAction}
          data-testid="meridian-reader-publication-action"
          onClick={actions.openPublication}
          style={touchTarget}
          type="button"
        >
          Review publication
        </button>
      </header>
      <article className={styles.readerStory} data-testid="meridian-reader-story">
        <header className={styles.readerOpening}>
          <UtilityText>{story.section}</UtilityText>
          <h1>{story.title}</h1>
          <p>{story.dek}</p>
        </header>
        <EditorialFigure story={story} />
        <div className={styles.readerCopy}>
          {paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </article>
      <CommandBar commands={commands} />
    </MeridianRoot>
  )
}

export const meridianDirection = defineDesignLabDirection({
  id: 'meridian',
  metadata: {
    character: 'Damson, pearl, tangerine, sky, and precise matte instrument seams.',
    collection: 'Round 6 · Client set',
    name: 'Meridian',
    order: 'N9',
    ownerFit: 'The fastest option for an owner who already feels at home in modern tools.',
    risk: 'Its nocturnal software language must stay plain and calm rather than technical.',
    signature: 'A docked story instrument and parity-safe command bar keep every move in reach.',
    thesis: 'The magazine as a native publishing instrument.',
  },
  views: { desk: MeridianDesk, reader: MeridianReader, write: MeridianWrite },
})
