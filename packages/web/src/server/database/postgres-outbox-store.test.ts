import type { Pool } from 'pg'
import { describe, expect, it, vi } from 'vitest'

import { OutboxDispatcher } from '../outbox/dispatcher'
import { PostgresContentRepository } from './postgres-content-repository'
import { PostgresOutboxStore } from './postgres-outbox-store'

const now = '2026-11-03T09:00:00.000Z'

const pendingRow = {
  aggregate_id: 'article-outbox',
  attempts: 0,
  created_at: new Date('2026-11-03T08:59:00.000Z'),
  dead_lettered_at: null,
  id: 'outbox-1',
  last_error: null,
  next_attempt_at: null,
  payload: { slug: 'outbox-story' },
  status: 'pending',
  type: 'cache.revalidate',
  updated_at: new Date('2026-11-03T08:59:00.000Z'),
}

/** A pool whose one connection records each query and answers outbox reads with `rows`. */
function recordingPool(rows: readonly object[]) {
  const query = vi.fn(async (text: string, _values?: readonly unknown[]) => {
    const found = text.includes('FROM outbox_events') ? rows : []
    return { rowCount: found.length || 1, rows: found }
  })
  const release = vi.fn()
  const pool = { connect: vi.fn(async () => ({ query, release })) } as unknown as Pool
  return { query, release, store: new PostgresOutboxStore(new PostgresContentRepository(pool)) }
}

describe('PostgreSQL outbox store', () => {
  it('requeues only historical unsupported confirmations in one transaction, retaining their IDs', async () => {
    const query = vi.fn(async (text: string, _values?: readonly unknown[]) => ({
      rows: text.startsWith('UPDATE outbox_events') ? [{ id: 'outbox-b' }, { id: 'outbox-a' }] : [],
    }))
    const release = vi.fn()
    const pool = { connect: async () => ({ query, release }) } as unknown as Pool
    const store = new PostgresOutboxStore(new PostgresContentRepository(pool))
    expect(await store.requeueUnsupportedConfirmations(now)).toEqual(['outbox-a', 'outbox-b'])
    const [sql, values] = query.mock.calls[2] ?? []
    expect(sql).toContain("WHERE status = 'dead_letter' AND type = 'email.subscription-confirm'")
    expect(sql).toContain("AND last_error = 'unsupported event type: email.subscription-confirm'")
    expect(sql).toContain("SET status = 'pending', attempts = 0, last_error = NULL")
    expect(sql).toContain('next_attempt_at = NULL, dead_lettered_at = NULL, updated_at = $1')
    expect(values).toEqual([now])
    expect(query.mock.calls.at(-1)).toEqual(['COMMIT'])
    expect(release).toHaveBeenCalledOnce()
  })

  it('claims the oldest due event with SKIP LOCKED and records it in the same transaction', async () => {
    const { query, release, store } = recordingPool([pendingRow])
    const revalidate = vi.fn(async () => undefined)
    const dispatcher = new OutboxDispatcher({
      clock: { now: () => new Date(now) },
      handlers: new Map([['cache.revalidate', revalidate]]),
      store,
    })

    expect(await dispatcher.dispatchNext()).toMatchObject({
      event: { attempts: 1, id: 'outbox-1', status: 'completed', updatedAt: now },
      outcome: 'completed',
    })
    const statements = query.mock.calls.map(([text, values]) => [text.split('\n', 1)[0], values])
    expect(statements).toEqual([
      ['BEGIN', undefined],
      ['SET CONSTRAINTS ALL DEFERRED', undefined],
      ['SELECT * FROM outbox_events', [now]],
      ['SELECT * FROM outbox_events WHERE id = $1', ['outbox-1']],
      ['INSERT INTO outbox_events', expect.arrayContaining(['outbox-1', 'completed', 1])],
      [
        'UPDATE outbox_events SET next_attempt_at = $2, dead_lettered_at = $3 WHERE id = $1',
        ['outbox-1', null, null],
      ],
      ['COMMIT', undefined],
    ])
    expect(query.mock.calls[2]?.[0]).toMatch(
      /status = 'pending'\s+OR \(status = 'failed' AND \(next_attempt_at IS NULL OR next_attempt_at <= \$1\)\)\s+ORDER BY created_at, id\s+LIMIT 1\s+FOR UPDATE SKIP LOCKED$/,
    )
    expect(revalidate).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'outbox-1', nextAttemptAt: null }),
      expect.objectContaining({ idempotencyKey: 'outbox-1' }),
    )
    expect(release).toHaveBeenCalledOnce()
  })

  it('claims nothing and commits when no event is due', async () => {
    const { query, store } = recordingPool([])

    expect(await store.claimNextDue(now, async () => 'ran')).toEqual({ claimed: false })
    expect(query.mock.calls.at(-1)).toEqual(['COMMIT'])
  })

  it('rolls the claim back when an event would be recorded twice', async () => {
    const { query, store } = recordingPool([
      { ...pendingRow, next_attempt_at: '2026-11-03T08:59:30.000Z', status: 'failed' },
    ])

    await expect(
      store.claimNextDue(now, async (claim) => {
        expect(claim.event.nextAttemptAt).toBe('2026-11-03T08:59:30.000Z')
        await claim.record(async () => undefined)
        await claim.record(async () => undefined)
      }),
    ).rejects.toThrow('Outbox event outbox-1 was already recorded.')
    expect(query.mock.calls.at(-1)).toEqual(['ROLLBACK'])
  })

  it('lists dead letters with the time each was set aside', async () => {
    const { query, store } = recordingPool([
      {
        ...pendingRow,
        dead_lettered_at: new Date(now),
        last_error: 'unsupported event type: cache.revalidate',
        set_aside_at: new Date(now),
        status: 'dead_letter',
      },
    ])

    expect(await store.listDeadLetters()).toEqual([
      {
        aggregateId: 'article-outbox',
        attempts: 0,
        createdAt: '2026-11-03T08:59:00.000Z',
        deadLetteredAt: now,
        id: 'outbox-1',
        lastError: 'unsupported event type: cache.revalidate',
        payload: { slug: 'outbox-story' },
        status: 'dead_letter',
        type: 'cache.revalidate',
        updatedAt: '2026-11-03T08:59:00.000Z',
      },
    ])
    expect(query.mock.calls[2]?.[0]).toContain('coalesce(dead_lettered_at, updated_at)')
  })
})
