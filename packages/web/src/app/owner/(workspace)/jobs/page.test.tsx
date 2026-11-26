// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { selectedRuntime, ownerSession } = vi.hoisted(() => ({
  ownerSession: vi.fn(),
  selectedRuntime: vi.fn(),
}))
vi.mock('@/server/owner/runtime', () => ({ getOwnerRuntime: selectedRuntime }))
vi.mock('@/server/owner/session', () => ({ requireOwnerPageSession: ownerSession }))
vi.mock('next/headers', () => ({ headers: async () => new Headers() }))

import { CURRENT_CONTENT_DOCUMENT_VERSION } from '@/server/content/document'
import type { OutboxEvent, PublicationJob } from '@/server/content/domain'
import { InMemoryContentRepository } from '@/server/content/in-memory-repository'
import { ContentService } from '@/server/content/service'
import {
  projectRecoveryView,
  recoveryRunbook,
  type OwnerJobView,
} from '@/server/observability/jobs'
import { unreadableRun, type OperationRun } from '@/server/operations/operation-runs'
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

function emptyView(): OwnerJobView {
  return {
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
    // The in-memory runtime has no database, so no backup or restore drill.
    expect(region('Backups and restore drills')).toHaveTextContent(
      'This site has no database, so there are no backups or restore drills to show.',
    )
  })

  it('shows the last backup and restore drill, the drill’s recovery against target, and a next step when one needs attention', () => {
    const now = new Date('2026-11-23T12:00:00.000Z')
    const backup: OperationRun = {
      failureReason: null,
      finishedAt: '2026-11-23T02:10:00.000Z',
      kind: 'backup',
      outcome: 'succeeded',
      rpoMs: null,
      rtoMs: null,
      startedAt: '2026-11-23T02:00:00.000Z',
    }
    const drill: OperationRun = {
      failureReason: 'rto_exceeded',
      finishedAt: '2026-11-20T15:00:00.000Z',
      kind: 'restore-drill',
      outcome: 'failed',
      rpoMs: 5 * 60 * 60 * 1_000,
      rtoMs: 5 * 60 * 60 * 1_000,
      startedAt: '2026-11-20T10:00:00.000Z',
    }
    const recovery = projectRecoveryView(
      { backup, restoreDrill: drill },
      { formatTime: (instant) => `[${instant}]`, now },
    )

    render(<JobBoard recovery={recovery} timeZone="UTC" view={emptyView()} />)

    const cards = within(region('Backups and restore drills')).getAllByRole('listitem')
    expect(
      cards.map((card) => within(card).getByRole('heading', { level: 3 }).textContent),
    ).toEqual(['Backup', 'Restore drill'])
    const [backupCard, drillCard] = cards as [HTMLElement, HTMLElement]
    expect(backupCard).toHaveTextContent('Up to date')
    // A backup is shown from when it started, the time its age counts from.
    expect(backupCard).toHaveTextContent(
      'The last backup started at [2026-11-23T02:00:00.000Z] and worked.',
    )
    expect(backupCard).not.toHaveTextContent('Next step')
    expect(drillCard).toHaveTextContent('Needs attention')
    expect(drillCard).toHaveTextContent('missed a recovery target')
    expect(within(drillCard).getByText('Recovery point').nextElementSibling).toHaveTextContent(
      'The restored copy was 5 hours old, within the 24-hour target.',
    )
    expect(within(drillCard).getByText('Recovery time').nextElementSibling).toHaveTextContent(
      'The restore took 5 hours, over the 4-hour target.',
    )
    expect(drillCard).toHaveTextContent(`Next step: Ask your maintainer to bring the restore back`)
    expect(drillCard).toHaveTextContent(recoveryRunbook)
    const details = within(drillCard).getByText('Details for a maintainer').closest('details')!
    expect(within(details).getByText('Failure code').nextElementSibling).toHaveTextContent(
      'rto_exceeded',
    )
    expect(within(details).getByText('Recovery time (ms)').nextElementSibling).toHaveTextContent(
      '18000000',
    )
    expect(within(backupCard).getByText('Details for a maintainer')).toBeInTheDocument()
    expect(within(backupCard).queryByText('Recovery time (ms)')).not.toBeInTheDocument()
  })

  it('tells the owner when no backup or restore drill has been recorded yet', () => {
    const recovery = projectRecoveryView(
      { backup: null, restoreDrill: null },
      { formatTime: String, now: new Date('2026-11-23T12:00:00.000Z') },
    )

    render(<JobBoard recovery={recovery} timeZone="UTC" view={emptyView()} />)

    const section = within(region('Backups and restore drills'))
    expect(section.getAllByText('Needs attention')).toHaveLength(2)
    expect(section.getByText('No backup has been recorded yet.')).toBeInTheDocument()
    expect(section.getByText('No restore drill has been recorded yet.')).toBeInTheDocument()
    expect(section.queryByText('Details for a maintainer')).not.toBeInTheDocument()
    expect(section.getAllByText(/^Next step:/)).toHaveLength(2)
  })

  it('tells the owner when the last backup or restore drill cannot be read, and what to do', () => {
    const recovery = projectRecoveryView(
      { backup: unreadableRun, restoreDrill: unreadableRun },
      { formatTime: String, now: new Date('2026-11-23T12:00:00.000Z') },
    )

    render(<JobBoard recovery={recovery} timeZone="UTC" view={emptyView()} />)

    const section = within(region('Backups and restore drills'))
    expect(section.getAllByText('Needs attention')).toHaveLength(2)
    expect(
      section.getByText('The site could not read its record of the last backup.'),
    ).toBeInTheDocument()
    expect(
      section.getByText('The site could not read its record of the last restore drill.'),
    ).toBeInTheDocument()
    expect(section.queryByText('Details for a maintainer')).not.toBeInTheDocument()
    expect(section.queryByText('Recovery point')).not.toBeInTheDocument()
    expect(section.getAllByText(/^Next step:/)).toHaveLength(2)
  })

  it('reads nothing before the owner is signed in', async () => {
    ownerSession.mockRejectedValue(new Error('Sign in to continue to the owner workspace.'))

    await expect(OwnerJobsPage()).rejects.toThrow('Sign in')
    expect(selectedRuntime).not.toHaveBeenCalled()
  })

  it('says when there are no jobs yet, and how many older sent jobs are not listed', () => {
    const empty = emptyView()

    const { unmount } = render(
      <JobBoard recovery={null} timeZone="Europe/Stockholm" view={empty} />,
    )

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
        recovery={null}
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
