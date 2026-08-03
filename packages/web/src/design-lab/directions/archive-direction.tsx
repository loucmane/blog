import type { CSSProperties } from 'react'

import {
  BodyEditor,
  EditorFields,
  ReadinessList,
  ReaderState,
  revisionLabel,
  SaveState,
  statusLabel,
  StoryCopy,
  StoryImage,
  wordCount,
} from '../view-helpers'
import type { DesignLabDirectionProps } from '../types'

export type ArchiveLayout = 'image' | 'press' | 'proof' | 'studio' | 'system'

export interface ArchiveDirectionConfig {
  readonly accent: string
  readonly background: string
  readonly collection: string
  readonly foreground: string
  readonly label: string
  readonly layout: ArchiveLayout
  readonly muted: string
  readonly name: string
  readonly panel: string
  readonly signal: string
}

type ArchiveStyle = CSSProperties &
  Readonly<{
    '--archive-accent': string
    '--archive-bg': string
    '--archive-fg': string
    '--archive-muted': string
    '--archive-panel': string
    '--archive-signal': string
  }>

function theme(config: ArchiveDirectionConfig): ArchiveStyle {
  return {
    '--archive-accent': config.accent,
    '--archive-bg': config.background,
    '--archive-fg': config.foreground,
    '--archive-muted': config.muted,
    '--archive-panel': config.panel,
    '--archive-signal': config.signal,
  }
}

function ArchiveHeader({
  actions,
  config,
  story,
  view,
}: DesignLabDirectionProps & {
  readonly config: ArchiveDirectionConfig
  readonly view: 'desk' | 'reader' | 'write'
}) {
  return (
    <header className="archive-header">
      <button className="archive-wordmark" onClick={() => actions.setView('desk')} type="button">
        <b>North House</b>
        <span>{config.name}</span>
      </button>
      <nav aria-label={`${config.name} workspace`}>
        <button
          aria-current={view === 'desk' ? 'page' : undefined}
          onClick={() => actions.setView('desk')}
          type="button"
        >
          Desk
        </button>
        <button
          aria-current={view === 'write' ? 'page' : undefined}
          onClick={() => actions.setView('write')}
          type="button"
        >
          Write
        </button>
        <button
          aria-current={view === 'reader' ? 'page' : undefined}
          onClick={() => actions.setView('reader')}
          type="button"
        >
          Reader
        </button>
      </nav>
      <div className="archive-header-state">
        <SaveState story={story} />
        <span>{statusLabel(story)}</span>
      </div>
    </header>
  )
}

function DeskFeature({
  config,
  story,
}: { config: ArchiveDirectionConfig } & DesignLabDirectionProps) {
  if (config.layout === 'image') {
    return (
      <article className="archive-desk-feature archive-image-feature">
        <StoryImage className="archive-hero-image" story={story} />
        <div className="archive-image-caption">
          <span>{config.label}</span>
          <strong>{story.title}</strong>
          <small>{story.imageCaption ?? 'Lead image awaiting final art direction'}</small>
        </div>
        <div className="archive-contact-strip" aria-label="Issue image sequence">
          <i />
          <i />
          <i />
          <i />
        </div>
      </article>
    )
  }

  if (config.layout === 'system') {
    return (
      <article className="archive-desk-feature archive-system-feature">
        <header>
          <span>Current edition</span>
          <b>{statusLabel(story)}</b>
        </header>
        <div className="archive-system-row active">
          <i>01</i>
          <strong>{story.title}</strong>
          <span>{story.section}</span>
          <time>{story.saved}</time>
        </div>
        <div className="archive-system-row">
          <i>02</i>
          <strong>A table set for twelve</strong>
          <span>Living</span>
          <time>Sunday</time>
        </div>
        <div className="archive-system-row">
          <i>03</i>
          <strong>Notes from the Baltic edge</strong>
          <span>Travel</span>
          <time>Friday</time>
        </div>
      </article>
    )
  }

  if (config.layout === 'press') {
    return (
      <article className="archive-desk-feature archive-press-feature">
        <div>
          <span>Lead story / {story.section}</span>
          <h2>{story.title}</h2>
          <p>{story.dek}</p>
        </div>
        <StoryImage className="archive-press-image" story={story} />
        <footer>
          <b>{statusLabel(story)}</b>
          <span>{wordCount(story)} words</span>
          <span>Revision {revisionLabel(story)}</span>
        </footer>
      </article>
    )
  }

  return (
    <article className="archive-desk-feature archive-paper-feature">
      <div className="archive-paper-edge">{config.label}</div>
      <div className="archive-paper-copy">
        <span>
          {story.section} · Revision {revisionLabel(story)}
        </span>
        <h2>{story.title}</h2>
        <p>{story.dek}</p>
        <footer>
          <b>{statusLabel(story)}</b>
          <small>{story.saved}</small>
        </footer>
      </div>
      <StoryImage className="archive-paper-image" story={story} />
    </article>
  )
}

function ArchiveDesk({
  config,
  ...props
}: DesignLabDirectionProps & { readonly config: ArchiveDirectionConfig }) {
  const { actions, story } = props
  return (
    <section
      className="design-lab-archive"
      data-archive-layout={config.layout}
      data-design-direction={config.name}
      style={theme(config)}
    >
      <ArchiveHeader {...props} actions={actions} config={config} story={story} view="desk" />
      <div className="archive-desk-grid">
        <section className="archive-desk-intro">
          <p>{config.collection}</p>
          <h1>
            Shape the
            <br />
            <em>next edition.</em>
          </h1>
          <span>
            One protected story, interpreted through the original {config.name} direction.
          </span>
          <button onClick={actions.createStory} type="button">
            Begin a story <b>+</b>
          </button>
        </section>
        <DeskFeature {...props} config={config} />
        <aside className="archive-desk-status">
          <span>Release signal</span>
          <strong>{config.signal}</strong>
          <p>{story.saved}</p>
          <dl>
            <div>
              <dt>State</dt>
              <dd>{statusLabel(story)}</dd>
            </div>
            <div>
              <dt>Words</dt>
              <dd>{wordCount(story)}</dd>
            </div>
            <div>
              <dt>Revision</dt>
              <dd>{revisionLabel(story)}</dd>
            </div>
          </dl>
          <button onClick={() => actions.setView('write')} type="button">
            Continue writing ↗
          </button>
        </aside>
      </div>
    </section>
  )
}

function ArchiveWrite({
  config,
  ...props
}: DesignLabDirectionProps & { readonly config: ArchiveDirectionConfig }) {
  const { actions, story } = props
  return (
    <section
      className="design-lab-archive"
      data-archive-layout={config.layout}
      data-design-direction={config.name}
      style={theme(config)}
    >
      <ArchiveHeader {...props} actions={actions} config={config} story={story} view="write" />
      <div className="archive-editor-grid">
        <aside className="archive-structure">
          <span>{config.label}</span>
          <h2>Story structure</h2>
          <ol>
            <li className="active">Headline</li>
            <li>Opening</li>
            <li>Rooms facing north</li>
            <li>The blue hour</li>
            <li>Sources</li>
          </ol>
          <div>
            <small>Revision</small>
            <strong>{revisionLabel(story)}</strong>
            <span>Every saved version is recoverable.</span>
          </div>
        </aside>
        <article className="archive-editor-paper">
          <div className="archive-editor-kicker">
            <span>{story.section}</span>
            <SaveState story={story} />
          </div>
          <EditorFields {...props} />
          <StoryImage className="archive-editor-image" story={story} />
          <div className="archive-media-row">
            <span>{story.imageCaption ?? 'Lead image · add editorial context'}</span>
            <button onClick={actions.openUpload} type="button">
              {story.mediaId ? 'Replace image' : 'Add image'}
            </button>
          </div>
          <div className="archive-toolbar" aria-label="Formatting" role="toolbar">
            <span>Text</span>
            <b>B</b>
            <i>I</i>
            <span>Quote</span>
            <span>List</span>
            <button onClick={actions.openUpload} type="button">
              + Media
            </button>
          </div>
          <BodyEditor {...props} />
        </article>
        <aside className="archive-publication">
          <span>Publication check</span>
          <h2>One calm review before release.</h2>
          <p>The same protected revision follows every design direction.</p>
          <ReadinessList story={story} />
          <button onClick={() => actions.setView('reader')} type="button">
            Private preview
          </button>
          <button className="primary" onClick={actions.openPublication} type="button">
            Review publication
          </button>
        </aside>
      </div>
    </section>
  )
}

function ArchiveReader({
  config,
  ...props
}: DesignLabDirectionProps & { readonly config: ArchiveDirectionConfig }) {
  const { actions, story } = props
  return (
    <section
      className="design-lab-archive archive-reader"
      data-archive-layout={config.layout}
      data-design-direction={config.name}
      style={theme(config)}
    >
      <ArchiveHeader {...props} actions={actions} config={config} story={story} view="reader" />
      <ReaderState story={story} />
      <article className="archive-reader-story">
        <header>
          <span>
            {story.section} · {config.name}
          </span>
          <h1>{story.title}</h1>
          <p>{story.dek}</p>
        </header>
        <StoryImage className="archive-reader-image" story={story} />
        <div className="archive-reader-meta">
          <span>Words · {wordCount(story)}</span>
          <span>Revision · {revisionLabel(story)}</span>
          <span>{story.imageCredit ?? 'North House archive'}</span>
        </div>
        <StoryCopy className="design-lab-reader-copy" story={story} />
      </article>
      <button
        className="design-lab-floating-action"
        onClick={() => actions.setView('write')}
        type="button"
      >
        ← Back to owner studio
      </button>
    </section>
  )
}

export function createArchiveDirectionViews(config: ArchiveDirectionConfig) {
  return {
    Desk(props: DesignLabDirectionProps) {
      return <ArchiveDesk {...props} config={config} />
    },
    Reader(props: DesignLabDirectionProps) {
      return <ArchiveReader {...props} config={config} />
    },
    Write(props: DesignLabDirectionProps) {
      return <ArchiveWrite {...props} config={config} />
    },
  }
}
