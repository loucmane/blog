import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'

import { defineDesignLabDirection } from '../contract'
import type { DesignLabDirectionProps, DesignLabStory } from '../types'
import { BodyEditor, EditorFields, StoryCopy, StoryImage, wordCount } from '../view-helpers'
import {
  deriveFullbleedGrade,
  fullbleedFallbackGrade,
  isSameOriginImageSource,
  type FullbleedGrade,
  type FullbleedRgb,
} from './fullbleed-grade'
import styles from './fullbleed.module.css'

const touchTarget: CSSProperties = { minHeight: 44, minWidth: 44 }
const minimumText: CSSProperties = { fontSize: 11 }

type GradeProperties = CSSProperties & {
  '--fullbleed-primary': string
  '--fullbleed-readable': string
  '--fullbleed-scrim': string
  '--fullbleed-secondary': string
}

function gradeProperties(grade: FullbleedGrade): GradeProperties {
  return {
    '--fullbleed-primary': grade.primary,
    '--fullbleed-readable': grade.source === 'fallback' ? grade.secondary : grade.primary,
    '--fullbleed-scrim': grade.scrim,
    '--fullbleed-secondary': grade.secondary,
  }
}

function sampleSameOriginImage(source: string): Promise<readonly FullbleedRgb[]> {
  if (typeof window === 'undefined' || !isSameOriginImageSource(source, window.location.origin)) {
    return Promise.resolve([])
  }

  return new Promise((resolve) => {
    const image = new window.Image()
    image.crossOrigin = 'anonymous'
    image.decoding = 'async'
    image.onerror = () => resolve([])
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 12
        canvas.height = 12
        const context = canvas.getContext('2d', { willReadFrequently: true })
        if (!context) {
          resolve([])
          return
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
        const samples: FullbleedRgb[] = []
        for (let index = 0; index < pixels.length; index += 4) {
          if ((pixels[index + 3] ?? 0) < 192) continue
          samples.push({
            blue: pixels[index + 2] ?? 0,
            green: pixels[index + 1] ?? 0,
            red: pixels[index] ?? 0,
          })
        }
        resolve(samples)
      } catch {
        resolve([])
      }
    }
    image.src = new URL(source, window.location.origin).href
  })
}

function useAmbientGrade(source: string): FullbleedGrade {
  const [grade, setGrade] = useState<FullbleedGrade>(fullbleedFallbackGrade)

  useEffect(() => {
    let active = true
    setGrade(fullbleedFallbackGrade)
    void sampleSameOriginImage(source).then((samples) => {
      if (active) setGrade(deriveFullbleedGrade(samples))
    })
    return () => {
      active = false
    }
  }, [source])

  return grade
}

function lifecycle(story: DesignLabStory): { readonly copy: string; readonly state: string } {
  if (story.status === 'published') return { copy: 'Published 3 August', state: 'published' }
  if (story.status === 'scheduled') {
    return { copy: 'Scheduled for Sunday 08:00', state: 'scheduled' }
  }
  return { copy: 'Draft, saved just now', state: 'draft' }
}

function GradeState({ story }: { readonly story: DesignLabStory }) {
  const state = lifecycle(story)
  return (
    <div className={styles.gradeState}>
      <div
        aria-hidden="true"
        className={styles.gradeBar}
        data-state={state.state}
        data-testid="fullbleed-grade-bar"
      >
        <span />
      </div>
      <p
        className={styles.lifecycleCopy}
        data-testid="fullbleed-lifecycle-state"
        data-ui-text="true"
        style={minimumText}
      >
        {state.copy}
      </p>
    </div>
  )
}

function Filmstrip({ actions, story }: DesignLabDirectionProps) {
  const [activeFrame, setActiveFrame] = useState(0)
  const framesRef = useRef<Array<HTMLButtonElement | null>>([])
  const labels = ['Lead story', 'Light study', 'Room detail'] as const

  function move(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const keyTargets: Record<string, number> = {
      ArrowLeft: (index - 1 + labels.length) % labels.length,
      ArrowRight: (index + 1) % labels.length,
      End: labels.length - 1,
      Home: 0,
    }
    const next = keyTargets[event.key]
    if (next === undefined) return
    event.preventDefault()
    setActiveFrame(next)
    framesRef.current[next]?.focus()
  }

  return (
    <div aria-label="Issue filmstrip" className={styles.filmstrip}>
      {labels.map((label, index) => (
        <button
          aria-label={`Story frame ${index + 1}: ${label}`}
          className={styles.filmstripFrame}
          key={label}
          onClick={() => actions.setView('write')}
          onFocus={() => setActiveFrame(index)}
          onKeyDown={(event) => move(event, index)}
          ref={(element) => {
            framesRef.current[index] = element
          }}
          style={touchTarget}
          tabIndex={activeFrame === index ? 0 : -1}
          type="button"
        >
          <StoryImage className={styles.filmstripImage!} story={story} />
          <span data-ui-text="true" style={minimumText}>
            {String(index + 1).padStart(2, '0')}
          </span>
        </button>
      ))}
    </div>
  )
}

function FullbleedRoot({
  children,
  className,
  story,
}: {
  readonly children: React.ReactNode
  readonly className: string
  readonly story: DesignLabStory
}) {
  const grade = useAmbientGrade(story.image)
  return (
    <section
      className={`${styles.root} ${className}`}
      data-grade-source={grade.source}
      style={gradeProperties(grade)}
    >
      {children}
    </section>
  )
}

export function FullbleedDesk(props: DesignLabDirectionProps) {
  const { actions, story } = props
  return (
    <FullbleedRoot className={styles.desk!} story={story}>
      <StoryImage className={styles.deskImage!} story={story} />
      <div className={styles.overlayScrim} data-testid="fullbleed-overlay-scrim" />
      <header className={styles.chrome} data-ui-text="true" style={minimumText}>
        <strong>NH / NORTH HOUSE</strong>
        <span>Issue 07 · Image room</span>
        <span>{wordCount(story)} words</span>
      </header>
      <main className={styles.deskStage}>
        <div className={styles.lowerThird}>
          <p className={styles.eyebrow} data-ui-text="true" style={minimumText}>
            {story.section} · Lead story
          </p>
          <h1>{story.title}</h1>
          <p className={styles.dek}>{story.dek}</p>
          <div className={styles.deskActions}>
            <button
              className={styles.primaryAction}
              onClick={actions.createStory}
              style={touchTarget}
              type="button"
            >
              Begin a story <span aria-hidden="true">+</span>
            </button>
            <button
              className={styles.textAction}
              onClick={() => actions.setView('write')}
              style={touchTarget}
              type="button"
            >
              Continue writing ↗
            </button>
          </div>
          <GradeState story={story} />
        </div>
        <Filmstrip {...props} />
      </main>
    </FullbleedRoot>
  )
}

export function FullbleedWrite(props: DesignLabDirectionProps) {
  const { actions, story } = props
  return (
    <FullbleedRoot className={styles.write!} story={story}>
      <header className={styles.editorHeader}>
        <button
          className={styles.textAction}
          onClick={() => actions.setView('desk')}
          style={touchTarget}
          type="button"
        >
          ← Desk
        </button>
        <div>
          <span className={styles.eyebrow}>North House / {story.section}</span>
          <strong>{story.title}</strong>
        </div>
        <button
          className={styles.primaryAction}
          onClick={actions.openPublication}
          style={touchTarget}
          type="button"
        >
          Review publication
        </button>
      </header>
      <GradeState story={story} />
      <main className={styles.editorStage}>
        <figure className={styles.imagePanel}>
          <StoryImage className={styles.editorImage!} story={story} />
          <div className={styles.imageScrim} data-testid="fullbleed-overlay-scrim" />
          <figcaption>
            <span>{story.imageCaption ?? 'Lead image · add a caption'}</span>
            <span>{story.imageCredit ?? 'Credit not yet added'}</span>
          </figcaption>
          <div aria-label="Lead image actions" className={styles.mediaActions}>
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
        </figure>
        <article className={styles.editorGlass}>
          <div className={styles.editorMeta}>
            <span>Revision {String(story.server?.revisionNumber ?? 1).padStart(2, '0')}</span>
            <span>{story.saved}</span>
          </div>
          <EditorFields {...props} />
          <BodyEditor {...props} />
        </article>
      </main>
    </FullbleedRoot>
  )
}

export function FullbleedReader({ actions, story }: DesignLabDirectionProps) {
  return (
    <FullbleedRoot className={styles.reader!} story={story}>
      <header className={styles.readerChrome}>
        <strong>North House</strong>
        <span>Design · 7 min read</span>
      </header>
      <GradeState story={story} />
      <article>
        <header className={styles.readerOpener}>
          <StoryImage className={styles.readerHero!} story={story} />
          <div className={styles.overlayScrim} data-testid="fullbleed-overlay-scrim" />
          <div className={styles.readerTitle}>
            <p className={styles.eyebrow}>{story.section} · North House 07</p>
            <h1>{story.title}</h1>
            <p>{story.dek}</p>
          </div>
        </header>
        <div className={styles.readerBody}>
          <StoryCopy className={styles.readerCopy!} story={story} />
          <figure className={styles.inlineFigure}>
            <StoryImage className={styles.inlineImage!} story={story} />
            <figcaption>
              <span>{story.imageCaption ?? 'Winter light settles across the room.'}</span>
              <span>{story.imageCredit ?? 'North House archive'}</span>
            </figcaption>
          </figure>
        </div>
      </article>
      <button
        className={styles.backAction}
        onClick={() => actions.setView('write')}
        style={touchTarget}
        type="button"
      >
        ← Back to owner studio
      </button>
    </FullbleedRoot>
  )
}

export const fullbleedDirection = defineDesignLabDirection({
  id: 'fullbleed',
  metadata: {
    character: 'Photography-first, high-chroma, asymmetric, and screen-native.',
    collection: 'Round 5 · New concepts',
    name: 'Fullbleed',
    order: 'N3',
    ownerFit: 'Best when the lead photograph should set the working room’s color.',
    risk: 'Image-derived color must never weaken contrast or escape deterministic fallback.',
    signature: 'The ambient grade tints chrome, links, and lifecycle from the lead photograph.',
    thesis: 'The photograph is the interface.',
  },
  views: { desk: FullbleedDesk, reader: FullbleedReader, write: FullbleedWrite },
})
