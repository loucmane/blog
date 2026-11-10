import { describe, expect, it, vi } from 'vitest'

import { runSubscribers } from '../../../scripts/subscribers.mjs'
import { InMemoryContentRepository } from '../content/in-memory-repository'
import { createLogger } from '../observability/logger'
import { InMemorySubscriptionStore } from './in-memory-store'
import { OwnerSubscriberOperations } from './owner-operations'
import { subscriptionConsent } from './consent'
import { SubscriptionService } from './service'

describe('subscriber maintainer command', () => {
  it('uses the shared operations for summary, export and erasure, keeping audit logs off the download', async () => {
    const store = new InMemorySubscriptionStore(new InMemoryContentRepository())
    const email = 'reader@example.com'
    await new SubscriptionService(store).subscribe({
      email,
      consentTextVersion: subscriptionConsent.version,
      source: 'subscription-form',
    })
    const output = vi.fn()
    const error = vi.fn()
    const close = vi.fn(async () => undefined)
    const operations = new OwnerSubscriberOperations(
      store,
      createLogger({ correlationId: 'privacy-cli-test', sink: (line) => error(line) }),
    )
    const connect = async () => ({ operations, close })
    for (const operation of ['summary', 'export', 'erase']) {
      expect(
        await runSubscribers({
          args: [operation],
          input: async () => ({ email, confirmation: email }),
          output,
          error,
          connect,
        }),
      ).toBe(0)
    }
    expect(JSON.parse(output.mock.calls[0]![0])).toMatchObject({ pending: 1 })
    expect(JSON.parse(output.mock.calls[1]![0])).toMatchObject({ version: 2 })
    expect(JSON.parse(output.mock.calls[2]![0])).toEqual({ status: 'erased' })
    expect(error.mock.calls).toHaveLength(2)
    expect(JSON.stringify(error.mock.calls)).not.toContain(email)
    expect(close).toHaveBeenCalledTimes(3)
    expect(
      (await store.transaction((tx) => tx.listEvents())).map(({ type }) => type).sort(),
    ).toEqual(['confirmation-requested', 'erased', 'exported'])
  })

  it('rejects invalid commands before connecting and keeps database failure text private', async () => {
    const connect = vi.fn(async () => {
      throw new Error('private database details')
    })
    const output = vi.fn()
    const error = vi.fn()
    expect(await runSubscribers({ args: ['unknown'], connect, output, error })).toBe(1)
    expect(connect).not.toHaveBeenCalled()
    expect(await runSubscribers({ args: ['summary'], connect, output, error })).toBe(1)
    expect(JSON.stringify(error.mock.calls)).not.toContain('private database details')
  })
})
