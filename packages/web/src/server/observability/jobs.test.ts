import { describe, expect, it } from 'vitest'

import type { OutboxEvent, PublicationJob } from '../content/domain'
import { InMemoryContentRepository } from '../content/in-memory-repository'
import type { Clock } from '../content/ports'
import { OutboxDispatcher } from '../outbox/dispatcher'
import { InMemoryOutboxStore } from '../outbox/in-memory-outbox-store'
import type { OutboxHandler } from '../outbox/ports'
import { outboxRetryDelaysMs } from '../outbox/retry'
import {
  defaultJobBacklogMs,
  defaultListedSentJobs,
  jobQueueFinding,
  jobRecordSource,
  ownerJobStateNames,
  ownerJobStates,
  ownerTimeFormatter,
  projectJobView,
  type JobRecords,
  type OwnerJobState,
} from './jobs'
import { createLogger } from './logger'
import { redactedEmail, redactedSecret } from './redact'

const now = new Date('2026-11-03T12:00:00.000Z')
const minute = 60_000

function at(minutesFromNow: number): string {
  return new Date(now.valueOf() + minutesFromNow * minute).toISOString()
}

function event(overrides: Partial<OutboxEvent> & Pick<OutboxEvent, 'id' | 'type'>): OutboxEvent {
  return {
    aggregateId: 'article-lantern',
    attempts: 0,
    createdAt: at(-30),
    lastError: null,
    payload: {},
    status: 'pending',
    updatedAt: at(-30),
    ...overrides,
  }
}

function job(overrides: Partial<PublicationJob> & Pick<PublicationJob, 'id' | 'status'>) {
  const publication: PublicationJob = {
    articleId: 'article-lantern',
    attempt: 0,
    claimedBy: null,
    createdAt: at(-120),
    idempotencyKey: `schedule-${overrides.id}`,
    leaseUntil: null,
    previousStatus: 'draft',
    revisionId: 'revision-1',
    runAt: at(60),
    timeZone: 'Europe/Stockholm',
    updatedAt: at(-120),
    ...overrides,
  }
  return publication
}

function records(overrides: Partial<JobRecords> = {}): JobRecords {
  return {
    articles: [{ id: 'article-lantern', title: 'The lantern' }],
    deadLetters: [],
    outboxEvents: [],
    publicationJobs: [],
    ...overrides,
  }
}

const options = { formatTime: (instant: string) => `<${instant}>`, now }

function titles(view: ReturnType<typeof projectJobView>, state: OwnerJobState) {
  return view.jobs[state].map(({ maintainer, summary, title }) => ({
    id: maintainer.id,
    summary,
    title,
  }))
}

describe('owner job view', () => {
  it('shows each job in one of five owner states, in plain words, with the detail a maintainer needs (AC-12)', () => {
    const view = projectJobView(
      records({
        outboxEvents: [
          event({ id: 'outbox-queued', type: 'search.upsert' }),
          event({
            attempts: 2,
            id: 'outbox-retrying',
            lastError: 'cache revalidation is unavailable',
            status: 'failed',
            type: 'cache.revalidate',
            updatedAt: at(-2),
          }),
          event({
            attempts: 1,
            id: 'outbox-done',
            status: 'completed',
            type: 'article.published',
            updatedAt: at(-29),
          }),
        ],
        publicationJobs: [
          job({ id: 'job-scheduled', status: 'pending' }),
          job({
            attempt: 1,
            claimedBy: 'worker-1',
            id: 'job-publishing',
            leaseUntil: at(1),
            runAt: at(-1),
            status: 'claimed',
          }),
          job({
            attempt: 1,
            claimedBy: 'worker-0',
            id: 'job-stalled',
            leaseUntil: at(-5),
            runAt: at(-10),
            status: 'claimed',
          }),
          job({ id: 'job-published', runAt: at(-60), status: 'completed', updatedAt: at(-59) }),
          job({ id: 'job-cancelled', status: 'cancelled' }),
          job({ id: 'job-superseded', status: 'superseded' }),
        ],
      }),
      options,
    )

    expect(ownerJobStates.map((state) => ownerJobStateNames[state])).toEqual([
      'Needs attention',
      'Waiting to retry',
      'Sending',
      'Waiting to send',
      'Sent',
    ])
    expect(view.counts).toEqual({
      'needs-attention': 0,
      sending: 1,
      sent: 2,
      'waiting-to-retry': 2,
      'waiting-to-send': 2,
    })
    expect(titles(view, 'waiting-to-retry')).toEqual([
      {
        id: 'job-stalled',
        summary:
          'The last try did not finish (1 try so far). It will be tried again the next time the site publishes scheduled stories.',
        title: 'Publish on schedule',
      },
      {
        id: 'outbox-retrying',
        summary: `The last try did not work (2 tries so far). It will be tried again at <${at(3)}>.`,
        title: 'Refresh the published pages',
      },
    ])
    expect(titles(view, 'sending')).toEqual([
      { id: 'job-publishing', summary: 'Publishing now.', title: 'Publish on schedule' },
    ])
    expect(titles(view, 'waiting-to-send')).toEqual([
      { id: 'outbox-queued', summary: `Queued at <${at(-30)}>.`, title: 'Update site search' },
      { id: 'job-scheduled', summary: `Scheduled for <${at(60)}>.`, title: 'Publish on schedule' },
    ])
    expect(titles(view, 'sent')).toEqual([
      { id: 'outbox-done', summary: `Done at <${at(-29)}>.`, title: 'Publication follow-up' },
      { id: 'job-published', summary: `Published at <${at(-59)}>.`, title: 'Publish on schedule' },
    ])
    expect(view.jobs['waiting-to-retry'][1]).toMatchObject({
      dueAt: at(3),
      key: 'outbox:outbox-retrying',
      maintainer: {
        attempts: 2,
        deadLetteredAt: null,
        lastError: 'cache revalidation is unavailable',
        nextAttemptAt: at(3),
        status: 'failed',
        storyId: 'article-lantern',
        type: 'cache.revalidate',
      },
      storyTitle: 'The lantern',
    })
    expect(view.jobs.sending[0]?.maintainer).toMatchObject({
      leaseUntil: at(1),
      nextAttemptAt: null,
      runAt: at(-1),
      status: 'claimed',
      type: 'publication.scheduled',
    })
    expect(view.jobs['waiting-to-retry'][0]?.maintainer.nextAttemptAt).toBe(at(-5))
    // Cancelled and replaced schedules will never send anything, so they are not jobs to watch.
    const listed = ownerJobStates.flatMap((state) => view.jobs[state].map(({ key }) => key))
    expect(listed).not.toContain('publication:job-cancelled')
    expect(listed).not.toContain('publication:job-superseded')
  })

  it('shows every dead letter as needing attention with a plain reason, an unsupported type too (S2)', async () => {
    let instant = now
    const clock: Clock = { now: () => instant }
    const repository = new InMemoryContentRepository()
    const store = new InMemoryOutboxStore(repository)
    const failing: OutboxHandler = async () => {
      throw new Error('The handler did not finish within 30000 ms.')
    }
    const dispatcher = new OutboxDispatcher({
      clock,
      handlers: new Map([
        ['email.issue', failing],
        ['search.upsert', async () => undefined],
      ]),
      logger: createLogger({ correlationId: 'jobs-test-0001', sink: () => undefined }),
      store,
    })
    await repository.transaction(async (transaction) => {
      for (const seeded of [
        event({ createdAt: at(-3), id: 'outbox-unknown', type: 'newsletter.unknown' }),
        event({ createdAt: at(-2), id: 'outbox-email', type: 'email.issue' }),
        event({ createdAt: at(-1), id: 'outbox-search', type: 'search.upsert' }),
      ]) {
        await transaction.saveOutboxEvent(seeded)
      }
    })

    // The unsupported type is set aside at once and the rest of the batch still runs; the failing
    // event is retried after each backoff until its retries are spent.
    expect(await dispatcher.drain()).toEqual({
      completed: ['outbox-search'],
      deadLettered: ['outbox-unknown'],
      retrying: ['outbox-email'],
    })
    for (const delay of outboxRetryDelaysMs) {
      instant = new Date(instant.valueOf() + delay)
      await dispatcher.drain()
    }
    const view = projectJobView(await jobRecordSource(repository, store).read(), {
      ...options,
      now: instant,
    })

    expect(view.counts['needs-attention']).toBe(2)
    expect(
      view.jobs['needs-attention'].map(({ maintainer, summary, title }) => ({
        attempts: maintainer.attempts,
        lastError: maintainer.lastError,
        summary,
        title,
        type: maintainer.type,
      })),
    ).toEqual([
      {
        attempts: 1,
        lastError: 'unsupported event type: newsletter.unknown',
        summary:
          'This site does not know how to handle this kind of job yet. Nothing more happens until a maintainer looks at it.',
        title: 'An unfamiliar kind of job',
        type: 'newsletter.unknown',
      },
      {
        attempts: 6,
        lastError: 'The handler did not finish within 30000 ms.',
        summary:
          'It still did not work after 6 tries, so the site stopped trying. The last try took too long. A maintainer can see why in the details.',
        title: 'An unfamiliar kind of job',
        type: 'email.issue',
      },
    ])
    expect(view.jobs['needs-attention'][0]?.maintainer.deadLetteredAt).toBe(now.toISOString())
    expect(view.jobs.sent.map(({ maintainer }) => maintainer.id)).toEqual(['outbox-search'])
    expect(jobQueueFinding(view, instant)).toBe('needs_attention')
  })

  it('shows a dead letter the outbox store reports even when the content read still had it as failed', () => {
    const failed = event({
      attempts: 6,
      id: 'outbox-raced',
      lastError: 'provider refused the request',
      status: 'failed',
      type: 'email.issue',
      updatedAt: at(-1),
    })

    const view = projectJobView(
      records({
        deadLetters: [{ ...failed, deadLetteredAt: at(-1), status: 'dead_letter' }],
        outboxEvents: [failed],
      }),
      options,
    )

    expect(view.counts).toMatchObject({ 'needs-attention': 1, 'waiting-to-retry': 0 })
    expect(view.jobs['needs-attention'][0]).toMatchObject({
      maintainer: { deadLetteredAt: at(-1), status: 'dead_letter' },
      summary:
        'It still did not work after 6 tries, so the site stopped trying. A maintainer can see why in the details.',
    })
  })

  it('shows the next try the dispatcher scheduled, and a due retry as due now', async () => {
    const repository = new InMemoryContentRepository()
    const store = new InMemoryOutboxStore(repository)
    const dispatcher = new OutboxDispatcher({
      clock: { now: () => now },
      handlers: new Map([
        [
          'email.issue',
          async () => {
            throw new Error('provider refused the request')
          },
        ],
      ]),
      logger: createLogger({ correlationId: 'jobs-test-0002', sink: () => undefined }),
      store,
    })
    await repository.transaction((transaction) =>
      transaction.saveOutboxEvent(event({ id: 'outbox-email', type: 'email.issue' })),
    )

    const dispatched = await dispatcher.dispatchNext()
    const stored = await jobRecordSource(repository, store).read()
    const scheduled = projectJobView(stored, options).jobs['waiting-to-retry'][0]
    const later = projectJobView(stored, { ...options, now: new Date(now.valueOf() + 2 * minute) })

    expect(dispatched).toMatchObject({ nextAttemptAt: at(1), outcome: 'retrying' })
    expect(scheduled?.maintainer.nextAttemptAt).toBe(at(1))
    expect(scheduled?.summary).toBe(
      `The last try did not work (1 try so far). It will be tried again at <${at(1)}>.`,
    )
    expect(later.jobs['waiting-to-retry'][0]?.summary).toBe(
      'The last try did not work (1 try so far). It will be tried again the next time the site works through its queue.',
    )
  })

  it('shows a restored event by what it still holds, with no retry state behind it', () => {
    const view = projectJobView(
      records({
        outboxEvents: [
          event({
            attempts: 6,
            id: 'outbox-spent',
            lastError: 'provider refused the request',
            status: 'failed',
            type: 'email.issue',
            updatedAt: at(-40),
          }),
          event({
            attempts: 2,
            id: 'outbox-set-aside',
            status: 'dead_letter',
            type: 'x.y',
            updatedAt: at(-50),
          }),
        ],
      }),
      options,
    )

    // The dispatcher takes a failed event without a next attempt at once, and sets it aside if it fails again.
    expect(view.jobs['waiting-to-retry'][0]).toMatchObject({
      dueAt: at(-40),
      maintainer: { nextAttemptAt: null },
      summary:
        'The last try did not work (6 tries so far). It will be tried again the next time the site works through its queue.',
    })
    // A dead letter restored from an export was set aside when it was last updated.
    expect(view.jobs['needs-attention'][0]?.maintainer.deadLetteredAt).toBe(at(-50))
  })

  it('orders jobs that fall due at the same instant by their key', () => {
    const view = projectJobView(
      records({
        outboxEvents: [
          event({ id: 'outbox-b', type: 'search.upsert' }),
          event({ id: 'outbox-a', type: 'cache.revalidate' }),
        ],
      }),
      options,
    )

    expect(view.jobs['waiting-to-send'].map(({ key }) => key)).toEqual([
      'outbox:outbox-a',
      'outbox:outbox-b',
    ])
  })

  it('names a set-aside event that had retries left plainly, and jobs whose story is gone', () => {
    const view = projectJobView(
      records({
        articles: [],
        publicationJobs: [job({ articleId: 'article-gone', id: 'job-orphan', status: 'pending' })],
        deadLetters: [
          {
            ...event({
              attempts: 2,
              id: 'outbox-restored',
              status: 'dead_letter',
              type: 'cache.revalidate',
            }),
            deadLetteredAt: at(-20),
          },
        ],
      }),
      options,
    )

    expect(view.jobs['needs-attention'][0]).toMatchObject({
      storyTitle: null,
      summary:
        'It could not be finished, so the site set it aside. A maintainer can see why in the details.',
      title: 'Refresh the published pages',
    })
    expect(view.jobs['waiting-to-send'][0]).toMatchObject({
      maintainer: { storyId: 'article-gone' },
      storyTitle: null,
      title: 'Publish on schedule',
    })
  })

  it('redacts the last error a maintainer sees', () => {
    const view = projectJobView(
      records({
        outboxEvents: [
          event({
            attempts: 1,
            id: 'outbox-leaky',
            lastError:
              'provider rejected owner@magazine.example with token=tok_live_123 at https://media.example/a.jpg?X-Amz-Signature=abc',
            status: 'failed',
            type: 'email.issue',
          }),
        ],
      }),
      options,
    )

    expect(view.jobs['waiting-to-retry'][0]?.maintainer.lastError).toBe(
      `provider rejected ${redactedEmail} with token=${redactedSecret} at https://media.example/a.jpg?[redacted]`,
    )
  })

  it('lists sent jobs newest first, as many as asked, and counts the rest', () => {
    const sent = Array.from({ length: 4 }, (_, index) =>
      event({
        attempts: 1,
        id: `outbox-sent-${index}`,
        status: 'completed',
        type: 'search.upsert',
        updatedAt: at(-10 + index),
      }),
    )

    const view = projectJobView(records({ outboxEvents: sent }), { ...options, listedSent: 2 })
    const unbounded = projectJobView(records({ outboxEvents: sent }), options)

    expect(view.counts.sent).toBe(4)
    expect(view.jobs.sent.map(({ maintainer }) => maintainer.id)).toEqual([
      'outbox-sent-3',
      'outbox-sent-2',
    ])
    expect(view.unlistedSent).toBe(2)
    expect(unbounded.unlistedSent).toBe(0)
    expect(defaultListedSentJobs).toBe(25)
  })

  it('tells the job-queue health check about jobs that need attention or wait too long', () => {
    const fresh = projectJobView(
      records({
        outboxEvents: [event({ createdAt: at(-14), id: 'outbox-fresh', type: 'search.upsert' })],
      }),
      options,
    )
    const stalled = projectJobView(
      records({
        outboxEvents: [event({ createdAt: at(-16), id: 'outbox-old', type: 'search.upsert' })],
      }),
      options,
    )
    const overdueRetry = projectJobView(
      records({
        outboxEvents: [
          event({
            attempts: 1,
            id: 'outbox-retry',
            status: 'failed',
            type: 'x',
            updatedAt: at(-17),
          }),
        ],
      }),
      options,
    )
    const scheduled = projectJobView(
      records({ publicationJobs: [job({ id: 'job', status: 'pending' })] }),
      options,
    )

    expect(defaultJobBacklogMs).toBe(15 * minute)
    expect(jobQueueFinding(fresh, now)).toBeNull()
    expect(jobQueueFinding(stalled, now)).toBe('backlog')
    // Its retry fell due a minute after it failed, sixteen minutes ago.
    expect(jobQueueFinding(overdueRetry, now)).toBe('backlog')
    expect(jobQueueFinding(scheduled, now)).toBeNull()
    expect(jobQueueFinding(stalled, now, 20 * minute)).toBeNull()
  })

  it('says a scheduled publication is overdue once its time has passed, and the queue is stalled', () => {
    const view = projectJobView(
      records({
        publicationJobs: [
          job({ id: 'job-overdue', runAt: at(-20), status: 'pending' }),
          job({ id: 'job-unleased', leaseUntil: null, status: 'claimed', updatedAt: at(-3) }),
        ],
      }),
      options,
    )

    expect(view.jobs['waiting-to-send'][0]).toMatchObject({
      dueAt: at(-20),
      summary: `Due since <${at(-20)}>. It is published the next time the site publishes scheduled stories.`,
    })
    // A claim without a lease cannot be held, so the next worker takes it again.
    expect(view.jobs['waiting-to-retry'][0]).toMatchObject({
      dueAt: at(-3),
      maintainer: { id: 'job-unleased', nextAttemptAt: at(-3) },
    })
    expect(jobQueueFinding(view, now)).toBe('backlog')
  })

  it('formats times for the owner in their time zone', () => {
    expect(ownerTimeFormatter('Europe/Stockholm')('2026-11-03T09:00:00.000Z')).toBe(
      '3 Nov 2026, 10:00',
    )
    expect(ownerTimeFormatter('UTC')('2026-11-03T09:00:00.000Z')).toBe('3 Nov 2026, 09:00')
  })
})
