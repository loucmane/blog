'use client'

import type { JSONContent } from '@tiptap/core'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { Article, ArticleRevision, MediaAsset } from '@/server/content/domain'
import type { ContentNode } from '@/server/content/document'
import { emptyEditorDocument } from '@/server/owner/document'
import {
  ownerRecoveryKey,
  parseOwnerRecovery,
  recoveryIsNewer,
  serializeOwnerRecovery,
  type OwnerRecoveryDraft,
} from '@/server/owner/recovery'
import type { OwnerStoryWorkspace } from '@/server/owner/workspace'

import { MediaLibrary } from './media-library'
import { StructuredEditor } from './structured-editor'

type SaveState = 'conflict' | 'error' | 'idle' | 'offline' | 'saved' | 'saving'
type LifecycleAction =
  'cancel-schedule' | 'delete' | 'publish' | 'restore' | 'schedule' | 'unpublish'

interface StoryEditorProps {
  readonly initialMedia: readonly MediaAsset[]
  readonly initialWorkspace: OwnerStoryWorkspace | null
  readonly timeZone: string
}

interface DraftSnapshot {
  readonly article: Article | null
  readonly dek: string
  readonly document: JSONContent
  readonly revisionId: string | null
  readonly title: string
}

interface MutationResult {
  readonly article: Article
  readonly revision?: ArticleRevision
}

function mutationKey(): string {
  return globalThis.crypto.randomUUID()
}

function editorJson(document: ContentNode): JSONContent {
  return structuredClone(document) as JSONContent
}

async function responseJson(response: Response): Promise<Record<string, unknown>> {
  const result = (await response.json()) as Record<string, unknown>
  if (!response.ok) {
    throw Object.assign(new Error(String(result.error ?? 'The request could not be completed.')), {
      conflict: result.conflict,
      status: response.status,
    })
  }
  return result
}

export function StoryEditor({ initialMedia, initialWorkspace, timeZone }: StoryEditorProps) {
  const router = useRouter()
  const [article, setArticle] = useState(initialWorkspace?.article ?? null)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [currentRevisionId, setCurrentRevisionId] = useState(
    initialWorkspace?.currentRevision.id ?? null,
  )
  const [dek, setDek] = useState(initialWorkspace?.article.dek ?? '')
  const [document, setDocument] = useState<JSONContent>(
    editorJson(initialWorkspace?.currentRevision.document.document ?? emptyEditorDocument()),
  )
  const [media, setMedia] = useState<readonly MediaAsset[]>(initialMedia)
  const [message, setMessage] = useState('Your work saves automatically.')
  const [recovery, setRecovery] = useState<OwnerRecoveryDraft | null>(null)
  const [revisions, setRevisions] = useState<readonly ArticleRevision[]>(
    initialWorkspace?.revisions ?? [],
  )
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [scheduleAt, setScheduleAt] = useState('')
  const [title, setTitle] = useState(initialWorkspace?.article.title ?? '')
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const [confirmingUnpublish, setConfirmingUnpublish] = useState(false)
  const [unpublishReason, setUnpublishReason] = useState('')
  const [isLifecyclePending, setIsLifecyclePending] = useState(false)
  const [isPreviewPending, setIsPreviewPending] = useState(false)
  const [isRestoringRevision, setIsRestoringRevision] = useState(false)
  const dirtyGenerationRef = useRef(0)
  const initialRenderRef = useRef(true)
  const inFlightRef = useRef<Promise<MutationResult | null> | null>(null)
  const persistedGenerationRef = useRef(0)
  const latestRef = useRef<DraftSnapshot>({
    article: initialWorkspace?.article ?? null,
    dek: initialWorkspace?.article.dek ?? '',
    document: editorJson(
      initialWorkspace?.currentRevision.document.document ?? emptyEditorDocument(),
    ),
    revisionId: initialWorkspace?.currentRevision.id ?? null,
    title: initialWorkspace?.article.title ?? '',
  })
  const requestIdentityRef = useRef<{ fingerprint: string; key: string } | null>(null)
  const actionRequestIdentityRef = useRef<{ fingerprint: string; key: string } | null>(null)
  const restoreRequestIdentityRef = useRef<{ fingerprint: string; key: string } | null>(null)
  const lifecycleInProgressRef = useRef(false)
  const previewInProgressRef = useRef(false)
  const restoreActionInProgressRef = useRef(false)
  const restoreInProgressRef = useRef(false)
  const suppressAutosaveRef = useRef(false)

  latestRef.current = { article, dek, document, revisionId: currentRevisionId, title }

  const markChanged = useCallback(() => {
    setActionMessage(null)
    dirtyGenerationRef.current += 1
  }, [])

  useEffect(() => {
    const key = ownerRecoveryKey(article?.id ?? 'new-story')
    const candidate = parseOwnerRecovery(window.localStorage.getItem(key))
    if (
      candidate &&
      (!article ||
        recoveryIsNewer(candidate, article.updatedAt) ||
        candidate.baseVersion > article.version)
    ) {
      setRecovery(candidate)
    }
  }, [article])

  const persistDraft = useCallback(async (): Promise<MutationResult | null> => {
    if (restoreInProgressRef.current) return null
    if (inFlightRef.current) return inFlightRef.current
    const snapshot = latestRef.current
    if (!snapshot.title.trim()) {
      setSaveState('error')
      setMessage('Add a title before saving this story to the magazine.')
      return null
    }
    if (snapshot.article && persistedGenerationRef.current >= dirtyGenerationRef.current) {
      setSaveState('saved')
      setMessage('All changes are saved.')
      return { article: snapshot.article }
    }
    if (!navigator.onLine) {
      setSaveState('offline')
      setMessage('You are offline. This draft is safe on this device and will retry when online.')
      return null
    }
    const generation = dirtyGenerationRef.current
    const fingerprint = JSON.stringify({
      articleId: snapshot.article?.id ?? null,
      dek: snapshot.dek,
      document: snapshot.document,
      title: snapshot.title,
      version: snapshot.article?.version ?? null,
    })
    if (requestIdentityRef.current?.fingerprint !== fingerprint) {
      requestIdentityRef.current = { fingerprint, key: mutationKey() }
    }
    const request = (async () => {
      setSaveState('saving')
      setMessage('Saving…')
      const response = await fetch(
        snapshot.article ? `/api/owner/stories/${snapshot.article.id}` : '/api/owner/stories',
        {
          body: JSON.stringify({
            dek: snapshot.dek,
            document: snapshot.document,
            ...(snapshot.article ? { expectedVersion: snapshot.article.version } : {}),
            idempotencyKey: requestIdentityRef.current!.key,
            title: snapshot.title,
          }),
          headers: { 'content-type': 'application/json' },
          method: snapshot.article ? 'PATCH' : 'POST',
        },
      )
      const result = (await responseJson(response)) as unknown as MutationResult
      persistedGenerationRef.current = Math.max(persistedGenerationRef.current, generation)
      latestRef.current = {
        ...latestRef.current,
        article: result.article,
        revisionId: result.revision?.id ?? latestRef.current.revisionId,
      }
      setArticle(result.article)
      if (result.revision) {
        setCurrentRevisionId(result.revision.id)
        setRevisions((current) => [
          result.revision!,
          ...current.filter(({ id }) => id !== result.revision!.id),
        ])
      }
      requestIdentityRef.current = null
      if (generation === dirtyGenerationRef.current) {
        window.localStorage.removeItem(ownerRecoveryKey(snapshot.article?.id ?? 'new-story'))
        window.localStorage.removeItem(ownerRecoveryKey(result.article.id))
        setSaveState('saved')
        setMessage(
          `Saved ${new Date(result.article.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
        )
      }
      if (!snapshot.article) router.replace(`/owner/stories/${result.article.id}`)
      return result
    })()
      .catch((error: unknown) => {
        const conflict =
          typeof error === 'object' && error !== null && 'status' in error && error.status === 409
        setSaveState(conflict ? 'conflict' : navigator.onLine ? 'error' : 'offline')
        setMessage(
          conflict
            ? 'This story changed in another window. Your version is still safe on this device.'
            : error instanceof Error
              ? error.message
              : 'The story could not be saved. Your local recovery copy is still safe.',
        )
        return null
      })
      .finally(() => {
        inFlightRef.current = null
        if (generation !== dirtyGenerationRef.current) {
          window.setTimeout(() => void persistDraft(), 0)
        }
      })
    inFlightRef.current = request
    return request
  }, [router])

  const persistDraftThroughGeneration = useCallback(
    async (generation: number): Promise<MutationResult | null> => {
      let result = await persistDraft()
      while (result && persistedGenerationRef.current < generation) {
        result = await persistDraft()
      }
      return result
    },
    [persistDraft],
  )

  useEffect(() => {
    if (initialRenderRef.current) {
      initialRenderRef.current = false
      return
    }
    if (suppressAutosaveRef.current) {
      suppressAutosaveRef.current = false
      return
    }
    const snapshot = latestRef.current
    const recoveryDraft: OwnerRecoveryDraft = {
      articleId: snapshot.article?.id ?? 'new-story',
      baseVersion: snapshot.article?.version ?? 1,
      dek: snapshot.dek,
      document: snapshot.document,
      savedAt: new Date().toISOString(),
      title: snapshot.title,
    }
    try {
      window.localStorage.setItem(
        ownerRecoveryKey(recoveryDraft.articleId),
        serializeOwnerRecovery(recoveryDraft),
      )
    } catch {
      setMessage('This browser could not store a recovery copy. Keep this tab open while saving.')
    }
    const timer = window.setTimeout(() => void persistDraft(), 1_500)
    return () => window.clearTimeout(timer)
  }, [dek, document, persistDraft, title])

  useEffect(() => {
    function online() {
      setActionMessage(null)
      setMessage('Connection restored. Saving your latest changes…')
      void persistDraft()
    }
    function offline() {
      setActionMessage(null)
      setSaveState('offline')
      setMessage('You are offline. This draft is safe on this device.')
    }
    window.addEventListener('online', online)
    window.addEventListener('offline', offline)
    return () => {
      window.removeEventListener('online', online)
      window.removeEventListener('offline', offline)
    }
  }, [persistDraft])

  async function lifecycle(action: LifecycleAction) {
    if (
      lifecycleInProgressRef.current ||
      previewInProgressRef.current ||
      restoreActionInProgressRef.current
    ) {
      return
    }
    lifecycleInProgressRef.current = true
    setIsLifecyclePending(true)
    setActionMessage(
      action === 'schedule'
        ? 'Scheduling…'
        : action === 'publish'
          ? 'Publishing…'
          : 'Updating publication status…',
    )
    try {
      const requiresCurrentDraft = action !== 'restore'
      let saved: MutationResult | null = null
      if (requiresCurrentDraft) {
        let generation = dirtyGenerationRef.current
        saved = await persistDraftThroughGeneration(generation)
        while (saved && generation !== dirtyGenerationRef.current) {
          generation = dirtyGenerationRef.current
          saved = await persistDraftThroughGeneration(generation)
        }
        if (!saved) {
          setActionMessage(
            'Save the latest draft successfully before changing its publication status.',
          )
          return
        }
      }
      const current = saved?.article ?? latestRef.current.article
      const revisionId = saved?.revision?.id ?? latestRef.current.revisionId
      if (!current || !revisionId) return
      const requestInput = {
        action,
        expectedVersion: current.version,
        ...(action === 'publish' || action === 'schedule' ? { revisionId } : {}),
        ...(action === 'schedule' ? { localDateTime: scheduleAt, timeZone } : {}),
        ...(action === 'unpublish' ? { reason: unpublishReason.trim() } : {}),
      }
      const fingerprint = JSON.stringify({ articleId: current.id, ...requestInput })
      if (actionRequestIdentityRef.current?.fingerprint !== fingerprint) {
        actionRequestIdentityRef.current = { fingerprint, key: mutationKey() }
      }
      const response = await fetch(`/api/owner/stories/${current.id}/actions`, {
        body: JSON.stringify({
          ...requestInput,
          idempotencyKey: actionRequestIdentityRef.current.key,
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      })
      const result = await responseJson(response)
      actionRequestIdentityRef.current = null
      const nextArticle = ('article' in result ? result.article : result) as Article
      setArticle(nextArticle)
      setSaveState('saved')
      setActionMessage(
        action === 'publish'
          ? 'Published. Readers can now see this version.'
          : action === 'schedule'
            ? `Scheduled for ${new Date(nextArticle.scheduledAt!).toLocaleString(undefined, {
                timeZone,
              })} (${timeZone}).`
            : action === 'cancel-schedule'
              ? 'Scheduled publication cancelled. The current reader version is unchanged.'
              : action === 'unpublish'
                ? 'Unpublished. The story remains safe in your workspace.'
                : action === 'delete'
                  ? 'Moved to deleted stories. You can restore it.'
                  : 'Story restored to your workspace.',
      )
      setDeleteConfirmation('')
      if (action === 'unpublish') {
        setConfirmingUnpublish(false)
        setUnpublishReason('')
      }
    } catch (error) {
      setSaveState('error')
      setActionMessage(
        error instanceof Error ? error.message : 'The publication status did not change.',
      )
    } finally {
      lifecycleInProgressRef.current = false
      setIsLifecyclePending(false)
    }
  }

  async function openPreview() {
    if (
      lifecycleInProgressRef.current ||
      previewInProgressRef.current ||
      restoreActionInProgressRef.current
    ) {
      return
    }
    const previewWindow = window.open('about:blank', '_blank')
    if (!previewWindow) {
      setActionMessage('Your browser blocked the preview window. Allow pop-ups, then try again.')
      return
    }
    previewWindow.opener = null
    previewInProgressRef.current = true
    setIsPreviewPending(true)
    setActionMessage('Saving your latest changes for preview…')
    try {
      let generation = dirtyGenerationRef.current
      let saved = await persistDraftThroughGeneration(generation)
      while (saved && generation !== dirtyGenerationRef.current) {
        generation = dirtyGenerationRef.current
        saved = await persistDraftThroughGeneration(generation)
      }
      const current = saved?.article ?? latestRef.current.article
      if (!saved || !current) {
        previewWindow.close()
        setActionMessage('Save the latest draft successfully before opening preview.')
        return
      }
      previewWindow.location.replace(
        new URL(`/owner/stories/${current.id}/preview`, window.location.origin).toString(),
      )
      setActionMessage('Preview opened with your latest saved changes.')
    } catch (error) {
      previewWindow.close()
      setActionMessage(error instanceof Error ? error.message : 'The preview could not be opened.')
    } finally {
      previewInProgressRef.current = false
      setIsPreviewPending(false)
    }
  }

  async function restoreRevision(revisionId: string) {
    if (
      lifecycleInProgressRef.current ||
      previewInProgressRef.current ||
      restoreActionInProgressRef.current
    ) {
      return
    }
    restoreActionInProgressRef.current = true
    setIsRestoringRevision(true)
    setActionMessage('Restoring revision…')
    try {
      let generation = dirtyGenerationRef.current
      let saved = await persistDraftThroughGeneration(generation)
      while (saved && generation !== dirtyGenerationRef.current) {
        generation = dirtyGenerationRef.current
        saved = await persistDraftThroughGeneration(generation)
      }
      if (!saved) {
        setActionMessage('Save the latest draft successfully before restoring a revision.')
        return
      }
      const current = saved.article ?? latestRef.current.article
      if (!current) return
      const restoreGeneration = dirtyGenerationRef.current
      restoreInProgressRef.current = true
      const requestInput = {
        action: 'restore-revision' as const,
        expectedVersion: current.version,
        revisionId,
      }
      const fingerprint = JSON.stringify({ articleId: current.id, ...requestInput })
      if (restoreRequestIdentityRef.current?.fingerprint !== fingerprint) {
        restoreRequestIdentityRef.current = { fingerprint, key: mutationKey() }
      }
      const response = await fetch(`/api/owner/stories/${current.id}/actions`, {
        body: JSON.stringify({
          ...requestInput,
          idempotencyKey: restoreRequestIdentityRef.current.key,
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      })
      const result = (await responseJson(response)) as unknown as MutationResult
      restoreRequestIdentityRef.current = null
      setArticle(result.article)
      if (result.revision) {
        const editsDuringRestore = dirtyGenerationRef.current !== restoreGeneration
        setCurrentRevisionId(result.revision.id)
        setRevisions((currentRevisions) => [result.revision!, ...currentRevisions])
        if (editsDuringRestore) {
          latestRef.current = {
            ...latestRef.current,
            article: result.article,
            revisionId: result.revision.id,
          }
          restoreInProgressRef.current = false
          const resaved = await persistDraftThroughGeneration(dirtyGenerationRef.current)
          setActionMessage(
            resaved
              ? 'Revision restored. Edits made during recovery were saved as the latest draft.'
              : 'Revision restored, but newer edits remain safe on this device and still need saving.',
          )
          return
        }
        const nextDocument = editorJson(result.revision.document.document)
        const nextTitle = result.revision.title ?? result.revision.document.title
        const nextDek = result.revision.dek ?? latestRef.current.dek
        suppressAutosaveRef.current = true
        persistedGenerationRef.current = dirtyGenerationRef.current
        latestRef.current = {
          article: result.article,
          dek: nextDek,
          document: nextDocument,
          revisionId: result.revision.id,
          title: nextTitle,
        }
        setDocument(nextDocument)
        setTitle(nextTitle)
        setDek(nextDek)
      }
      setActionMessage('Revision restored as a new draft. The newer history is still available.')
    } catch (error) {
      setActionMessage(
        error instanceof Error ? error.message : 'That revision could not be restored.',
      )
    } finally {
      restoreActionInProgressRef.current = false
      restoreInProgressRef.current = false
      setIsRestoringRevision(false)
    }
  }

  async function resolveConflict(keepLocal: boolean) {
    setActionMessage(null)
    const current = latestRef.current.article
    if (!current) return
    setMessage('Loading the newest saved version…')
    try {
      const response = await fetch(`/api/owner/stories/${current.id}`, { cache: 'no-store' })
      const workspace = (await responseJson(response)) as unknown as OwnerStoryWorkspace
      setArticle(workspace.article)
      setCurrentRevisionId(workspace.currentRevision.id)
      setRevisions(workspace.revisions)
      latestRef.current = {
        ...latestRef.current,
        article: workspace.article,
        revisionId: workspace.currentRevision.id,
      }
      if (!keepLocal) {
        suppressAutosaveRef.current = true
        persistedGenerationRef.current = dirtyGenerationRef.current
        setTitle(workspace.article.title)
        setDek(workspace.article.dek)
        setDocument(editorJson(workspace.currentRevision.document.document))
        latestRef.current = {
          article: workspace.article,
          dek: workspace.article.dek,
          document: editorJson(workspace.currentRevision.document.document),
          revisionId: workspace.currentRevision.id,
          title: workspace.article.title,
        }
        window.localStorage.removeItem(ownerRecoveryKey(current.id))
        setSaveState('saved')
        setMessage('The newest server copy is open. Your older revisions remain available.')
        return
      }
      markChanged()
      setSaveState('idle')
      setMessage('Your copy is ready to save on top of the newest version.')
      window.setTimeout(() => void persistDraft(), 0)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The newest version could not be loaded.')
    }
  }

  function recoverLocalDraft() {
    if (!recovery) return
    setActionMessage(null)
    setTitle(recovery.title)
    setDek(recovery.dek)
    setDocument(recovery.document as JSONContent)
    markChanged()
    setRecovery(null)
    setMessage('Recovery copy opened. Review it, then save when ready.')
  }

  const deleted = article?.deletedAt !== null && article?.deletedAt !== undefined
  const ownerControlsDisabled = isLifecyclePending || isPreviewPending || isRestoringRevision

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0 space-y-5">
        {recovery ? (
          <section className="rounded-xl border-2 border-primary bg-accent p-4" role="alert">
            <h2 className="font-semibold">A newer recovery copy is available</h2>
            <p className="mt-1 text-sm">
              It was saved on this device at {new Date(recovery.savedAt).toLocaleString()}.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                className="min-h-11 rounded-md bg-primary px-4 font-semibold text-primary-foreground"
                disabled={ownerControlsDisabled}
                onClick={recoverLocalDraft}
                type="button"
              >
                Open recovery copy
              </button>
              <button
                className="min-h-11 rounded-md border border-border bg-card px-4"
                disabled={ownerControlsDisabled}
                onClick={() => {
                  window.localStorage.removeItem(ownerRecoveryKey(recovery.articleId))
                  setRecovery(null)
                }}
                type="button"
              >
                Keep server copy
              </button>
            </div>
          </section>
        ) : null}

        <div className="rounded-xl border border-border bg-card p-5">
          <label className="grid gap-2" htmlFor="story-title">
            <span className="text-sm font-semibold">Story title</span>
            <input
              className="min-h-14 rounded-md border border-input bg-background px-4 font-serif text-2xl"
              disabled={ownerControlsDisabled}
              id="story-title"
              maxLength={300}
              onChange={(event) => {
                setTitle(event.target.value)
                markChanged()
              }}
              placeholder="A clear, inviting headline"
              value={title}
            />
          </label>
          <label className="mt-4 grid gap-2" htmlFor="story-summary">
            <span className="text-sm font-semibold">Short summary</span>
            <textarea
              className="min-h-24 rounded-md border border-input bg-background p-4"
              disabled={ownerControlsDisabled}
              id="story-summary"
              maxLength={2_000}
              onChange={(event) => {
                setDek(event.target.value)
                markChanged()
              }}
              placeholder="Tell readers what this story is about."
              value={dek}
            />
          </label>
        </div>

        <StructuredEditor
          disabled={ownerControlsDisabled}
          media={media}
          onChange={(nextDocument) => {
            setDocument(nextDocument)
            markChanged()
          }}
          value={document}
        />
      </div>

      <aside className="space-y-5">
        <section className="sticky top-4 rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Story status</h2>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              {deleted ? 'deleted' : (article?.status ?? 'new draft')}
            </span>
          </div>
          <p
            aria-live="polite"
            className="mt-3 min-h-10 text-sm text-muted-foreground"
            data-save-state={saveState}
            role="status"
          >
            {actionMessage ?? message}
          </p>
          {saveState === 'conflict' ? (
            <div className="mt-3 grid gap-2 rounded-lg bg-accent p-3">
              <button
                className="min-h-11 rounded-md bg-primary px-3 font-semibold text-primary-foreground"
                disabled={ownerControlsDisabled}
                onClick={() => void resolveConflict(true)}
                type="button"
              >
                Keep my copy and save again
              </button>
              <button
                className="min-h-11 rounded-md border border-border bg-card px-3 font-semibold"
                disabled={ownerControlsDisabled}
                onClick={() => void resolveConflict(false)}
                type="button"
              >
                Open the newest server copy
              </button>
            </div>
          ) : null}
          <button
            className="mt-3 min-h-11 w-full rounded-md border border-border bg-background px-4 font-semibold"
            disabled={ownerControlsDisabled}
            onClick={() => {
              setActionMessage(null)
              void persistDraft()
            }}
            type="button"
          >
            Save now
          </button>
          {article && !deleted ? (
            <button
              className="mt-2 min-h-11 w-full rounded-md border border-border px-4 font-semibold"
              disabled={ownerControlsDisabled}
              onClick={() => void openPreview()}
              type="button"
            >
              {isPreviewPending ? 'Preparing preview…' : 'Preview'}
            </button>
          ) : null}

          {article && !deleted ? (
            <div className="mt-5 space-y-3 border-t border-border pt-5">
              <button
                className="min-h-11 w-full rounded-md bg-primary px-4 font-semibold text-primary-foreground"
                disabled={ownerControlsDisabled}
                onClick={() => void lifecycle('publish')}
                type="button"
              >
                {article.status === 'published' ? 'Publish latest changes' : 'Publish now'}
              </button>
              <label className="grid gap-1 text-sm" htmlFor="schedule-at">
                Schedule for
                <input
                  className="min-h-11 rounded-md border border-input bg-background px-3"
                  disabled={ownerControlsDisabled}
                  id="schedule-at"
                  onChange={(event) => setScheduleAt(event.target.value)}
                  type="datetime-local"
                  value={scheduleAt}
                />
              </label>
              <p className="text-xs text-muted-foreground">Time zone: {timeZone}</p>
              <button
                className="min-h-11 w-full rounded-md border border-border bg-background px-4 font-semibold"
                disabled={ownerControlsDisabled || !scheduleAt}
                onClick={() => void lifecycle('schedule')}
                type="button"
              >
                Schedule publication
              </button>
              {article.status === 'published' || article.status === 'scheduled' ? (
                confirmingUnpublish ? (
                  <div
                    aria-labelledby="unpublish-title"
                    className="grid gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-3"
                    role="group"
                  >
                    <p className="font-semibold" id="unpublish-title">
                      Unpublish this story?
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Readers will lose access immediately, and any scheduled publication will be
                      cancelled. The story and its revision history stay safe here.
                    </p>
                    <label className="grid gap-1 text-sm" htmlFor="unpublish-reason">
                      Reason for the editorial record
                      <textarea
                        className="min-h-24 rounded-md border border-input bg-background p-3"
                        disabled={ownerControlsDisabled}
                        id="unpublish-reason"
                        maxLength={1_000}
                        onChange={(event) => setUnpublishReason(event.target.value)}
                        placeholder="For example: Needs a factual correction"
                        value={unpublishReason}
                      />
                    </label>
                    <button
                      className="min-h-11 rounded-md bg-destructive px-4 font-semibold text-destructive-foreground disabled:opacity-50"
                      disabled={ownerControlsDisabled || !unpublishReason.trim()}
                      onClick={() => void lifecycle('unpublish')}
                      type="button"
                    >
                      Unpublish story
                    </button>
                    <button
                      className="min-h-11 rounded-md border border-border bg-background px-4 font-semibold"
                      disabled={ownerControlsDisabled}
                      onClick={() => {
                        setConfirmingUnpublish(false)
                        setUnpublishReason('')
                      }}
                      type="button"
                    >
                      Keep current status
                    </button>
                  </div>
                ) : (
                  <button
                    className="min-h-11 w-full rounded-md border border-border bg-background px-4 font-semibold"
                    disabled={ownerControlsDisabled}
                    onClick={() => {
                      setActionMessage(null)
                      setConfirmingUnpublish(true)
                    }}
                    type="button"
                  >
                    Unpublish
                  </button>
                )
              ) : null}
              {article.status === 'scheduled' ? (
                <button
                  className="min-h-11 w-full rounded-md border border-border bg-background px-4 font-semibold"
                  disabled={ownerControlsDisabled}
                  onClick={() => void lifecycle('cancel-schedule')}
                  type="button"
                >
                  Cancel scheduled publication
                </button>
              ) : null}
            </div>
          ) : null}

          {article ? (
            <div className="mt-5 border-t border-border pt-5">
              {deleted ? (
                <button
                  className="min-h-11 w-full rounded-md bg-primary px-4 font-semibold text-primary-foreground"
                  disabled={ownerControlsDisabled}
                  onClick={() => void lifecycle('restore')}
                  type="button"
                >
                  Restore story
                </button>
              ) : (
                <>
                  <label className="grid gap-1 text-sm" htmlFor="confirm-delete">
                    To delete, type the story title
                    <input
                      className="min-h-11 rounded-md border border-input bg-background px-3"
                      disabled={ownerControlsDisabled}
                      id="confirm-delete"
                      onChange={(event) => setDeleteConfirmation(event.target.value)}
                      value={deleteConfirmation}
                    />
                  </label>
                  <button
                    className="mt-2 min-h-11 w-full rounded-md bg-destructive px-4 font-semibold text-destructive-foreground disabled:opacity-50"
                    disabled={ownerControlsDisabled || deleteConfirmation !== article.title}
                    onClick={() => void lifecycle('delete')}
                    type="button"
                  >
                    Move to deleted stories
                  </button>
                </>
              )}
            </div>
          ) : null}
        </section>

        <MediaLibrary
          disabled={ownerControlsDisabled}
          media={media}
          onAdded={(asset) => setMedia((current) => [asset, ...current])}
        />

        {revisions.length > 0 ? (
          <section
            aria-labelledby="revision-title"
            className="rounded-xl border border-border bg-card p-5"
          >
            <h2 className="font-semibold" id="revision-title">
              Revision history
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Restoring creates a new draft. Nothing is erased.
            </p>
            <ol className="mt-3 space-y-2">
              {revisions.slice(0, 12).map((revision) => (
                <li className="rounded-md bg-muted p-3 text-sm" key={revision.id}>
                  <p>Revision {revision.revisionNumber}</p>
                  {revision.title ? <p className="font-semibold">{revision.title}</p> : null}
                  {revision.dek ? (
                    <p className="line-clamp-2 text-muted-foreground">{revision.dek}</p>
                  ) : null}
                  <p className="text-muted-foreground">
                    {new Date(revision.createdAt).toLocaleString()}
                  </p>
                  {revision.id !== currentRevisionId ? (
                    <button
                      className="mt-2 min-h-11 rounded-md border border-border bg-card px-3 font-semibold"
                      disabled={ownerControlsDisabled}
                      onClick={() => void restoreRevision(revision.id)}
                      type="button"
                    >
                      Restore as draft
                    </button>
                  ) : (
                    <span className="mt-2 block font-semibold">Current draft</span>
                  )}
                </li>
              ))}
            </ol>
          </section>
        ) : null}
      </aside>
    </div>
  )
}
