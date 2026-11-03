import type { Pool } from 'pg'
import { describe, expect, it, vi } from 'vitest'

import type { Subscriber } from '../subscriptions/domain'
import { PostgresContentRepository } from './postgres-content-repository'
import { PostgresSubscriptionStore } from './postgres-subscriptions'

const at = '2026-11-03T09:00:00.000Z'

const subscriber: Subscriber & { readonly emailCanonical: string } = {
  confirmedAt: null,
  createdAt: at,
  emailCanonical: 'reader@example.com',
  id: 'subscriber-1',
  status: 'pending',
  unsubscribedAt: null,
  updatedAt: at,
}

const subscriberRow = {
  confirmed_at: null,
  created_at: new Date(at),
  email_canonical: 'reader@example.com',
  id: 'subscriber-1',
  status: 'pending',
  unsubscribed_at: null,
  updated_at: at,
}

type Answer = { readonly rowCount?: number; readonly rows?: readonly object[] } | undefined

/** A pool whose one connection records each statement and answers it with `answer`. */
function recordingPool(answer: (text: string) => Answer = () => undefined) {
  const query = vi.fn(async (text: string, _values?: readonly unknown[]) => {
    const result = answer(text)
    return { rowCount: result?.rowCount ?? result?.rows?.length ?? 0, rows: result?.rows ?? [] }
  })
  const release = vi.fn()
  const connect = vi.fn(async () => ({ query, release }))
  const statements = () =>
    query.mock.calls.map(([text, values]) => [text.replace(/\s+/g, ' ').trim(), values])
  return {
    connect,
    release,
    statements,
    store: new PostgresSubscriptionStore(
      new PostgresContentRepository({ connect } as unknown as Pool),
    ),
  }
}

describe('PostgreSQL subscription store', () => {
  it('claims a new address with one insert that takes the row lock', async () => {
    const { release, statements, store } = recordingPool((text) =>
      text.startsWith('INSERT INTO subscribers') ? { rows: [subscriberRow] } : undefined,
    )

    expect(
      await store.transaction((transaction) => transaction.claimSubscriberByEmail(subscriber)),
    ).toEqual({
      created: true,
      subscriber,
    })
    expect(statements()).toEqual([
      ['BEGIN', undefined],
      ['SET CONSTRAINTS ALL DEFERRED', undefined],
      [
        'INSERT INTO subscribers (id, email_canonical, status, created_at, updated_at, confirmed_at, unsubscribed_at) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (email_canonical) DO NOTHING RETURNING *',
        ['subscriber-1', 'reader@example.com', 'pending', at, at, null, null],
      ],
      ['COMMIT', undefined],
    ])
    expect(release).toHaveBeenCalledOnce()
  })

  it('locks the subscriber an address already has', async () => {
    const existing = { ...subscriberRow, confirmed_at: at, status: 'confirmed' }
    const { statements, store } = recordingPool((text) =>
      text.startsWith('SELECT * FROM subscribers') ? { rows: [existing] } : undefined,
    )

    expect(
      await store.transaction((transaction) =>
        transaction.claimSubscriberByEmail({ ...subscriber, id: 'subscriber-unused' }),
      ),
    ).toEqual({
      created: false,
      subscriber: { ...subscriber, confirmedAt: at, status: 'confirmed' },
    })
    expect(statements()[3]).toEqual([
      'SELECT * FROM subscribers WHERE email_canonical = $1 FOR UPDATE',
      ['reader@example.com'],
    ])
  })

  it('gives up and rolls back when the address keeps slipping between insert and read', async () => {
    const { statements, store } = recordingPool()

    await expect(
      store.transaction((transaction) => transaction.claimSubscriberByEmail(subscriber)),
    ).rejects.toThrow('The subscriber for this address kept changing while it was being claimed.')
    const sent = statements().map(([text]) => text)
    expect(sent.filter((text) => String(text).startsWith('INSERT INTO subscribers'))).toHaveLength(
      3,
    )
    expect(sent.at(-1)).toBe('ROLLBACK')
  })

  it('writes the records and queues the outbox event in one transaction on one connection', async () => {
    const { connect, statements, store } = recordingPool((text) =>
      text.startsWith('UPDATE subscribers') ? { rowCount: 1 } : undefined,
    )

    await store.transaction(async (transaction) => {
      await transaction.saveConsent({
        consentTextVersion: 'newsletter-2026-11-03',
        grantedAt: at,
        id: 'consent-1',
        source: 'subscription-form',
        subscriberId: 'subscriber-1',
        withdrawnAt: null,
      })
      await transaction.appendEvent({
        consentId: 'consent-1',
        createdAt: at,
        id: 'event-1',
        subscriberId: 'subscriber-1',
        type: 'confirmation-requested',
      })
      await transaction.queueOutboxEvent({
        aggregateId: 'subscriber-1',
        attempts: 0,
        createdAt: at,
        id: 'outbox-1',
        lastError: null,
        payload: { consentId: 'consent-1', subscriberId: 'subscriber-1' },
        status: 'pending',
        type: 'email.subscription-confirm',
        updatedAt: at,
      })
      await transaction.saveToken({
        consentId: 'consent-1',
        consumedAt: null,
        createdAt: at,
        expiresAt: '2026-11-06T09:00:00.000Z',
        purpose: 'confirm',
        subscriberId: 'subscriber-1',
        tokenHash: 'a'.repeat(64),
      })
      await transaction.updateSubscriber({ ...subscriber, confirmedAt: at, status: 'confirmed' })
      await transaction.consumeTokens('subscriber-1', ['confirm', 'unsubscribe'], at)
      await transaction.withdrawConsents('subscriber-1', at)
    })

    expect(statements().slice(2, -1)).toEqual([
      [
        'INSERT INTO subscriber_consents (id, subscriber_id, consent_text_version, source, granted_at, withdrawn_at) VALUES ($1, $2, $3, $4, $5, $6)',
        ['consent-1', 'subscriber-1', 'newsletter-2026-11-03', 'subscription-form', at, null],
      ],
      [
        'INSERT INTO subscription_events (id, subscriber_id, type, consent_id, created_at) VALUES ($1, $2, $3, $4, $5)',
        ['event-1', 'subscriber-1', 'confirmation-requested', 'consent-1', at],
      ],
      [
        expect.stringMatching(/^INSERT INTO outbox_events /),
        [
          'outbox-1',
          'subscriber-1',
          'email.subscription-confirm',
          { consentId: 'consent-1', subscriberId: 'subscriber-1' },
          'pending',
          0,
          null,
          at,
          at,
        ],
      ],
      [
        'INSERT INTO subscription_tokens (token_hash, subscriber_id, purpose, consent_id, created_at, expires_at, consumed_at) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [
          'a'.repeat(64),
          'subscriber-1',
          'confirm',
          'consent-1',
          at,
          '2026-11-06T09:00:00.000Z',
          null,
        ],
      ],
      [
        'UPDATE subscribers SET status = $2, confirmed_at = $3, unsubscribed_at = $4, updated_at = $5 WHERE id = $1',
        ['subscriber-1', 'confirmed', at, null, at],
      ],
      [
        'UPDATE subscription_tokens SET consumed_at = $3 WHERE subscriber_id = $1 AND purpose = ANY($2::text[]) AND consumed_at IS NULL',
        ['subscriber-1', ['confirm', 'unsubscribe'], at],
      ],
      [
        'UPDATE subscriber_consents SET withdrawn_at = $2 WHERE subscriber_id = $1 AND withdrawn_at IS NULL',
        ['subscriber-1', at],
      ],
    ])
    // One connection, one transaction: the event commits with the records or not at all.
    expect(statements().at(-1)).toEqual(['COMMIT', undefined])
    expect(connect).toHaveBeenCalledOnce()
  })

  it('reads records back with every timestamp as an ISO string', async () => {
    const later = new Date('2026-11-04T09:00:00.000Z')
    const { statements, store } = recordingPool((text) => {
      if (text.startsWith('SELECT * FROM subscription_tokens')) {
        return {
          rows: [
            {
              consent_id: null,
              consumed_at: later,
              created_at: at,
              expires_at: '2027-11-03T10:00:00+01:00',
              purpose: 'unsubscribe',
              subscriber_id: 'subscriber-1',
              token_hash: 'b'.repeat(64),
            },
          ],
        }
      }
      if (text.startsWith('SELECT * FROM subscriber_consents')) {
        return {
          rows: [
            {
              consent_text_version: 'newsletter-2026-11-03',
              granted_at: new Date(at),
              id: 'consent-1',
              source: 'home/footer',
              subscriber_id: 'subscriber-1',
              withdrawn_at: later,
            },
          ],
        }
      }
      if (text.startsWith('SELECT * FROM subscription_events')) {
        return {
          rows: [
            {
              consent_id: null,
              created_at: later,
              id: 'event-2',
              subscriber_id: 'subscriber-1',
              type: 'unsubscribed',
            },
          ],
        }
      }
      if (text.startsWith('SELECT * FROM subscribers')) {
        return { rows: [{ ...subscriberRow, status: 'unsubscribed', unsubscribed_at: later }] }
      }
      return undefined
    })

    const read = await store.transaction(async (transaction) => ({
      byEmail: await transaction.getSubscriberByEmail('reader@example.com'),
      consents: await transaction.listConsents('subscriber-1'),
      events: await transaction.listEvents('subscriber-1'),
      locked: await transaction.lockSubscriber('subscriber-1'),
      token: await transaction.getToken('b'.repeat(64)),
    }))

    const unsubscribed = {
      ...subscriber,
      status: 'unsubscribed',
      unsubscribedAt: later.toISOString(),
    }
    expect(read).toEqual({
      byEmail: unsubscribed,
      consents: [
        {
          consentTextVersion: 'newsletter-2026-11-03',
          grantedAt: at,
          id: 'consent-1',
          source: 'home/footer',
          subscriberId: 'subscriber-1',
          withdrawnAt: later.toISOString(),
        },
      ],
      events: [
        {
          consentId: null,
          createdAt: later.toISOString(),
          id: 'event-2',
          subscriberId: 'subscriber-1',
          type: 'unsubscribed',
        },
      ],
      locked: unsubscribed,
      token: {
        consentId: null,
        consumedAt: later.toISOString(),
        createdAt: at,
        expiresAt: '2027-11-03T09:00:00.000Z',
        purpose: 'unsubscribe',
        subscriberId: 'subscriber-1',
        tokenHash: 'b'.repeat(64),
      },
    })
    expect(statements().slice(2, -1)).toEqual([
      ['SELECT * FROM subscribers WHERE email_canonical = $1', ['reader@example.com']],
      [
        'SELECT * FROM subscriber_consents WHERE subscriber_id = $1 ORDER BY granted_at, id',
        ['subscriber-1'],
      ],
      [
        'SELECT * FROM subscription_events WHERE subscriber_id = $1 ORDER BY created_at, id',
        ['subscriber-1'],
      ],
      ['SELECT * FROM subscribers WHERE id = $1 FOR UPDATE', ['subscriber-1']],
      ['SELECT * FROM subscription_tokens WHERE token_hash = $1', ['b'.repeat(64)]],
    ])
  })

  it('answers null for a subscriber or token it does not have', async () => {
    const { store } = recordingPool()

    expect(
      await store.transaction(async (transaction) => [
        await transaction.getSubscriberByEmail('nobody@example.com'),
        await transaction.lockSubscriber('subscriber-x'),
        await transaction.getToken('c'.repeat(64)),
      ]),
    ).toEqual([null, null, null])
  })

  it('refuses to update a subscriber it does not have, and rolls back', async () => {
    const { statements, store } = recordingPool()

    await expect(
      store.transaction((transaction) => transaction.updateSubscriber(subscriber)),
    ).rejects.toThrow('Subscriber subscriber-1 does not exist.')
    expect(statements().at(-1)).toEqual(['ROLLBACK', undefined])
  })
})
