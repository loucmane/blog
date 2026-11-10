import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ requireOwner: vi.fn(), runtime: vi.fn() }))
vi.mock('../owner/session', async (original) => ({
  ...(await original<Record<string, unknown>>()),
  requireOwnerSession: mocks.requireOwner,
}))
vi.mock('./runtime', () => ({ getSubscriptionRuntime: mocks.runtime }))

import { GET } from '@/app/api/owner/subscribers/summary/route'
import { POST as exportSubscriber } from '@/app/api/owner/subscribers/export/route'
import { POST as eraseSubscriber } from '@/app/api/owner/subscribers/erase/route'
import { InMemoryContentRepository } from '../content/in-memory-repository'
import { OwnerAccessError } from '../owner/session'
import { InMemorySubscriptionStore } from './in-memory-store'
import { subscriptionConsent } from './consent'
import { SubscriptionService } from './service'

const origin = 'http://localhost:3100'
const email = 'reader@example.com'
let store: InMemorySubscriptionStore

function request(
  operation: string,
  body: string,
  type = 'application/json',
  requestOrigin = origin,
) {
  return new Request(`${origin}/api/owner/subscribers/${operation}`, {
    method: 'POST',
    body,
    headers: {
      'content-type': type,
      origin: requestOrigin,
      'x-correlation-id': 'privacy-http-0001',
    },
  })
}

beforeEach(async () => {
  vi.stubEnv('MAGAZINE_RUNTIME_SITE_URL', origin)
  vi.spyOn(console, 'log').mockImplementation(() => undefined)
  store = new InMemorySubscriptionStore(new InMemoryContentRepository())
  mocks.runtime.mockReset().mockReturnValue({ store })
  mocks.requireOwner.mockReset().mockResolvedValue({ id: 'owner' })
  await new SubscriptionService(store).subscribe({
    email,
    consentTextVersion: subscriptionConsent.version,
    source: 'subscription-form',
  })
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
})

describe('owner subscriber routes', () => {
  it('requires the owner before any store read or mutation', async () => {
    mocks.requireOwner.mockRejectedValue(new OwnerAccessError())
    for (const response of [
      await GET(new Request(`${origin}/api/owner/subscribers/summary`)),
      await exportSubscriber(request('export', JSON.stringify({ email }))),
      await eraseSubscriber(request('erase', JSON.stringify({ email, confirmation: email }))),
    ]) {
      expect(response.status).toBe(401)
      expect(response.headers.get('cache-control')).toContain('no-store')
    }
    expect(mocks.runtime).not.toHaveBeenCalled()
  })

  it('returns aggregates only and a private download with the request correlation id', async () => {
    const summary = await GET(new Request(`${origin}/api/owner/subscribers/summary`))
    expect(await summary.json()).toMatchObject({ pending: 1, confirmed: 0 })
    const response = await exportSubscriber(request('export', JSON.stringify({ email })))
    expect(response.status).toBe(200)
    expect(response.headers.get('content-disposition')).toContain('attachment')
    expect(response.headers.get('x-correlation-id')).toBe('privacy-http-0001')
    expect(response.headers.get('x-robots-tag')).toContain('noindex')
    expect(response.headers.get('cache-control')).toContain('no-store')
    expect(await response.json()).toMatchObject({
      version: 2,
      data: { subscribers: [{ emailCanonical: email }] },
    })
    expect(console.log).toHaveBeenCalledWith(expect.not.stringContaining(email))
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('privacy-http-0001'))
  })

  it('rejects cross-origin mutations, malformed inputs, duplicates, and oversized streamed forms', async () => {
    for (const operation of [exportSubscriber, eraseSubscriber]) {
      expect(
        (
          await operation(
            request(
              'erase',
              JSON.stringify({ email, confirmation: email }),
              'application/json',
              'https://other.example',
            ),
          )
        ).status,
      ).toBe(401)
    }
    for (const body of ['{', JSON.stringify({ email, unexpected: true })]) {
      expect((await exportSubscriber(request('export', body))).status).toBe(422)
    }
    for (const body of [`email=${email}&email=${email}`, `email=${'a'.repeat(5000)}`]) {
      const response = await exportSubscriber(
        request('export', body, 'application/x-www-form-urlencoded'),
      )
      expect(response.headers.get('location')).toBe('/owner/subscribers?result=invalid-address')
    }
    expect(await store.transaction((tx) => tx.listEvents())).toHaveLength(1)
  })

  it('supports native forms, typed confirmation, and address-free result redirects', async () => {
    const form = (confirmation: string) =>
      request(
        'erase',
        new URLSearchParams({ email, confirmation }).toString(),
        'application/x-www-form-urlencoded',
      )
    expect((await eraseSubscriber(form('other@example.com'))).headers.get('location')).toBe(
      '/owner/subscribers?result=confirmation-mismatch',
    )
    const erased = await eraseSubscriber(form(email))
    expect(erased.status).toBe(303)
    expect(erased.headers.get('location')).toBe('/owner/subscribers?result=erased')
    expect((await eraseSubscriber(form(email))).headers.get('location')).toBe(
      '/owner/subscribers?result=not-found',
    )
    expect(
      (
        await exportSubscriber(
          request(
            'export',
            new URLSearchParams({ email }).toString(),
            'application/x-www-form-urlencoded',
          ),
        )
      ).headers.get('location'),
    ).toBe('/owner/subscribers?result=export-not-found')
  })
})
