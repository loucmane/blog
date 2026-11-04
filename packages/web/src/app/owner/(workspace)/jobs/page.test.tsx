// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { selectedRuntime, ownerSession } = vi.hoisted(() => ({
  ownerSession: vi.fn(),
  selectedRuntime: vi.fn(),
}))
vi.mock('@/server/owner/runtime', () => ({ getOwnerRuntime: selectedRuntime }))
vi.mock('@/server/owner/session', () => ({ requireOwnerPageSession: ownerSession }))

import { CURRENT_CONTENT_DOCUMENT_VERSION } from '@/server/content/document'
import type { OutboxEvent, PublicationJob } from '@/server/content/domain'
import { InMemoryContentRepository } from '@/server/content/in-memory-repository'
import { ContentService } from '@/server/content/service'
import type { OwnerJobView } from '@/server/observability/jobs'
import { OwnerWorkspaceService } from '@/server/owner/workspace'

import { JobBoard } from './job-board'
import OwnerJobsPage from './page'

const minute = 60_000

function from(now: number, minutes: number) {
  return new Date(now + minutes * minute).toISOString()
}

/** A runtime holding one story and a job in each of the five owner states. */
async function runtimeWithJobs() {
  const now = Date.now()
  const repository = new InMemoryContentRepository()
  const content = new ContentService(repository)
  const created = await content.createArticle({
    dek: 'A story with jobs',
    document: {
      articleId: 'article-lantern',
      document: {
        content: [{ content: [{ text: 'Words.', type: 'text' }], type: 'paragraph' }],
        type: 'doc',
      },
      migrationProvenance: [],
      schemaVersion: CURRENT_CONTENT_DOCUMENT_VERSION,
      title: 'The lantern',
    },
    id: 'article-lantern',
    idempotencyKey: 'create-lantern',
    slug: 'the-lantern',
    title: 'The lantern',
  })
  const event = (overrides: Partial<OutboxEvent> & Pick<OutboxEvent, 'id' | 'type'>) => ({
    aggregateId: created.article.id,
    attempts: 0,
    createdAt: from(now, -10),
    lastError: null,
    payload: {},
    status: 'pending' as const,
    updatedAt: from(now, -10),
    ...overrides,
  })
  const job = (overrides: Partial<PublicationJob> & Pick<PublicationJob, 'id' | 'status'>) => ({
    articleId: created.article.id,
    attempt: 0,
    claimedBy: null,
    createdAt: from(now, -60),
    idempotencyKey: `schedule-${overrides.id}`,
    leaseUntil: null,
    previousStatus: 'draft' as const,
    revisionId: created.revision.id,
    runAt: from(now, 120),
    timeZone: 'Europe/Stockholm',
    updatedAt: from(now, -60),
    ...overrides,
  })
  await repository.transaction(async (transaction) => {
    for (const stored of [
      event({
        attempts: 1,
        id: 'outbox-unknown',
        lastError: 'unsupported event type: newsletter.unknown',
        status: 'dead_letter',
        type: 'newsletter.unknown',
      }),
      event({
        attempts: 1,
        id: 'outbox-retrying',
        lastError: 'cache revalidation is unavailable',
        status: 'failed',
        type: 'cache.revalidate',
        updatedAt: from(now, -1),
      }),
      event({ id: 'outbox-queued', type: 'search.upsert' }),
      event({ attempts: 1, id: 'outbox-done', status: 'completed', type: 'article.published' }),
    ]) {
      await transaction.saveOutboxEvent(stored)
    }
    await transaction.savePublicationJob(job({ id: 'job-scheduled', status: 'pending' }))
    await transaction.savePublicationJob(
      job({
        attempt: 1,
        claimedBy: 'worker-1',
        id: 'job-publishing',
        leaseUntil: from(now, 5),
        runAt: from(now, -1),
        status: 'claimed',
      }),
    )
  })
  return { pool: null, repository, workspace: new OwnerWorkspaceService(repository) }
}

function region(name: string) {
  return screen.getByRole('region', { name })
}

afterEach(() => {
  cleanup()
})

describe('owner publishing jobs page', () => {
  it('shows each job in one of five owner states, in plain words, with details for a maintainer (AC-12)', async () => {
    ownerSession.mockResolvedValue({ email: 'owner@example.test', id: 'owner', name: 'Owner' })
    selectedRuntime.mockReturnValue(await runtimeWithJobs())

    render(await OwnerJobsPage())

    expect(screen.getByRole('heading', { level: 1, name: 'Publishing jobs' })).toBeInTheDocument()
    const summary = within(region('Jobs by state'))
    for (const [state, count] of [
      ['Needs attention', '1'],
      ['Waiting to retry', '1'],
      ['Sending', '1'],
      ['Waiting to send', '2'],
      ['Sent', '1'],
    ] as const) {
      const term = summary.getByText(state)
      expect(term.tagName).toBe('DT')
      expect(term.nextElementSibling).toHaveTextContent(count)
    }

    const attention = within(region('Needs attention')).getByRole('listitem')
    expect(attention).toHaveTextContent(
      'This site does not know how to handle this kind of job yet.',
    )
    expect(attention).toHaveTextContent('Story: The lantern')
    const details = within(attention).getByText('Details for a maintainer').closest('details')!
    expect(within(details).getByText('newsletter.unknown')).toBeInTheDocument()
    expect(
      within(details).getByText('unsupported event type: newsletter.unknown'),
    ).toBeInTheDocument()
    expect(within(details).getByText('Attempts').nextElementSibling).toHaveTextContent('1')
    expect(within(details).getByText('Set aside')).toBeInTheDocument()

    const retrying = within(region('Waiting to retry')).getByRole('listitem')
    expect(retrying).toHaveTextContent('The last try did not work (1 try so far).')
    expect(within(retrying).getByText('Next attempt').nextElementSibling?.textContent).toMatch(
      /^\d{4}-\d\d-\d\dT/,
    )
    expect(within(retrying).getByText('cache revalidation is unavailable')).toBeInTheDocument()
    expect(within(region('Sending')).getByRole('listitem')).toHaveTextContent('Publishing now.')
    const waiting = within(region('Waiting to send')).getAllByRole('listitem')
    expect(waiting.map((item) => within(item).getByRole('heading').textContent)).toEqual([
      'Update site search',
      'Publish on schedule',
    ])
    expect(waiting[1]).toHaveTextContent('Scheduled for')
    expect(within(region('Sent')).getByRole('listitem')).toHaveTextContent('Done at')
  })

  it('reads nothing before the owner is signed in', async () => {
    ownerSession.mockRejectedValue(new Error('Sign in to continue to the owner workspace.'))

    await expect(OwnerJobsPage()).rejects.toThrow('Sign in')
    expect(selectedRuntime).not.toHaveBeenCalled()
  })

  it('says when there are no jobs yet, and how many older sent jobs are not listed', () => {
    const empty: OwnerJobView = {
      counts: {
        'needs-attention': 0,
        sending: 0,
        sent: 0,
        'waiting-to-retry': 0,
        'waiting-to-send': 0,
      },
      jobs: {
        'needs-attention': [],
        sending: [],
        sent: [],
        'waiting-to-retry': [],
        'waiting-to-send': [],
      },
      unlistedSent: 0,
    }

    const { unmount } = render(<JobBoard timeZone="Europe/Stockholm" view={empty} />)

    expect(screen.getByRole('heading', { name: 'No jobs yet' })).toBeInTheDocument()
    expect(screen.getByText(/Times are in Europe\/Stockholm/)).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Sent' })).not.toBeInTheDocument()
    unmount()

    const sent = {
      dueAt: null,
      key: 'outbox:outbox-done',
      maintainer: {
        attempts: 1,
        createdAt: '2026-11-03T09:00:00.000Z',
        deadLetteredAt: null,
        id: 'outbox-done',
        lastError: null,
        leaseUntil: null,
        nextAttemptAt: null,
        runAt: null,
        status: 'completed',
        storyId: 'article-gone',
        type: 'search.upsert',
        updatedAt: '2026-11-03T09:01:00.000Z',
      },
      state: 'sent' as const,
      storyTitle: null,
      summary: 'Done at 3 Nov 2026, 10:01.',
      title: 'Update site search',
    }
    render(
      <JobBoard
        timeZone="UTC"
        view={{
          ...empty,
          counts: { ...empty.counts, sent: 3 },
          jobs: { ...empty.jobs, sent: [sent] },
          unlistedSent: 2,
        }}
      />,
    )

    expect(within(region('Sent')).getByRole('listitem')).toHaveTextContent(
      'Its story no longer exists.',
    )
    expect(screen.getByText('2 older sent jobs are not listed.')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'No jobs yet' })).not.toBeInTheDocument()
  })
})
