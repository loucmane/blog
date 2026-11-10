import type { OutboxEvent } from '../content/domain'
import type { ContentRepository, ContentTransaction } from '../content/ports'
import type {
  Subscriber,
  SubscriberConsent,
  SubscriptionEvent,
  SubscriptionToken,
  SubscriptionTokenPurpose,
} from './domain'
import type { SubscriptionStore, SubscriptionTransaction } from './ports'

interface State {
  consents: Map<string, SubscriberConsent>
  events: SubscriptionEvent[]
  subscribers: Map<string, Subscriber>
  tokens: Map<string, SubscriptionToken>
}

function emptyState(): State {
  return { consents: new Map(), events: [], subscribers: new Map(), tokens: new Map() }
}

function inOrder<T extends { readonly id: string }>(at: (value: T) => string) {
  return (left: T, right: T) => at(left).localeCompare(at(right)) || left.id.localeCompare(right.id)
}

class InMemorySubscriptionTransaction implements SubscriptionTransaction {
  constructor(
    private readonly state: State,
    readonly content: ContentTransaction,
  ) {}

  async subscriberSummary() {
    const rows = [...this.state.subscribers.values()]
    return {
      confirmed: rows.filter(({ status }) => status === 'confirmed').length,
      pending: rows.filter(({ status }) => status === 'pending').length,
      unsubscribed: rows.filter(({ status }) => status === 'unsubscribed').length,
      newestSubscriptionAt:
        rows
          .map(({ createdAt }) => createdAt)
          .sort()
          .at(-1) ?? null,
    }
  }

  async listSubscribers(): Promise<readonly Subscriber[]> {
    return [...this.state.subscribers.values()].map((subscriber) => ({ ...subscriber }))
  }

  async insertSubscriber(subscriber: Subscriber): Promise<void> {
    if (
      this.state.subscribers.has(subscriber.id) ||
      (subscriber.emailCanonical !== null && this.findByEmail(subscriber.emailCanonical))
    ) {
      throw new Error('That subscriber already exists.')
    }
    this.state.subscribers.set(subscriber.id, { ...subscriber })
  }

  async deleteTokens(subscriberId: string): Promise<void> {
    for (const [hash, token] of this.state.tokens) {
      if (token.subscriberId === subscriberId) this.state.tokens.delete(hash)
    }
  }

  async appendEvent(event: SubscriptionEvent): Promise<void> {
    this.requireSubscriber(event.subscriberId)
    if (this.state.events.some(({ id }) => id === event.id)) {
      throw new Error(`Subscription event ${event.id} already exists.`)
    }
    this.state.events.push({ ...event })
  }

  async claimSubscriberByEmail(candidate: Subscriber & { readonly emailCanonical: string }) {
    const existing = this.findByEmail(candidate.emailCanonical)
    if (existing) return { created: false, subscriber: { ...existing } }
    if (this.state.subscribers.has(candidate.id)) {
      throw new Error(`Subscriber ${candidate.id} already exists.`)
    }
    this.state.subscribers.set(candidate.id, { ...candidate })
    return { created: true, subscriber: { ...candidate } }
  }

  async consumeTokens(
    subscriberId: string,
    purposes: readonly SubscriptionTokenPurpose[],
    consumedAt: string,
  ): Promise<void> {
    for (const [tokenHash, token] of this.state.tokens) {
      if (
        token.subscriberId === subscriberId &&
        purposes.includes(token.purpose) &&
        token.consumedAt === null
      ) {
        this.state.tokens.set(tokenHash, { ...token, consumedAt })
      }
    }
  }

  async getSubscriberByEmail(emailCanonical: string): Promise<Subscriber | null> {
    const found = this.findByEmail(emailCanonical)
    return found ? { ...found } : null
  }

  async getToken(tokenHash: string): Promise<SubscriptionToken | null> {
    const found = this.state.tokens.get(tokenHash)
    return found ? { ...found } : null
  }

  async listConsents(subscriberId?: string): Promise<readonly SubscriberConsent[]> {
    return [...this.state.consents.values()]
      .filter((consent) => subscriberId === undefined || consent.subscriberId === subscriberId)
      .sort(inOrder<SubscriberConsent>(({ grantedAt }) => grantedAt))
      .map((consent) => ({ ...consent }))
  }

  async listEvents(subscriberId?: string): Promise<readonly SubscriptionEvent[]> {
    return this.state.events
      .filter((event) => subscriberId === undefined || event.subscriberId === subscriberId)
      .sort(inOrder<SubscriptionEvent>(({ createdAt }) => createdAt))
      .map((event) => ({ ...event }))
  }

  async lockSubscriber(id: string): Promise<Subscriber | null> {
    const found = this.state.subscribers.get(id)
    return found ? { ...found } : null
  }

  async queueOutboxEvent(event: OutboxEvent): Promise<void> {
    await this.content.saveOutboxEvent(event)
  }

  async saveConsent(consent: SubscriberConsent): Promise<void> {
    this.requireSubscriber(consent.subscriberId)
    if (this.state.consents.has(consent.id)) {
      throw new Error(`Consent ${consent.id} already exists.`)
    }
    this.state.consents.set(consent.id, { ...consent })
  }

  async saveToken(token: SubscriptionToken): Promise<void> {
    this.requireSubscriber(token.subscriberId)
    if (this.state.tokens.has(token.tokenHash)) throw new Error('That token already exists.')
    this.state.tokens.set(token.tokenHash, { ...token })
  }

  async updateSubscriber(subscriber: Subscriber): Promise<void> {
    this.requireSubscriber(subscriber.id)
    this.state.subscribers.set(subscriber.id, { ...subscriber })
  }

  async withdrawConsents(subscriberId: string, withdrawnAt: string): Promise<void> {
    for (const [id, consent] of this.state.consents) {
      if (consent.subscriberId === subscriberId && consent.withdrawnAt === null) {
        this.state.consents.set(id, { ...consent, withdrawnAt })
      }
    }
  }

  private findByEmail(emailCanonical: string): Subscriber | undefined {
    return [...this.state.subscribers.values()].find(
      (subscriber) => subscriber.emailCanonical === emailCanonical,
    )
  }

  private requireSubscriber(id: string) {
    if (!this.state.subscribers.has(id)) throw new Error(`Subscriber ${id} does not exist.`)
  }
}

/**
 * The subscription store test double, and the owner test mode's store. Each transaction runs inside
 * one transaction of the content repository it is given, so a queued outbox event lands in that
 * repository and commits or rolls back with the subscription change. Pair it with the in-memory
 * content repository, which runs one transaction at a time; when the work throws, the subscription
 * records go back to how they were, as the content does.
 */
export class InMemorySubscriptionStore implements SubscriptionStore {
  private state = emptyState()

  constructor(private readonly content: ContentRepository) {}

  async transaction<T>(work: (transaction: SubscriptionTransaction) => Promise<T>): Promise<T> {
    return this.content.transaction(async (content) => {
      const original = structuredClone(this.state)
      try {
        return await work(new InMemorySubscriptionTransaction(this.state, content))
      } catch (error) {
        this.state = original
        throw error
      }
    })
  }
}
