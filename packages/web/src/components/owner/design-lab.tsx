'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  createDesignLabNavigationHref,
  DesignLabIndex,
  DesignLabNavigation,
  groupDesignLabDirections,
  normalizeLegacyDesignLabHash,
  resolveDesignLabNavigation,
  type DesignLabNavigationDestination,
} from '@/design-lab/navigation'
import { designLabRegistry } from '@/design-lab/registry'
import { OwnerApiClient, OwnerApiError } from '@/design-lab/owner-api-client'
import { createDesignLabStory } from '@/design-lab/seed'
import {
  actionIntoStory,
  mutationIntoStory,
  storyToDocument,
  workspaceIntoStory,
} from '@/design-lab/story-document'
import { readinessChecks, type ReadinessCheckId } from '@/design-lab/view-helpers'
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
const registeredDirections = designLabRegistry.list()
const directionGroups = groupDesignLabDirections(registeredDirections)
const knownDirectionIds = new Set(registeredDirections.map(({ id }) => id))
const directionCount = registeredDirections.length

function tomorrowAtEight(): string {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return `${local.toISOString().slice(0, 10)}T08:00`
}

function ownerMessage(error: unknown): string {
  if (error instanceof OwnerApiError) return error.message
  return 'The private workspace could not be reached. Your visible edits remain on this page.'
}

const readinessActionLabels: Readonly<Record<ReadinessCheckId, string>> = {
  draft: 'Save draft',
  image: 'Describe image',
  story: 'Go to story',
  summary: 'Go to summary',
}

function rememberStory(articleId: string): string {
  const location = new URL(window.location.href)
  location.searchParams.set('story', articleId)
  window.history.replaceState(null, '', `${location.pathname}${location.search}${location.hash}`)
  return location.search
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
      className="design-lab-dialog fixed inset-0 z-[100] grid items-start justify-items-center overflow-y-auto bg-slate-950/65 p-4 backdrop-blur-xl sm:items-center"
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
      ref={dialogRef}
      tabIndex={-1}
    >
      <div className="design-lab-dialog-shell relative my-8 w-full max-w-[34rem]">
        <button
          aria-label={`Close ${label}`}
          className="design-lab-dialog-close absolute right-4 top-4 grid size-11 place-items-center rounded-full bg-slate-200 text-xl"
          onClick={close}
          type="button"
        >
          ×
        </button>
        <div className="design-lab-dialog-panel rounded-[2rem] bg-[#fbfcfa] p-[clamp(1.5rem,5vw,3rem)] text-slate-950 shadow-[0_50px_160px_rgba(0,0,0,.4)]">
          {children}
        </div>
      </div>
    </dialog>
  )
}

export function DesignLab() {
  const client = useMemo(() => new OwnerApiClient(), [])
  const [navigation, setNavigation] = useState(() =>
    resolveDesignLabNavigation('', knownDirectionIds),
  )
  const [currentSearch, setCurrentSearch] = useState('')
  const [announcement, setAnnouncement] = useState('')
  const [story, setStoryState] = useState(() => ({
    ...createDesignLabStory(),
    saved: 'Private new draft',
  }))
  const [connection, setConnection] = useState('Connecting to private workspace…')
  const [busy, setBusy] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [newOpen, setNewOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [publicationOpen, setPublicationOpen] = useState(false)
  const [mediaOpen, setMediaOpen] = useState(false)
  const [focusTarget, setFocusTarget] = useState<'design-lab-summary' | 'design-lab-title' | null>(
    null,
  )
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
        const next = { ...mutationIntoStory(storyRef.current, result), saved: 'Saved just now' }
        commitStory(generationRef.current === generation ? next : { ...next, saved: 'Saving…' })
        return next
      })
      .catch((error: unknown) => {
        const next = {
          ...storyRef.current,
          saved:
            error instanceof OwnerApiError && error.status === 409
              ? 'A newer draft needs review'
              : 'Save paused. Your changes are still here.',
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

  const syncNavigation = useCallback((href: string) => {
    const location = new URL(href)
    setCurrentSearch(location.search)
    setNavigation(resolveDesignLabNavigation(location.search, knownDirectionIds))
  }, [])

  useEffect(() => {
    const normalizedHref = normalizeLegacyDesignLabHash(window.location.href)
    if (normalizedHref) window.history.replaceState(null, '', normalizedHref)
    syncNavigation(window.location.href)
    const syncFromHistory = () => syncNavigation(window.location.href)
    window.addEventListener('popstate', syncFromHistory)
    return () => window.removeEventListener('popstate', syncFromHistory)
  }, [syncNavigation])

  useEffect(() => {
    const requestedStoryId = new URLSearchParams(window.location.search).get('story')
    void client
      .listStories()
      .then(async ({ stories }) => {
        const existing =
          stories.find(({ deletedAt, id }) => deletedAt === null && id === requestedStoryId) ??
          stories.find(({ deletedAt }) => deletedAt === null)
        if (existing) {
          const workspace = await client.loadStory(existing.id)
          const next = {
            ...workspaceIntoStory(workspace, createDesignLabStory()),
            saved: 'Saved just now',
          }
          commitStory(next)
          setCurrentSearch(rememberStory(next.server!.id))
        }
        setConnection('Live · private owner workspace')
      })
      .catch((error: unknown) => {
        setConnection('Backend unavailable · local visual preview')
        showToast(ownerMessage(error))
      })
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [client, commitStory, showToast])

  const navigate = useCallback(
    (destination: DesignLabNavigationDestination) => {
      const href = createDesignLabNavigationHref(window.location.href, destination)
      window.history.pushState(null, '', href)
      syncNavigation(window.location.href)
      window.scrollTo({ behavior: 'auto', top: 0 })
    },
    [syncNavigation],
  )

  const setView = useCallback(
    (nextView: DesignLabView) => {
      if (!navigation.directionId) return
      navigate({ directionId: navigation.directionId, kind: 'direction', view: nextView })
    },
    [navigate, navigation.directionId],
  )

  useEffect(() => {
    if (!focusTarget || navigation.view !== 'write') return
    const field = document.getElementById(focusTarget)
    if (!(field instanceof HTMLElement)) return
    field.focus()
    setFocusTarget(null)
  }, [focusTarget, navigation.view])

  const change = useCallback(
    (field: EditableStoryField, value: string) => {
      generationRef.current += 1
      const current = storyRef.current
      const next = {
        ...current,
        [field]: value,
        saved: current.server ? 'Saving…' : 'Private new draft',
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
      saved: 'Creating private draft…',
      title: newTitle.trim(),
    }
    try {
      const result = await client.createStory({
        dek: draft.dek,
        document: storyToDocument(draft),
        idempotencyKey: crypto.randomUUID(),
        title: draft.title,
      })
      const next = { ...mutationIntoStory(draft, result), saved: 'Draft created' }
      generationRef.current = 0
      persistedGenerationRef.current = 0
      commitStory(next)
      setCurrentSearch(rememberStory(next.server!.id))
      setNewOpen(false)
      setNewTitle('')
      setView('write')
      showToast(`Draft created. All ${directionCount} directions now share it privately.`)
    } catch (error) {
      showToast(ownerMessage(error))
    } finally {
      setBusy(false)
    }
  }, [busy, client, commitStory, newTitle, setView, showToast])

  const saveCurrentDraft = useCallback(async () => {
    if (busy || storyRef.current.server) return
    setBusy(true)
    const draft = { ...storyRef.current, saved: 'Saving…' }
    commitStory(draft)
    try {
      const result = await client.createStory({
        dek: draft.dek,
        document: storyToDocument(draft),
        idempotencyKey: crypto.randomUUID(),
        title: draft.title,
      })
      const next = { ...mutationIntoStory(draft, result), saved: 'Draft created' }
      generationRef.current = 0
      persistedGenerationRef.current = 0
      commitStory(next)
      setCurrentSearch(rememberStory(next.server!.id))
      showToast('Draft created. It stays private until you publish it.')
    } catch (error) {
      commitStory({ ...storyRef.current, saved: 'Save paused. Your changes are still here.' })
      showToast(ownerMessage(error))
    } finally {
      setBusy(false)
    }
  }, [busy, client, commitStory, showToast])

  const fixReadiness = useCallback(
    (id: ReadinessCheckId) => {
      if (id === 'draft') {
        void saveCurrentDraft()
        return
      }
      if (id === 'image') {
        setPublicationOpen(false)
        setMediaOpen(true)
        return
      }
      setPublicationOpen(false)
      setFocusTarget(id === 'story' ? 'design-lab-title' : 'design-lab-summary')
      setView('write')
    },
    [saveCurrentDraft, setView],
  )

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
        if (!saved?.server) throw new Error('A private draft is required')
        const result: StoryActionDto = await client.runStoryAction(saved.server.id, {
          expectedVersion: saved.server.version,
          idempotencyKey: crypto.randomUUID(),
          ...input(saved),
        })
        const next = { ...actionIntoStory(saved, result), saved: 'Saved just now' }
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
      showToast('Save a private draft before opening the reader preview.')
      return
    }
    setPublicationOpen(false)
    setView('reader')
    showToast('Private preview opened from the latest saved draft.')
  }, [persistLatest, setView, showToast])

  const uploadMedia = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      if (!storyRef.current.server || busy) {
        showToast('Save a private draft before adding media.')
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
          saved: 'Saving…',
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

  const openDirection = useCallback(
    (
      nextDirection: DesignLabDirection,
      nextView: DesignLabView = navigation.directionId ? navigation.view : 'desk',
    ) => {
      navigate({ directionId: nextDirection.id, kind: 'direction', view: nextView })
      const group = directionGroups.find(({ directions }) =>
        directions.some(({ id }) => id === nextDirection.id),
      )
      setAnnouncement(
        `Now viewing ${nextDirection.metadata.name} — ${group?.label ?? nextDirection.metadata.collection}.`,
      )
    },
    [navigate, navigation.directionId, navigation.view],
  )

  const openIndex = useCallback(() => {
    navigate({ kind: 'index' })
    setAnnouncement('Showing all directions.')
  }, [navigate])

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
  const direction = navigation.directionId ? designLabRegistry.get(navigation.directionId) : null
  const DirectionView = direction ? direction.views[navigation.view] : null
  const checks = readinessChecks(story)
  const ready = checks.every(({ ready: checkReady }) => checkReady)
  const navigationBaseHref = `https://design-lab.local/owner/design-lab${currentSearch}`
  const indexHref = createDesignLabNavigationHref(navigationBaseHref, { kind: 'index' })

  return (
    <div className="design-lab-root min-h-screen bg-slate-100">
      <a className="sr-only focus:not-sr-only" href="#design-lab-stage">
        Skip to design
      </a>
      <DesignLabNavigation
        announcement={announcement}
        connection={connection}
        direction={direction}
        groups={directionGroups}
        indexHref={indexHref}
        onDirection={openDirection}
        onIndex={openIndex}
        onNotes={() => setNotesOpen(true)}
        onView={setView}
        view={navigation.view}
      />

      <main id="design-lab-stage">
        {direction && DirectionView ? (
          <>
            {navigation.notice ? (
              <p className="design-lab-state-notice" role="status">
                {navigation.notice}
              </p>
            ) : null}
            <div className="design-lab-stage-swap" key={`${direction.id}-${navigation.view}`}>
              <DirectionView actions={actions} story={story} />
            </div>
          </>
        ) : (
          <DesignLabIndex
            groups={directionGroups}
            hrefForDirection={(directionId) =>
              createDesignLabNavigationHref(navigationBaseHref, {
                directionId,
                kind: 'direction',
                view: 'desk',
              })
            }
            notice={navigation.notice}
            onDirection={(nextDirection) => openDirection(nextDirection, 'desk')}
          />
        )}
      </main>

      {notesOpen && direction ? (
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
        <DesignLabDialog close={() => setNewOpen(false)} label="new private story">
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void createStory()
            }}
          >
            <p className="design-lab-mono-label text-indigo-600">Private new draft</p>
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
              Create private draft
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
          <ol aria-label="Publication checklist" className="design-lab-publication-checklist">
            {checks.map((check, index) => (
              <li
                data-ready={check.ready}
                data-testid={`publication-check-${check.id}`}
                key={check.id}
              >
                <span className="design-lab-publication-check-copy">
                  <span aria-hidden="true" className="design-lab-publication-check-number">
                    {index + 1}
                  </span>
                  <span>{check.label}</span>
                </span>
                {check.ready ? (
                  <strong className="design-lab-publication-check-done">Done</strong>
                ) : (
                  <button
                    className="design-lab-publication-fix"
                    disabled={busy && check.id === 'draft'}
                    onClick={() => fixReadiness(check.id)}
                    type="button"
                  >
                    {readinessActionLabels[check.id]}
                  </button>
                )}
              </li>
            ))}
          </ol>
          <div className="mt-6 grid gap-2">
            <button
              className="design-lab-dialog-action secondary"
              onClick={() => void preview()}
              type="button"
            >
              Open private reader preview
            </button>
            {story.status !== 'published' && story.status !== 'scheduled' ? (
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
                  aria-describedby={!ready ? 'publication-actions-reason' : undefined}
                  className="design-lab-dialog-action"
                  disabled={busy || !ready}
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
                  aria-describedby={!ready ? 'publication-actions-reason' : undefined}
                  className="design-lab-dialog-action"
                  disabled={busy || !ready}
                  onClick={() =>
                    void runAction(
                      (saved) => ({ action: 'publish', revisionId: saved.server!.revisionId }),
                      `Published. All ${directionCount} directions now show the same live story.`,
                      'reader',
                    )
                  }
                  type="button"
                >
                  Publish story now
                </button>
                {!ready ? (
                  <p className="design-lab-publication-reason" id="publication-actions-reason">
                    Publish becomes available when the checklist is done.
                  </p>
                ) : null}
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
                      'Unpublished. The story and earlier drafts remain safe.',
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
                    'Schedule cancelled. The private draft remains available.',
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
