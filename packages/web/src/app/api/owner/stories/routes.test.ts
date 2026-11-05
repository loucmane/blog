import { randomUUID } from 'node:crypto'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { expirePublicReader } from '@/reader/cache'
import { OwnerConfigurationError } from '@/server/owner/config'
import { createOwnerContentDocument } from '@/server/owner/document'
import * as ownerRuntime from '@/server/owner/runtime'
import { OwnerAccessError, requireOwnerSession } from '@/server/owner/session'

import { GET as listStories, POST as createStory } from './route'
import { GET as loadStory, PATCH as saveStory } from './[id]/route'
import { POST as storyAction } from './[id]/actions/route'

vi.mock('@/reader/cache', () => ({ expirePublicReader: vi.fn() }))
vi.mock('@/server/owner/session', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  requireOwnerSession: vi.fn(),
}))

const origin = 'https://magazine.example'
const correlationId = 'owner-request-trace-0001'
const document = {
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [{ type: 'text', text: 'A complete story with enough text to publish.' }],
    },
  ],
}
const draft = { dek: 'A summary long enough to publish.', document, title: 'A traced story' }
const context = { params: Promise.resolve({ id: 'article-trace' }) }

function request(path: string, method = 'GET', body?: unknown, trace = correlationId) {
  return new Request(`${origin}/api/owner/stories${path}`, {
    method,
    headers: { 'content-type': 'application/json', origin, 'x-correlation-id': trace },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  })
}
function expectHeaders(response: Response, trace = correlationId) {
  expect(Object.fromEntries(response.headers)).toEqual({
    'cache-control': 'private, no-store',
    'content-type': 'application/json',
    'x-correlation-id': trace,
  })
}

let runtime: ownerRuntime.OwnerRuntime
beforeEach(() => {
  vi.stubEnv('MAGAZINE_RUNTIME_SITE_URL', origin)
  vi.mocked(requireOwnerSession).mockResolvedValue({
    id: 'owner-1',
    email: 'owner@example.test',
    name: 'Owner',
  })
  runtime = ownerRuntime.createOwnerRuntime({
    NODE_ENV: 'test',
    MAGAZINE_OWNER_TEST_MODE: '1',
    MAGAZINE_OWNER_TEST_TOKEN: randomUUID(),
    MAGAZINE_OWNER_EMAIL: 'owner@example.test',
    BETTER_AUTH_URL: 'http://127.0.0.1:3100',
  })
  vi.spyOn(ownerRuntime, 'getOwnerRuntime').mockReturnValue(runtime)
})
afterEach(() => vi.unstubAllEnvs())

async function seedDraft() {
  return runtime.content.createArticle({
    ...draft,
    document: createOwnerContentDocument({ ...draft, articleId: 'article-trace' }),
    id: 'article-trace',
    idempotencyKey: 'seed-draft-trace',
    slug: 'a-traced-story',
  })
}

describe('observed owner story routes', () => {
  it('preserves list, create, load and save response bodies and headers', async () => {
    const createdCall = vi.spyOn(runtime.content, 'createArticle')
    const created = await createStory(
      request('', 'POST', { ...draft, idempotencyKey: 'create-trace-story' }),
    )
    expect(created.status).toBe(200)
    expectHeaders(created)
    const result = await createdCall.mock.results[0]!.value
    expect(await created.json()).toEqual(result)

    const list = await listStories(request(''))
    expect(list.status).toBe(200)
    expectHeaders(list)
    expect(await list.json()).toEqual({ stories: [result.article] })

    const ctx = { params: Promise.resolve({ id: result.article.id }) }
    const loaded = await loadStory(request(`/${result.article.id}`), ctx)
    expect(loaded.status).toBe(200)
    expectHeaders(loaded)
    expect(await loaded.json()).toEqual(await runtime.workspace.loadStory(result.article.id))

    const savedCall = vi.spyOn(runtime.content, 'saveDraft')
    const saved = await saveStory(
      request(`/${result.article.id}`, 'PATCH', {
        ...draft,
        title: 'A revised story',
        expectedVersion: 1,
        idempotencyKey: 'save-trace-story',
      }),
      ctx,
    )
    expect(saved.status).toBe(200)
    expectHeaders(saved)
    expect(await saved.json()).toEqual(await savedCall.mock.results[0]!.value)
  })

  it.each(['publish', 'schedule', 'unpublish', 'delete'] as const)(
    'links %s and all resulting outbox events to the request without altering its response',
    async (action) => {
      const created = await seedDraft()
      let version = 1
      if (action === 'unpublish') {
        version = (
          await runtime.content.publish({
            articleId: created.article.id,
            expectedVersion: 1,
            idempotencyKey: 'initial-publish-trace',
            revisionId: created.revision.id,
          })
        ).article.version
      }
      const before = await runtime.repository.transaction((tx) => tx.listOutboxEvents())
      const publishCall = vi.spyOn(runtime.content, 'publish')
      const scheduleCall = vi.spyOn(runtime.content, 'schedulePublication')
      const unpublishCall = vi.spyOn(runtime.content, 'unpublish')
      const deleteCall = vi.spyOn(runtime.content, 'softDelete')
      const body = {
        action,
        expectedVersion: version,
        idempotencyKey: `action-${action}-trace`,
        ...(action === 'publish' || action === 'schedule'
          ? { revisionId: created.revision.id }
          : {}),
        ...(action === 'schedule' ? { localDateTime: '2099-07-17T20:01', timeZone: 'UTC' } : {}),
        ...(action === 'unpublish' ? { reason: 'Editorial update' } : {}),
      }
      const response = await storyAction(request('/article-trace/actions', 'POST', body), context)
      expect(response.status).toBe(200)
      expectHeaders(response)
      const call = {
        publish: publishCall,
        schedule: scheduleCall,
        unpublish: unpublishCall,
        delete: deleteCall,
      }[action]
      expect(await response.json()).toEqual(await call.mock.results[0]!.value)
      expect(expirePublicReader).toHaveBeenCalledOnce()

      if (action === 'schedule') {
        const scheduled = await scheduleCall.mock.results[0]!.value
        await runtime.content.claimDuePublication({
          now: scheduled.job.runAt,
          leaseMilliseconds: 30_000,
          workerId: 'test-worker',
        })
        await runtime.content.completeScheduledPublication({
          completedAt: scheduled.job.runAt,
          jobId: scheduled.job.id,
          workerId: 'test-worker',
        })
      }
      const queued = (await runtime.repository.transaction((tx) => tx.listOutboxEvents())).filter(
        (event) => !before.some(({ id }) => id === event.id),
      )
      expect(queued).toHaveLength(action === 'publish' || action === 'schedule' ? 3 : 1)
      for (const event of queued) expect(event.payload.correlationId).toBe(correlationId)
      if (action === 'publish') {
        const retry = await storyAction(
          request('/article-trace/actions', 'POST', body, 'retry-request-0002'),
          context,
        )
        expect(retry.status).toBe(200)
        expectHeaders(retry, 'retry-request-0002')
        expect(await runtime.repository.transaction((tx) => tx.listOutboxEvents())).toEqual([
          ...before,
          ...queued,
        ])
      }
    },
  )

  const handlers = [
    ['list', () => listStories(request(''))],
    [
      'create',
      () => createStory(request('', 'POST', { ...draft, idempotencyKey: 'create-error-trace' })),
    ],
    ['load', () => loadStory(request('/article-trace'), context)],
    [
      'save',
      () =>
        saveStory(
          request('/article-trace', 'PATCH', {
            ...draft,
            expectedVersion: 1,
            idempotencyKey: 'save-error-trace',
          }),
          context,
        ),
    ],
    [
      'action',
      () =>
        storyAction(
          request('/article-trace/actions', 'POST', {
            action: 'delete',
            expectedVersion: 1,
            idempotencyKey: 'delete-error-trace',
          }),
          context,
        ),
    ],
  ] as const

  it.each(handlers)('preserves %s authentication responses', async (_name, run) => {
    vi.mocked(requireOwnerSession).mockRejectedValueOnce(new OwnerAccessError())
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const response = await run()
    expect(response.status).toBe(401)
    expectHeaders(response)
    expect(await response.json()).toEqual({ error: new OwnerAccessError().message })
    expect(logged).not.toHaveBeenCalled()
  })

  it.each(handlers)(
    'logs a contained %s dependency failure once and preserves the safe response',
    async (_name, run) => {
      const privateText = ['synthetic', 'private', 'detail'].join('-')
      vi.mocked(ownerRuntime.getOwnerRuntime).mockImplementationOnce(() => {
        throw Object.assign(new Error(privateText), {
          document: 'private draft',
          email: 'owner@example.test',
          token: randomUUID(),
        })
      })
      const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined)
      const response = await run()
      expect(response.status).toBe(500)
      expectHeaders(response)
      expect(await response.json()).toEqual({
        error: 'Something unexpected happened. Your local recovery copy is still available.',
      })
      expect(logged).toHaveBeenCalledTimes(1)
      expect(logged.mock.calls[0]).toHaveLength(1)
      expect(JSON.parse(String(logged.mock.calls[0]?.[0]))).toMatchObject({
        correlationId,
        level: 'error',
        message: 'request.failed',
        status: 500,
      })
      expect(String(logged.mock.calls[0]?.[0])).not.toMatch(/private draft|owner@example/)
      expect(String(logged.mock.calls[0]?.[0])).not.toContain(privateText)
    },
  )

  it('preserves handled 404, 422, 409 and 503 responses', async () => {
    const missing = await loadStory(request('/article-trace'), context)
    expect(missing.status).toBe(404)
    expectHeaders(missing)
    expect(await missing.json()).toEqual({ error: 'That item could not be found.' })

    const invalid = await createStory(
      request('', 'POST', { ...draft, title: '!', idempotencyKey: 'invalid-title-trace' }),
    )
    expect(invalid.status).toBe(422)
    expectHeaders(invalid)
    expect(await invalid.json()).toEqual({
      error: 'Add a title with at least two letters or numbers.',
    })

    const created = await seedDraft()
    const conflict = await saveStory(
      request('/article-trace', 'PATCH', {
        ...draft,
        expectedVersion: 2,
        idempotencyKey: 'conflict-trace-key',
      }),
      context,
    )
    expect(conflict.status).toBe(409)
    expectHeaders(conflict)
    expect(await conflict.json()).toEqual({
      conflict: { article: created.article, currentRevision: created.revision },
      error: 'This article changed elsewhere. Both versions remain available for recovery.',
    })

    vi.mocked(ownerRuntime.getOwnerRuntime).mockImplementationOnce(() => {
      throw new OwnerConfigurationError('fixture configuration')
    })
    const logged = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const unavailable = await listStories(request(''))
    expect(unavailable.status).toBe(503)
    expectHeaders(unavailable)
    expect(await unavailable.json()).toEqual({
      error: 'The owner workspace is not configured yet.',
    })
    expect(logged).toHaveBeenCalledTimes(1)
  })
})
