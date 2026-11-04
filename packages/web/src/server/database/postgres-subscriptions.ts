import type { QueryResultRow } from 'pg'

import type { OutboxEvent } from '../content/domain'
import type { ContentTransaction } from '../content/ports'
import type {
  Subscriber,
  SubscriberConsent,
  SubscriptionEvent,
  SubscriptionToken,
  SubscriptionTokenPurpose,
} from '../subscriptions/domain'
import type { SubscriptionStore, SubscriptionTransaction } from '../subscriptions/ports'
import type { PostgresQueries } from './exclusive-postgres-session'
import type { PostgresContentRepository } from './postgres-content-repository'

/**
 * The columns of the tables of migration 0008, in the order this adapter writes them. The
 * migration test holds the migration to exactly these.
 */
export const subscriptionTableColumns = {
  subscriber_consents: [
    'id',
    'subscriber_id',
    'consent_text_version',
    'source',
    'granted_at',
    'withdrawn_at',
  ],
  subscribers: [
    'id',
    'email_canonical',
    'status',
    'created_at',
    'updated_at',
    'confirmed_at',
    'unsubscribed_at',
  ],
  subscription_events: ['id', 'subscriber_id', 'type', 'consent_id', 'created_at'],
  subscription_tokens: [
    'token_hash',
    'subscriber_id',
    'purpose',
    'consent_id',
    'created_at',
    'expires_at',
    'consumed_at',
  ],
} as const

type SubscriptionTable = keyof typeof subscriptionTableColumns

function insert(table: SubscriptionTable): string {
  const columns = subscriptionTableColumns[table]
  const values = columns.map((_column, index) => `$${index + 1}`)
  return `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')})`
}

type Timestamp = Date | string

interface SubscriberRow extends QueryResultRow {
  confirmed_at: Timestamp | null
  created_at: Timestamp
  email_canonical: string | null
  id: string
  status: Subscriber['status']
  unsubscribed_at: Timestamp | null
  updated_at: Timestamp
}

interface ConsentRow extends QueryResultRow {
  consent_text_version: string
  granted_at: Timestamp
  id: string
  source: string
  subscriber_id: string
  withdrawn_at: Timestamp | null
}

interface EventRow extends QueryResultRow {
  consent_id: string | null
  created_at: Timestamp
  id: string
  subscriber_id: string
  type: SubscriptionEvent['type']
}

interface TokenRow extends QueryResultRow {
  consent_id: string | null
  consumed_at: Timestamp | null
  created_at: Timestamp
  expires_at: Timestamp
  purpose: SubscriptionTokenPurpose
  subscriber_id: string
  token_hash: string
}

function iso(value: Timestamp): string {
  return new Date(value).toISOString()
}

function nullableIso(value: Timestamp | null): string | null {
  return value === null ? null : iso(value)
}

function mapSubscriber(row: SubscriberRow): Subscriber {
  return {
    confirmedAt: nullableIso(row.confirmed_at),
    createdAt: iso(row.created_at),
    emailCanonical: row.email_canonical,
    id: row.id,
    status: row.status,
    unsubscribedAt: nullableIso(row.unsubscribed_at),
    updatedAt: iso(row.updated_at),
  }
}

function mapConsent(row: ConsentRow): SubscriberConsent {
  return {
    consentTextVersion: row.consent_text_version,
    grantedAt: iso(row.granted_at),
    id: row.id,
    source: row.source,
    subscriberId: row.subscriber_id,
    withdrawnAt: nullableIso(row.withdrawn_at),
  }
}

function mapEvent(row: EventRow): SubscriptionEvent {
  return {
    consentId: row.consent_id,
    createdAt: iso(row.created_at),
    id: row.id,
    subscriberId: row.subscriber_id,
    type: row.type,
  }
}

function mapToken(row: TokenRow): SubscriptionToken {
  return {
    consentId: row.consent_id,
    consumedAt: nullableIso(row.consumed_at),
    createdAt: iso(row.created_at),
    expiresAt: iso(row.expires_at),
    purpose: row.purpose,
    subscriberId: row.subscriber_id,
    tokenHash: row.token_hash,
  }
}

// A claim retries when the address's subscriber vanished between the insert and the read, which
// only an erasure (blog-0045.12) committing in that moment can cause.
const claimAttempts = 3

class PostgresSubscriptionTransaction implements SubscriptionTransaction {
  constructor(
    private readonly connection: PostgresQueries,
    private readonly content: ContentTransaction,
  ) {}

  async appendEvent(event: SubscriptionEvent): Promise<void> {
    await this.connection.query(insert('subscription_events'), [
      event.id,
      event.subscriberId,
      event.type,
      event.consentId,
      event.createdAt,
    ])
  }

  /**
   * Inserts the candidate unless its address is taken. A concurrent insert of the same address
   * makes this one wait for that transaction; once it commits, the existing row is read and
   * locked instead. Either way the transaction leaves holding the subscriber's row lock.
   */
  async claimSubscriberByEmail(candidate: Subscriber & { readonly emailCanonical: string }) {
    for (let attempt = 0; attempt < claimAttempts; attempt += 1) {
      const inserted = await this.connection.query<SubscriberRow>(
        `${insert('subscribers')} ON CONFLICT (email_canonical) DO NOTHING RETURNING *`,
        [
          candidate.id,
          candidate.emailCanonical,
          candidate.status,
          candidate.createdAt,
          candidate.updatedAt,
          candidate.confirmedAt,
          candidate.unsubscribedAt,
        ],
      )
      if (inserted.rows[0]) return { created: true, subscriber: mapSubscriber(inserted.rows[0]) }
      const existing = await this.connection.query<SubscriberRow>(
        'SELECT * FROM subscribers WHERE email_canonical = $1 FOR UPDATE',
        [candidate.emailCanonical],
      )
      if (existing.rows[0]) return { created: false, subscriber: mapSubscriber(existing.rows[0]) }
    }
    throw new Error('The subscriber for this address kept changing while it was being claimed.')
  }

  async consumeTokens(
    subscriberId: string,
    purposes: readonly SubscriptionTokenPurpose[],
    consumedAt: string,
  ): Promise<void> {
    await this.connection.query(
      `UPDATE subscription_tokens SET consumed_at = $3
       WHERE subscriber_id = $1 AND purpose = ANY($2::text[]) AND consumed_at IS NULL`,
      [subscriberId, [...purposes], consumedAt],
    )
  }

  async getSubscriberByEmail(emailCanonical: string): Promise<Subscriber | null> {
    const row = (
      await this.connection.query<SubscriberRow>(
        'SELECT * FROM subscribers WHERE email_canonical = $1',
        [emailCanonical],
      )
    ).rows[0]
    return row ? mapSubscriber(row) : null
  }

  async getToken(tokenHash: string): Promise<SubscriptionToken | null> {
    const row = (
      await this.connection.query<TokenRow>(
        'SELECT * FROM subscription_tokens WHERE token_hash = $1',
        [tokenHash],
      )
    ).rows[0]
    return row ? mapToken(row) : null
  }

  async listConsents(subscriberId: string): Promise<readonly SubscriberConsent[]> {
    const result = await this.connection.query<ConsentRow>(
      'SELECT * FROM subscriber_consents WHERE subscriber_id = $1 ORDER BY granted_at, id',
      [subscriberId],
    )
    return result.rows.map(mapConsent)
  }

  async listEvents(subscriberId: string): Promise<readonly SubscriptionEvent[]> {
    const result = await this.connection.query<EventRow>(
      'SELECT * FROM subscription_events WHERE subscriber_id = $1 ORDER BY created_at, id',
      [subscriberId],
    )
    return result.rows.map(mapEvent)
  }

  async lockSubscriber(id: string): Promise<Subscriber | null> {
    const row = (
      await this.connection.query<SubscriberRow>(
        'SELECT * FROM subscribers WHERE id = $1 FOR UPDATE',
        [id],
      )
    ).rows[0]
    return row ? mapSubscriber(row) : null
  }

  async queueOutboxEvent(event: OutboxEvent): Promise<void> {
    await this.content.saveOutboxEvent(event)
  }

  async saveConsent(consent: SubscriberConsent): Promise<void> {
    await this.connection.query(insert('subscriber_consents'), [
      consent.id,
      consent.subscriberId,
      consent.consentTextVersion,
      consent.source,
      consent.grantedAt,
      consent.withdrawnAt,
    ])
  }

  async saveToken(token: SubscriptionToken): Promise<void> {
    await this.connection.query(insert('subscription_tokens'), [
      token.tokenHash,
      token.subscriberId,
      token.purpose,
      token.consentId,
      token.createdAt,
      token.expiresAt,
      token.consumedAt,
    ])
  }

  async updateSubscriber(subscriber: Subscriber): Promise<void> {
    const result = await this.connection.query(
      `UPDATE subscribers
       SET status = $2, confirmed_at = $3, unsubscribed_at = $4, updated_at = $5
       WHERE id = $1`,
      [
        subscriber.id,
        subscriber.status,
        subscriber.confirmedAt,
        subscriber.unsubscribedAt,
        subscriber.updatedAt,
      ],
    )
    if (result.rowCount !== 1) throw new Error(`Subscriber ${subscriber.id} does not exist.`)
  }

  async withdrawConsents(subscriberId: string, withdrawnAt: string): Promise<void> {
    await this.connection.query(
      `UPDATE subscriber_consents SET withdrawn_at = $2
       WHERE subscriber_id = $1 AND withdrawn_at IS NULL`,
      [subscriberId, withdrawnAt],
    )
  }
}

/**
 * The subscription store on PostgreSQL. A transaction is one of the content repository's, on its
 * connection, so the confirmation email queued through the outbox commits with the subscriber and
 * consent that asked for it.
 */
export class PostgresSubscriptionStore implements SubscriptionStore {
  constructor(private readonly repository: PostgresContentRepository) {}

  transaction<T>(work: (transaction: SubscriptionTransaction) => Promise<T>): Promise<T> {
    return this.repository.transactionOnConnection((content, connection) =>
      work(new PostgresSubscriptionTransaction(connection, content)),
    )
  }
}
