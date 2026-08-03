'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { designLabRegistry } from '@/design-lab/registry'
import { OwnerApiClient, OwnerApiError } from '@/design-lab/owner-api-client'
import { createDesignLabStory } from '@/design-lab/seed'
import {
  actionIntoStory,
  mutationIntoStory,
  storyToDocument,
  workspaceIntoStory,
} from '@/design-lab/story-document'
import type {
  DesignLabActions,
  DesignLabDirection,
  DesignLabStory,
  DesignLabView,
  EditableStoryField,
  StoryActionDto,
} from '@/design-lab/types'

const saveDelay = 650
const ownerTimeZone = 'Europe/Stockholm'
const directionGroups = Array.from(
  designLabRegistry.list().reduce((groups, direction) => {
    const collection = groups.get(direction.metadata.collection) ?? []
    collection.push(direction)
    groups.set(direction.metadata.collection, collection)
    return groups
  }, new Map<string, DesignLabDirection[]>()),
)

function tomorrowAtEight(): string {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return `${local.toISOString().slice(0, 10)}T08:00`
}

function ownerMessage(error: unknown): string {
  if (error instanceof OwnerApiError) return error.message
  return 'The protected workspace could not be reached. Your visible edits remain on this page.'
}

function publicationReady(story: DesignLabStory): boolean {
  return (
    story.title.trim().length >= 4 &&
    story.dek.trim().length >= 12 &&
    story.body.trim().length >= 20 &&
    Boolean(story.imageAlt.trim()) &&
    Boolean(story.server)
  )
}

function rememberStory(articleId: string): void {
  const location = new URL(window.location.href)
  location.searchParams.set('story', articleId)
  window.history.replaceState(null, '', `${location.pathname}${location.search}${location.hash}`)
}

interface DesignLabDialogProps {
  readonly children: React.ReactNode
  readonly close: () => void
  readonly label: string
}

function DesignLabDialog({ children, close, label }: DesignLabDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    const previouslyFocused = document.activeElement
    dialog?.showModal()
    dialog?.focus()
    return () => {
      dialog?.close()
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus()
    }
  }, [])

  return (
    <dialog
      aria-label={label}
      className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-xl"
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
      ref={dialogRef}
      tabIndex={-1}
    >
      <div className="relative my-8 w-[min(34rem,100%)] rounded-[2rem] bg-[#fbfcfa] p-[clamp(1.5rem,5vw,3rem)] text-slate-950 shadow-[0_50px_160px_rgba(0,0,0,.4)]">
        <button
          aria-label={`Close ${label}`}
          className="absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-slate-200 text-xl"
          onClick={close}
          type="button"
        >
          ×
        </button>
        {children}
      </div>
    </dialog>
  )
}

export function DesignLab() {
  const client = useMemo(() => new OwnerApiClient(), [])
  const [directionId, setDirectionId] = useState(designLabRegistry.first().id)
  const [view, setViewState] = useState<DesignLabView>('desk')
  const [story, setStoryState] = useState(createDesignLabStory)
  const [connection, setConnection] = useState('Connecting to protected workspace…')
  const [busy, setBusy] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [newOpen, setNewOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [publicationOpen, setPublicationOpen] = useState(false)
  const [mediaOpen, setMediaOpen] = useState(false)
  const [scheduleAt, setScheduleAt] = useState(tomorrowAtEight)
  const [unpublishReason, setUnpublishReason] = useState('')
  const [toast, setToast] = useState('')
  const storyRef = useRef(story)
  const generationRef = useRef(0)
  const persistedGenerationRef = useRef(0)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveInFlightRef = useRef<Promise<DesignLabStory | null> | null>(null)

  const commitStory = useCallback((next: DesignLabStory) => {
    storyRef.current = next
    setStoryState(next)
  }, [])

  const showToast = useCallback((message: string) => {
    setToast(message)
    window.setTimeout(() => setToast((current) => (current === message ? '' : current)), 4_200)
  }, [])

  const persistLatest = useCallback(async (): Promise<DesignLabStory | null> => {
    if (saveInFlightRef.current) await saveInFlightRef.current
    const snapshot = storyRef.current
    if (!snapshot.server || persistedGenerationRef.current === generationRef.current)
      return snapshot
    const generation = generationRef.current
    const operation = client
      .saveStory(snapshot.server.id, {
        dek: snapshot.dek,
        document: storyToDocument(snapshot),
        expectedVersion: snapshot.server.version,
        idempotencyKey: crypto.randomUUID(),
        title: snapshot.title,
      })
      .then((result) => {
        persistedGenerationRef.current = generation
        const next = mutationIntoStory(storyRef.current, result)
        commitStory(
          generationRef.current === generation ? next : { ...next, saved: 'Saving newer changes…' },
        )
        return next
      })
      .catch((error: unknown) => {
        const next = {
          ...storyRef.current,
          saved:
            error instanceof OwnerApiError && error.status === 409
              ? 'A newer version needs review'
              : 'Save paused · visible edits remain here',
        }
        commitStory(next)
        showToast(ownerMessage(error))
        return null
      })
      .finally(() => {
        saveInFlightRef.current = null
      })
    saveInFlightRef.current = operation
    const result = await operation
    if (result && persistedGenerationRef.current !== generationRef.current) {
      return persistLatest()
    }
    return result
  }, [client, commitStory, showToast])

  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => void persistLatest(), saveDelay)
  }, [persistLatest])

  useEffect(() => {
    const [hashDirection, hashView] = window.location.hash.slice(1).split('/')
    if (hashDirection && designLabRegistry.has(hashDirection)) setDirectionId(hashDirection)
    if (hashView === 'desk' || hashView === 'write' || hashView === 'reader') setViewState(hashView)
    const requestedStoryId = new URLSearchParams(window.location.search).get('story')
    void client
      .listStories()
      .then(async ({ stories }) => {
        const existing =
          stories.find(({ deletedAt, id }) => deletedAt === null && id === requestedStoryId) ??
          stories.find(({ deletedAt }) => deletedAt === null)
        if (existing) {
          const workspace = await client.loadStory(existing.id)
          const next = workspaceIntoStory(workspace, createDesignLabStory())
          commitStory(next)
          rememberStory(next.server!.id)
        }
        setConnection('Live backend · protected owner workspace')
      })
      .catch((error: unknown) => {
        setConnection('Backend unavailable · local visual preview')
        showToast(ownerMessage(error))
      })
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [client, commitStory, showToast])

  const setView = useCallback(
    (nextView: DesignLabView) => {
      setViewState(nextView)
      const location = new URL(window.location.href)
      location.hash = `${directionId}/${nextView}`
      window.history.replaceState(null, '', location)
      window.scrollTo({ behavior: 'auto', top: 0 })
    },
    [directionId],
  )

  const change = useCallback(
    (field: EditableStoryField, value: string) => {
      generationRef.current += 1
      const current = storyRef.current
      const next = {
        ...current,
        [field]: value,
        saved: current.server
          ? 'Saving to protected workspace…'
          : 'Preview edit · start a draft to save',
      }
      commitStory(next)
      if (current.server) scheduleSave()
    },
    [commitStory, scheduleSave],
  )

  const createStory = useCallback(async () => {
    if (newTitle.trim().length < 1 || busy) return
    setBusy(true)
    const draft: DesignLabStory = {
      ...createDesignLabStory(),
      body: 'Begin with the scene, idea, or detail that made this story matter.',
      dek: '',
      imageAlt: '',
      saved: 'Creating protected draft…',
      title: newTitle.trim(),
    }
    try {
      const result = await client.createStory({
        dek: draft.dek,
        document: storyToDocument(draft),
        idempotencyKey: crypto.randomUUID(),
        title: draft.title,
      })
      const next = mutationIntoStory(draft, result)
      generationRef.current = 0
      persistedGenerationRef.current = 0
      commitStory(next)
      rememberStory(next.server!.id)
      setNewOpen(false)
      setNewTitle('')
      setView('write')
      showToast('Protected draft created. All 14 directions now share this story.')
    } catch (error) {
      showToast(ownerMessage(error))
    } finally {
      setBusy(false)
    }
  }, [busy, client, commitStory, newTitle, setView, showToast])

  const runAction = useCallback(
    async (
      input: (saved: DesignLabStory) => Readonly<Record<string, unknown>>,
      success: string,
      destination: DesignLabView,
    ) => {
      if (busy) return
      setBusy(true)
      try {
        const saved = await persistLatest()
        if (!saved?.server) throw new Error('A protected story is required')
        const result: StoryActionDto = await client.runStoryAction(saved.server.id, {
          expectedVersion: saved.server.version,
          idempotencyKey: crypto.randomUUID(),
          ...input(saved),
        })
        const next = actionIntoStory(saved, result)
        commitStory(next)
        setPublicationOpen(false)
        setView(destination)
        showToast(success)
      } catch (error) {
        showToast(ownerMessage(error))
      } finally {
        setBusy(false)
      }
    },
    [busy, client, commitStory, persistLatest, setView, showToast],
  )

  const preview = useCallback(async () => {
    const saved = await persistLatest()
    if (!saved?.server) {
      showToast('Create a protected draft before opening the reader preview.')
      return
    }
    setPublicationOpen(false)
    setView('reader')
    showToast('Private preview opened from the latest protected revision.')
  }, [persistLatest, setView, showToast])

  const uploadMedia = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!storyRef.current.server || busy) {
        showToast('Create a protected draft before adding media.')
        return
      }
      setBusy(true)
      const form = event.currentTarget
      const formData = new FormData(form)
      formData.set('creditUrl', '')
      formData.set('focalX', '0.5')
      formData.set('focalY', '0.5')
      try {
        const { asset, previewUrl } = await client.uploadMedia(formData)
        generationRef.current += 1
        const next: DesignLabStory = {
          ...storyRef.current,
          focalPoint: { x: asset.focalX, y: asset.focalY },
          image: previewUrl,
          imageAlt: asset.alt,
          imageCaption: asset.caption,
          imageCredit: asset.creditName,
          mediaId: asset.id,
          saved: 'Saving image with protected story…',
        }
        commitStory(next)
        setMediaOpen(false)
        form.reset()
        await persistLatest()
        showToast('Image uploaded, described, and saved with the story.')
      } catch (error) {
        showToast(ownerMessage(error))
      } finally {
        setBusy(false)
      }
    },
    [busy, client, commitStory, persistLatest, showToast],
  )

  const selectDirection = useCallback(
    (id: string) => {
      setDirectionId(id)
      const location = new URL(window.location.href)
      location.hash = `${id}/${view}`
      window.history.replaceState(null, '', location)
    },
    [view],
  )

  const actions = useMemo<DesignLabActions>(
    () => ({
      change,
      createStory: () => setNewOpen(true),
      openPublication: () => {
        setScheduleAt(tomorrowAtEight())
        setPublicationOpen(true)
      },
      openUpload: () => setMediaOpen(true),
      setView,
    }),
    [change, setView],
  )
  const direction = designLabRegistry.get(directionId)
  const DirectionView = direction.views[view]
  const ready = publicationReady(story)

  return (
    <div className="design-lab-root min-h-screen bg-slate-100">
      <a className="sr-only focus:not-sr-only" href="#design-lab-stage">
        Skip to design
      </a>
      <nav className="design-lab-controls" aria-label="Design bakeoff controls">
        <a className="flex items-center gap-3" href="/owner">
          <b className="grid size-10 place-items-center rounded-full bg-white text-[.65rem] text-slate-950">
            NH
          </b>
          <span className="hidden sm:block">
            <strong className="block text-xs">Design directions</strong>
            <small className="design-lab-mono-label text-slate-400">Owner studio + magazine</small>
          </span>
        </a>
        <label className="design-lab-direction-picker">
          <span>
            <b>{direction.metadata.order}</b>
            <small>14 directions</small>
          </span>
          <select
            aria-label="Visual direction"
            onChange={(event) => selectDirection(event.target.value)}
            value={directionId}
          >
            {directionGroups.map(([collection, directions]) => (
              <optgroup key={collection} label={collection}>
                {directions.map((candidate) => (
                  <option key={candidate.id} value={candidate.id}>
                    {candidate.metadata.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <div className="design-lab-segment" aria-label="Experience view">
          {(['desk', 'write', 'reader'] as const).map((candidate) => (
            <button
              aria-pressed={candidate === view}
              className={candidate === view ? 'active' : ''}
              key={candidate}
              onClick={() => setView(candidate)}
              type="button"
            >
              {candidate}
            </button>
          ))}
        </div>
        <span
          aria-label={connection}
          className="design-lab-connection"
          data-testid="design-lab-connection"
          role="status"
        >
          <i className="size-2 rounded-full bg-emerald-400" />
          <span>{connection}</span>
        </span>
        <button
          className="design-lab-control-button"
          onClick={() => setNotesOpen(true)}
          type="button"
        >
          Direction notes +
        </button>
      </nav>

      <main id="design-lab-stage">
        <DirectionView actions={actions} story={story} />
      </main>

      {notesOpen ? (
        <DesignLabDialog close={() => setNotesOpen(false)} label="direction notes">
          <p className="design-lab-mono-label text-indigo-600">
            {direction.metadata.collection} · Direction {direction.metadata.order}
          </p>
          <h2 className="mt-4 text-6xl tracking-[-.07em]">{direction.metadata.name}</h2>
          <p className="mt-6 font-serif text-2xl text-slate-600">{direction.metadata.thesis}</p>
          <dl className="mt-8 divide-y divide-slate-200 border-y border-slate-200 text-sm">
            <div className="py-4">
              <dt className="font-bold">Signature</dt>
              <dd className="mt-1 text-slate-600">{direction.metadata.signature}</dd>
            </div>
            <div className="py-4">
              <dt className="font-bold">Owner fit</dt>
              <dd className="mt-1 text-slate-600">{direction.metadata.ownerFit}</dd>
            </div>
            <div className="py-4">
              <dt className="font-bold">Watch-out</dt>
              <dd className="mt-1 text-slate-600">{direction.metadata.risk}</dd>
            </div>
          </dl>
        </DesignLabDialog>
      ) : null}

      {newOpen ? (
        <DesignLabDialog close={() => setNewOpen(false)} label="new protected story">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void createStory()
            }}
          >
            <p className="design-lab-mono-label text-indigo-600">Protected new draft</p>
            <h2 className="mt-4 text-5xl leading-[.9] tracking-[-.065em]">
              Start with a working title.
            </h2>
            <label className="mt-8 block text-sm font-bold">
              Working title
              <input
                className="design-lab-dialog-field"
                onChange={(event) => setNewTitle(event.target.value)}
                required
                value={newTitle}
              />
            </label>
            <p className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
              A private draft is created before the writing view opens.
            </p>
            <button className="design-lab-dialog-action" disabled={busy} type="submit">
              Create protected draft
            </button>
          </form>
        </DesignLabDialog>
      ) : null}

      {mediaOpen ? (
        <DesignLabDialog close={() => setMediaOpen(false)} label="editorial image upload">
          <form onSubmit={(event) => void uploadMedia(event)}>
            <p className="design-lab-mono-label text-indigo-600">Add editorial image</p>
            <h2 className="mt-4 text-5xl leading-[.9] tracking-[-.065em]">
              Give the image useful context.
            </h2>
            <label className="design-lab-dialog-label">
              Image file
              <input
                accept="image/jpeg,image/png,image/webp"
                className="design-lab-dialog-field"
                name="file"
                required
                type="file"
              />
            </label>
            <label className="design-lab-dialog-label">
              Description for people who cannot see it
              <input className="design-lab-dialog-field" name="alt" required />
            </label>
            <label className="design-lab-dialog-label">
              Caption
              <input className="design-lab-dialog-field" name="caption" />
            </label>
            <label className="design-lab-dialog-label">
              Credit
              <input className="design-lab-dialog-field" name="creditName" required />
            </label>
            <button className="design-lab-dialog-action" disabled={busy} type="submit">
              Upload and use image
            </button>
          </form>
        </DesignLabDialog>
      ) : null}

      {publicationOpen ? (
        <DesignLabDialog close={() => setPublicationOpen(false)} label="publication review">
          <p className="design-lab-mono-label text-indigo-600">Private publication review</p>
          <h2 className="mt-4 text-5xl leading-[.9] tracking-[-.065em]">
            {ready ? 'Everything important is ready.' : 'A few details still need you.'}
          </h2>
          <p className="mt-5 text-sm text-slate-600">
            Your story stays private until you explicitly publish it.
          </p>
          <div className="mt-6 grid gap-2">
            <button
              className="design-lab-dialog-action secondary"
              onClick={() => void preview()}
              type="button"
            >
              Open private reader preview
            </button>
            {ready && story.status !== 'published' && story.status !== 'scheduled' ? (
              <>
                <label className="design-lab-dialog-label">
                  Publish later
                  <input
                    className="design-lab-dialog-field"
                    onChange={(event) => setScheduleAt(event.target.value)}
                    type="datetime-local"
                    value={scheduleAt}
                  />
                </label>
                <button
                  className="design-lab-dialog-action"
                  disabled={busy}
                  onClick={() =>
                    void runAction(
                      (saved) => ({
                        action: 'schedule',
                        localDateTime: scheduleAt,
                        revisionId: saved.server!.revisionId,
                        timeZone: ownerTimeZone,
                      }),
                      `Scheduled for ${scheduleAt.replace('T', ' at ')}.`,
                      'desk',
                    )
                  }
                  type="button"
                >
                  Schedule publication
                </button>
                <button
                  className="design-lab-dialog-action"
                  disabled={busy}
                  onClick={() =>
                    void runAction(
                      (saved) => ({ action: 'publish', revisionId: saved.server!.revisionId }),
                      'Published. All 14 directions now show the same live story.',
                      'reader',
                    )
                  }
                  type="button"
                >
                  Publish story now
                </button>
              </>
            ) : null}
            {story.status === 'published' ? (
              <>
                <label className="design-lab-dialog-label">
                  Reason for the editorial record
                  <textarea
                    className="design-lab-dialog-field min-h-24 py-3"
                    onChange={(event) => setUnpublishReason(event.target.value)}
                    required
                    value={unpublishReason}
                  />
                </label>
                <button
                  className="design-lab-dialog-action danger"
                  disabled={busy || !unpublishReason.trim()}
                  onClick={() =>
                    void runAction(
                      () => ({ action: 'unpublish', reason: unpublishReason }),
                      'Unpublished. The story and revision history remain safe.',
                      'write',
                    )
                  }
                  type="button"
                >
                  Unpublish story
                </button>
              </>
            ) : null}
            {story.status === 'scheduled' ? (
              <button
                className="design-lab-dialog-action danger"
                disabled={busy}
                onClick={() =>
                  void runAction(
                    () => ({ action: 'cancel-schedule' }),
                    'Schedule cancelled. The protected story remains available.',
                    'write',
                  )
                }
                type="button"
              >
                Cancel scheduled publication
              </button>
            ) : null}
          </div>
        </DesignLabDialog>
      ) : null}

      {toast ? (
        <div
          className="fixed bottom-5 right-5 z-[120] max-w-sm rounded-xl bg-slate-950 px-5 py-4 text-sm font-bold text-white shadow-2xl"
          role="status"
        >
          {toast}
        </div>
      ) : null}
    </div>
  )
}
