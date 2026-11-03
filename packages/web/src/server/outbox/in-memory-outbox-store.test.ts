import { describe, expect, it } from 'vitest'

import type { OutboxEvent } from '../content/domain'
import { InMemoryContentRepository } from '../content/in-memory-repository'
import { InMemoryOutboxStore } from './in-memory-outbox-store'

function event(id: string, overrides: Partial<OutboxEvent> = {}): OutboxEvent {
  return {
    aggregateId: 'article-store',
    attempts: 0,
    createdAt: '2026-11-03T08:00:00.000Z',
    id,
    lastError: null,
    payload: {},
    status: 'pending',
    type: 'store.effect',
    updatedAt: '2026-11-03T08:00:00.000Z',
    ...overrides,
  }
}

async function seed(repository: InMemoryContentRepository, events: readonly OutboxEvent[]) {
  await repository.transaction(async (transaction) => {
    for (const stored of events) await transaction.saveOutboxEvent(stored)
  })
}

const now = '2026-11-03T09:00:00.000Z'

describe('in-memory outbox store', () => {
  it('claims nothing when no event is due', async () => {
    const repository = new InMemoryContentRepository()
    await seed(repository, [
      event('outbox-done', { status: 'completed' }),
      event('outbox-dead', { status: 'dead_letter' }),
    ])

    expect(await new InMemoryOutboxStore(repository).claimNextDue(now, async () => 'ran')).toEqual({
      claimed: false,
    })
  })

  it('claims a failed event without a retry time at once, and holds a claimed event from others', async () => {
    const repository = new InMemoryContentRepository()
    const store = new InMemoryOutboxStore(repository)
    await seed(repository, [
      event('outbox-b', { status: 'failed' }),
      event('outbox-a', { createdAt: '2026-11-03T08:30:00.000Z' }),
    ])

    const claims = await store.claimNextDue(now, (first) =>
      store.claimNextDue(now, async (second) => ({
        first: first.event,
        second: second.event.id,
        // Both events are held, so a third claim finds nothing.
        third: await store.claimNextDue(now, async () => 'none left'),
      })),
    )

    expect(claims).toEqual({
      claimed: true,
      value: {
        claimed: true,
        value: {
          first: expect.objectContaining({ id: 'outbox-b', nextAttemptAt: null, status: 'failed' }),
          second: 'outbox-a',
          third: { claimed: false },
        },
      },
    })
  })

  it('records once, and keeps the retry state only when the recording commits', async () => {
    const repository = new InMemoryContentRepository()
    const store = new InMemoryOutboxStore(repository)
    await seed(repository, [event('outbox-retry', { attempts: 1, status: 'failed' })])

    await store.claimNextDue(now, async (claim) => {
      await expect(
        claim.record(async (recording) => {
          await recording.saveRetryState({
            deadLetteredAt: null,
            nextAttemptAt: '2026-11-03T10:00:00.000Z',
          })
          throw new Error('synthetic recording failure')
        }),
      ).rejects.toThrow('synthetic recording failure')
      await expect(claim.record(async () => undefined)).rejects.toThrow(/already recorded/)
    })
    // The rolled-back retry time was not kept, so the event is still due.
    const again = await store.claimNextDue(now, async (claim) => {
      await claim.record((recording) =>
        recording.saveRetryState({
          deadLetteredAt: null,
          nextAttemptAt: '2026-11-03T10:00:00.000Z',
        }),
      )
      return claim.event.nextAttemptAt
    })

    expect(again).toEqual({ claimed: true, value: null })
    expect(await store.claimNextDue(now, async () => 'early')).toEqual({ claimed: false })
    expect(
      await store.claimNextDue(
        '2026-11-03T10:00:00.000Z',
        async (claim) => claim.event.nextAttemptAt,
      ),
    ).toEqual({ claimed: true, value: '2026-11-03T10:00:00.000Z' })
  })

  it('lists dead letters by when they were set aside, standing in the last update for restored ones', async () => {
    const repository = new InMemoryContentRepository()
    const store = new InMemoryOutboxStore(repository)
    await seed(repository, [
      event('outbox-restored', {
        lastError: 'unsupported event type: store.effect',
        status: 'dead_letter',
        updatedAt: '2026-11-03T07:00:00.000Z',
      }),
      event('outbox-recent', { lastError: 'provider refused', status: 'failed' }),
      event('outbox-completed', { status: 'completed' }),
    ])
    await store.claimNextDue(now, (claim) =>
      claim.record(async (recording) => {
        await recording.content.saveOutboxEvent({ ...claim.event, status: 'dead_letter' })
        await recording.saveRetryState({ deadLetteredAt: now, nextAttemptAt: null })
      }),
    )

    expect(
      (await store.listDeadLetters()).map(({ deadLetteredAt, id, lastError }) => ({
        deadLetteredAt,
        id,
        lastError,
      })),
    ).toEqual([
      {
        deadLetteredAt: '2026-11-03T07:00:00.000Z',
        id: 'outbox-restored',
        lastError: 'unsupported event type: store.effect',
      },
      { deadLetteredAt: now, id: 'outbox-recent', lastError: 'provider refused' },
    ])
  })
})
