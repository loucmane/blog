import type { Article, OutboxEvent, PublicationJob } from '../content/domain'
import type { ContentRepository } from '../content/ports'
import {
  backupFinding,
  recoveryPointMet,
  recoveryTimeMet,
  restoreDrillCadenceMs,
  restoreDrillFinding,
  runAgeMs,
  unreadableRun,
  type BackupFinding,
  type LatestOperationRun,
  type LatestOperationRuns,
  type OperationRun,
  type RecoveryFinding,
} from '../operations/operation-runs'
import { recoveryTargets } from '../operations/restore-drill-contract'
import { retryDueAt } from '../outbox/dispatcher'
import type { DeadLetteredOutboxEvent, OutboxStore } from '../outbox/ports'
import { outboxRetryDelaysMs } from '../outbox/retry'
import type { HealthFinding, HealthReason } from './health'
import { redactText } from './redact'

/** The states an owner sees a job in, the most urgent first (AC-12, US-03). */
export const ownerJobStates = [
  'needs-attention',
  'waiting-to-retry',
  'sending',
  'waiting-to-send',
  'sent',
] as const
export type OwnerJobState = (typeof ownerJobStates)[number]

export const ownerJobStateNames: Readonly<Record<OwnerJobState, string>> = {
  'needs-attention': 'Needs attention',
  sending: 'Sending',
  sent: 'Sent',
  'waiting-to-retry': 'Waiting to retry',
  'waiting-to-send': 'Waiting to send',
}

/** The kind a maintainer sees for a scheduled publication, which is not an outbox event. */
export const scheduledPublicationType = 'publication.scheduled'
const scheduledPublicationTitle = 'Publish on schedule'

/** What each kind of outbox event does, in the owner's words. */
const eventTitles: Readonly<Record<string, string>> = {
  'article.deleted': 'Take a deleted story out of search',
  'article.published': 'Publication follow-up',
  'article.slug-changed': 'Move links to the new address',
  'article.unpublished': 'Take an unpublished story out of search',
  'cache.revalidate': 'Refresh the published pages',
  'search.upsert': 'Update site search',
}
const unknownEventTitle = 'An unfamiliar kind of job'

/** The prefix of the reason the dispatcher records for an event no handler takes. */
const unsupportedTypeReason = 'unsupported event type: '
/** The prefix of the reason the dispatcher records for a handler that ran past its time limit. */
const timedOutReason = 'The handler did not finish within'
/** An event is tried once and then once after each backoff before it is set aside. */
const triesBeforeSetAside = outboxRetryDelaysMs.length + 1

/** How many sent jobs the view lists, the most recent first; the rest are only counted. */
export const defaultListedSentJobs = 25
/** A job still waiting this long after it was due shows the queue is not being worked. */
export const defaultJobBacklogMs = 15 * 60_000

/** The stored fields behind a job, under their stored names, for whoever maintains the site. */
export interface MaintainerJobDetail {
  readonly attempts: number
  readonly createdAt: string
  /** When the dispatcher set the event aside; null for every other job. */
  readonly deadLetteredAt: string | null
  readonly id: string
  /** Redacted, like every log line. */
  readonly lastError: string | null
  /** Until when a publishing worker holds a scheduled publication; null for an outbox event. */
  readonly leaseUntil: string | null
  /** When a failed event is tried again; null when it is not waiting to retry. */
  readonly nextAttemptAt: string | null
  /** When a scheduled publication is due; null for an outbox event. */
  readonly runAt: string | null
  readonly status: string
  readonly storyId: string
  /** The raw event type, or `publication.scheduled`. */
  readonly type: string
  readonly updatedAt: string
}

export interface OwnerJob {
  /** Since when the job has been due, while it waits to be sent or retried; otherwise null. */
  readonly dueAt: string | null
  /** Unique across outbox events and scheduled publications. */
  readonly key: string
  readonly maintainer: MaintainerJobDetail
  readonly state: OwnerJobState
  /** The title of the job's story; null when the story no longer exists. */
  readonly storyTitle: string | null
  /** What happened or will happen, and why when it needs attention, in plain language. */
  readonly summary: string
  /** What the job does, in plain language. */
  readonly title: string
}

export interface OwnerJobView {
  readonly counts: Readonly<Record<OwnerJobState, number>>
  readonly jobs: Readonly<Record<OwnerJobState, readonly OwnerJob[]>>
  /** Sent jobs that are counted but not listed, being older than those listed. */
  readonly unlistedSent: number
}

/** What the job view is projected from, as the content store and the outbox store hold it. */
export interface JobRecords {
  readonly articles: readonly Pick<Article, 'id' | 'title'>[]
  /** The outbox store's dead letters, with the time each was set aside. */
  readonly deadLetters: readonly DeadLetteredOutboxEvent[]
  readonly outboxEvents: readonly OutboxEvent[]
  readonly publicationJobs: readonly PublicationJob[]
}

export interface JobRecordSource {
  read(): Promise<JobRecords>
}

export interface JobViewOptions {
  /** An instant as the owner reads it: their time zone, in words. */
  readonly formatTime: (instant: string) => string
  readonly listedSent?: number
  readonly now: Date
}

/**
 * Reads what the job view needs: articles, outbox events and scheduled publications in one
 * content transaction, and dead letters through the outbox store, which keeps when each was set
 * aside.
 */
export function jobRecordSource(
  repository: ContentRepository,
  outbox: Pick<OutboxStore, 'listDeadLetters'>,
): JobRecordSource {
  return {
    async read() {
      const [content, deadLetters] = await Promise.all([
        repository.transaction(async (transaction) => {
          const [articles, outboxEvents, publicationJobs] = await Promise.all([
            transaction.listArticles(),
            transaction.listOutboxEvents(),
            transaction.listPublicationJobs(),
          ])
          return { articles, outboxEvents, publicationJobs }
        }),
        outbox.listDeadLetters(),
      ])
      return { ...content, deadLetters }
    },
  }
}

/** Formats instants for the owner: day, month, year and time in their time zone. */
export function ownerTimeFormatter(timeZone: string): (instant: string) => string {
  const format = new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone,
  })
  return (instant) => format.format(new Date(instant))
}

function tries(count: number): string {
  return count === 1 ? '1 try' : `${count} tries`
}

function isDue(instant: string | null, now: Date): boolean {
  return instant === null || Date.parse(instant) <= now.valueOf()
}

/**
 * Why a dead letter was set aside, for the owner. The unsupported-type case comes first: retrying
 * it cannot help, so it has had one try.
 */
function setAsideReason(event: OutboxEvent): string {
  const lastError = event.lastError ?? ''
  if (lastError.startsWith(unsupportedTypeReason)) {
    return 'This site does not know how to handle this kind of job yet. Nothing more happens until a maintainer looks at it.'
  }
  const slow = lastError.startsWith(timedOutReason) ? ' The last try took too long.' : ''
  if (event.attempts >= triesBeforeSetAside) {
    return `It still did not work after ${tries(event.attempts)}, so the site stopped trying.${slow} A maintainer can see why in the details.`
  }
  return `It could not be finished, so the site set it aside.${slow} A maintainer can see why in the details.`
}

interface OutboxJobInput {
  readonly deadLetteredAt: string | null
  readonly event: OutboxEvent
}

function outboxJob(
  { deadLetteredAt, event }: OutboxJobInput,
  storyTitle: string | null,
  options: JobViewOptions,
): OwnerJob {
  const nextAttemptAt = retryDueAt(event)
  let state: OwnerJobState
  let summary: string
  let dueAt: string | null = null
  if (event.status === 'dead_letter') {
    state = 'needs-attention'
    summary = setAsideReason(event)
  } else if (event.status === 'failed') {
    state = 'waiting-to-retry'
    dueAt = nextAttemptAt ?? event.updatedAt
    const when = isDue(nextAttemptAt, options.now)
      ? 'It will be tried again the next time the site works through its queue.'
      : `It will be tried again at ${options.formatTime(dueAt)}.`
    summary = `The last try did not work (${tries(event.attempts)} so far). ${when}`
  } else if (event.status === 'pending') {
    state = 'waiting-to-send'
    dueAt = event.createdAt
    summary = `Queued at ${options.formatTime(event.createdAt)}.`
  } else {
    state = 'sent'
    summary = `Done at ${options.formatTime(event.updatedAt)}.`
  }
  return {
    dueAt,
    key: `outbox:${event.id}`,
    maintainer: {
      attempts: event.attempts,
      createdAt: event.createdAt,
      deadLetteredAt: event.status === 'dead_letter' ? (deadLetteredAt ?? event.updatedAt) : null,
      id: event.id,
      lastError: event.lastError === null ? null : redactText(event.lastError),
      leaseUntil: null,
      nextAttemptAt: event.status === 'failed' ? nextAttemptAt : null,
      runAt: null,
      status: event.status,
      storyId: event.aggregateId,
      type: event.type,
      updatedAt: event.updatedAt,
    },
    state,
    storyTitle,
    summary,
    title: eventTitles[event.type] ?? unknownEventTitle,
  }
}

/** A scheduled publication, or null for one that was cancelled or replaced and will never run. */
function publicationJob(
  job: PublicationJob,
  storyTitle: string | null,
  options: JobViewOptions,
): OwnerJob | null {
  let state: OwnerJobState
  let summary: string
  let dueAt: string | null = null
  if (job.status === 'completed') {
    state = 'sent'
    summary = `Published at ${options.formatTime(job.updatedAt)}.`
  } else if (job.status === 'pending') {
    state = 'waiting-to-send'
    dueAt = job.runAt
    summary = isDue(job.runAt, options.now)
      ? `Due since ${options.formatTime(job.runAt)}. It is published the next time the site publishes scheduled stories.`
      : `Scheduled for ${options.formatTime(job.runAt)}.`
  } else if (job.status === 'claimed' && !isDue(job.leaseUntil, options.now)) {
    state = 'sending'
    summary = 'Publishing now.'
  } else if (job.status === 'claimed') {
    // The worker holding it stopped before it finished; the next worker takes it again.
    state = 'waiting-to-retry'
    dueAt = job.leaseUntil ?? job.updatedAt
    summary = `The last try did not finish (${tries(job.attempt)} so far). It will be tried again the next time the site publishes scheduled stories.`
  } else {
    return null
  }
  return {
    dueAt,
    key: `publication:${job.id}`,
    maintainer: {
      attempts: job.attempt,
      createdAt: job.createdAt,
      deadLetteredAt: null,
      id: job.id,
      lastError: null,
      leaseUntil: job.leaseUntil,
      nextAttemptAt: state === 'waiting-to-retry' ? dueAt : null,
      runAt: job.runAt,
      status: job.status,
      storyId: job.articleId,
      type: scheduledPublicationType,
      updatedAt: job.updatedAt,
    },
    state,
    storyTitle,
    summary,
    title: scheduledPublicationTitle,
  }
}

/**
 * The instant a job is ordered by within its state: when it was set aside, when it falls due
 * while it waits, and otherwise when it last changed.
 */
function orderedAt({ dueAt, maintainer }: OwnerJob): string {
  return maintainer.deadLetteredAt ?? dueAt ?? maintainer.updatedAt
}

function byInstant(left: OwnerJob, right: OwnerJob): number {
  return (
    Date.parse(orderedAt(left)) - Date.parse(orderedAt(right)) || left.key.localeCompare(right.key)
  )
}

/**
 * Projects outbox events and scheduled publications into the owner's view (TS-14, AC-12): each job
 * in one of five states, in plain language, with the stored detail a maintainer needs. A dead
 * letter always needs attention, whatever set it aside, including an event of a type the site has
 * no handler for (S2); the maintainer detail then carries its raw type and last error. A dead
 * letter the outbox store reports is shown even when the content read, made a moment apart, still
 * had it as failed. Jobs needing attention are listed in the order they were set aside, waiting
 * jobs in the order they fall due, and sent jobs newest first, the most recent `listedSent` only.
 * Cancelled and replaced schedules are left out: nothing will ever be sent for them.
 */
export function projectJobView(records: JobRecords, options: JobViewOptions): OwnerJobView {
  const titles = new Map(records.articles.map(({ id, title }) => [id, title]))
  const events = new Map<string, OutboxJobInput>(
    records.outboxEvents.map((event) => [event.id, { deadLetteredAt: null, event }]),
  )
  for (const deadLetter of records.deadLetters) {
    events.set(deadLetter.id, { deadLetteredAt: deadLetter.deadLetteredAt, event: deadLetter })
  }
  const all = [
    ...[...events.values()].map((input) =>
      outboxJob(input, titles.get(input.event.aggregateId) ?? null, options),
    ),
    ...records.publicationJobs.flatMap(
      (job) => publicationJob(job, titles.get(job.articleId) ?? null, options) ?? [],
    ),
  ]
  const grouped = Object.fromEntries(
    ownerJobStates.map((state) => [
      state,
      all.filter((job) => job.state === state).sort(byInstant),
    ]),
  ) as Record<OwnerJobState, OwnerJob[]>
  const counts = Object.fromEntries(
    ownerJobStates.map((state) => [state, grouped[state].length]),
  ) as Record<OwnerJobState, number>
  const listedSent = options.listedSent ?? defaultListedSentJobs
  const sent = grouped.sent.reverse()
  return {
    counts,
    jobs: { ...grouped, sent: sent.slice(0, listedSent) },
    unlistedSent: Math.max(sent.length - listedSent, 0),
  }
}

/** The runbook every next step about backups and restore drills points to. */
export const recoveryRunbook = 'docs/deployment/backup-restore.md'

/** A drill's recovery point or time against its target, in plain words. */
export interface OwnerRecoveryMeasurement {
  readonly label: 'Recovery point' | 'Recovery time'
  /** Whether the target was met; null when the drill did not measure it. */
  readonly met: boolean | null
  readonly text: string
}

/**
 * What the owner view says is wrong with a kind's latest run: what the health check finds, or
 * `unavailable` when the run cannot be read back, the reason the check is then down with.
 */
export type OwnerRecoveryFinding = RecoveryFinding | Extract<HealthReason, 'unavailable'>
type OwnerBackupFinding = BackupFinding | Extract<HealthReason, 'unavailable'>

/** The last backup or the last restore drill, as the owner reads it on the job view. */
export interface OwnerRecoveryCheck {
  /** Milliseconds since the last run finished; null when none was recorded or it is unreadable. */
  readonly ageMs: number | null
  /** What is wrong, as the health check reports it; null when nothing is. */
  readonly finding: OwnerRecoveryFinding | null
  /** The stored run, for whoever maintains the site; null when none was recorded or readable. */
  readonly lastRun: OperationRun | null
  /** For a drill that ran: its recovery point and time against their targets. */
  readonly measurements: readonly OwnerRecoveryMeasurement[]
  /** One plain next step, pointing to the runbook, when something is wrong; otherwise null. */
  readonly nextStep: string | null
  /** When the last run finished and whether it worked, in plain language. */
  readonly summary: string
  readonly title: 'Backup' | 'Restore drill'
}

export interface OwnerRecoveryView {
  readonly backup: OwnerRecoveryCheck
  readonly restoreDrill: OwnerRecoveryCheck
}

const hour = 3_600_000
const day = 24 * hour
const recoveryPointHours = recoveryTargets.rpoMilliseconds / hour
const recoveryTimeHours = recoveryTargets.rtoMilliseconds / hour
const drillCadenceDays = restoreDrillCadenceMs / day

function count(value: number, unit: string): string {
  return `${value} ${unit}${value === 1 ? '' : 's'}`
}

/** A duration in the owner's words, to the minute and never rounded up past a target. */
export function ownerDuration(milliseconds: number): string {
  if (milliseconds < 1_000) return 'less than a second'
  const seconds = Math.floor(milliseconds / 1_000)
  if (seconds < 60) return count(seconds, 'second')
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return count(minutes, 'minute')
  const hours = Math.floor(minutes / 60)
  if (hours < 48) {
    return minutes % 60 === 0
      ? count(hours, 'hour')
      : `${count(hours, 'hour')} ${count(minutes % 60, 'minute')}`
  }
  const days = Math.floor(hours / 24)
  return hours % 24 === 0
    ? count(days, 'day')
    : `${count(days, 'day')} ${count(hours % 24, 'hour')}`
}

function measurement(
  label: OwnerRecoveryMeasurement['label'],
  milliseconds: number | null,
  met: boolean | null,
  targetHours: number,
): OwnerRecoveryMeasurement {
  const target = `the ${targetHours}-hour target`
  if (milliseconds === null || met === null) {
    return { label, met: null, text: `Not measured. The target is ${count(targetHours, 'hour')}.` }
  }
  const measured =
    label === 'Recovery point'
      ? `The restored copy was ${ownerDuration(milliseconds)} old`
      : `The restore took ${ownerDuration(milliseconds)}`
  return { label, met, text: `${measured}, ${met ? 'within' : 'over'} ${target}.` }
}

const backupSteps: Readonly<Record<OwnerBackupFinding, string>> = {
  last_run_failed: `Ask your maintainer to find out why the backup failed and run it again, as ${recoveryRunbook} describes.`,
  never_run: `Ask your maintainer to set up the daily backup that ${recoveryRunbook} describes.`,
  stale: `Ask your maintainer to find out why no backup has finished since then and to run one, as ${recoveryRunbook} describes.`,
  unavailable: `Ask your maintainer to find out why the site cannot read its backup records, as ${recoveryRunbook} describes.`,
}

const drillSteps: Readonly<Record<OwnerRecoveryFinding, string>> = {
  last_run_failed: `Ask your maintainer to fix what the drill found and run it again, as “Responding To A Failed Drill” in ${recoveryRunbook} describes.`,
  never_run: `Ask your maintainer to run the restore drill that ${recoveryRunbook} describes.`,
  stale: `Ask your maintainer to run this month’s restore drill, as ${recoveryRunbook} describes.`,
  targets_missed: `Ask your maintainer to bring the restore back within its targets and run the drill again, as ${recoveryRunbook} describes.`,
  unavailable: `Ask your maintainer to find out why the site cannot read its restore-drill records, as ${recoveryRunbook} describes.`,
}

function backupSummary(run: OperationRun | null, finding: OwnerBackupFinding | null, at: string) {
  if (finding === 'unavailable') return 'The site could not read its record of the last backup.'
  if (run === null) return 'No backup has been recorded yet.'
  if (finding === 'last_run_failed') return `The last backup did not work. It stopped at ${at}.`
  if (finding === 'stale') {
    return `The last backup finished at ${at} and worked, but that is more than ${count(recoveryPointHours, 'hour')} ago.`
  }
  return `The last backup finished at ${at} and worked.`
}

function drillSummary(run: OperationRun | null, finding: OwnerRecoveryFinding | null, at: string) {
  if (finding === 'unavailable') {
    return 'The site could not read its record of the last restore drill.'
  }
  if (run === null) return 'No restore drill has been recorded yet.'
  if (finding === 'last_run_failed')
    return `The last restore drill did not work. It stopped at ${at}.`
  if (finding === 'targets_missed') {
    return `The last restore drill finished at ${at} but missed a recovery target.`
  }
  if (finding === 'stale') {
    return `The last restore drill finished at ${at} and worked, but that is more than ${count(drillCadenceDays, 'day')} ago.`
  }
  return `The last restore drill finished at ${at} and worked.`
}

/**
 * The latest backup and restore drill in the owner's words (blog-0046.3): when each last
 * finished, whether it worked, the drill's recovery point and time against their targets, and,
 * for each thing the health check reports as wrong, one plain next step pointing to the runbook.
 * The findings are the health check's own, so the two never disagree: a latest run that cannot be
 * read back is `unavailable`, with nothing shown from it.
 */
export function projectRecoveryView(
  latest: LatestOperationRuns,
  options: JobViewOptions,
): OwnerRecoveryView {
  const readable = (run: LatestOperationRun) => (run === unreadableRun ? null : run)
  const at = (run: OperationRun | null) => (run === null ? '' : options.formatTime(run.finishedAt))
  const backupRun = readable(latest.backup)
  const drillRun = readable(latest.restoreDrill)
  const backup: OwnerBackupFinding | null =
    latest.backup === unreadableRun ? 'unavailable' : backupFinding(backupRun, options.now)
  const drill: OwnerRecoveryFinding | null =
    latest.restoreDrill === unreadableRun
      ? 'unavailable'
      : restoreDrillFinding(drillRun, options.now)
  return {
    backup: {
      ageMs: runAgeMs(backupRun, options.now),
      finding: backup,
      lastRun: backupRun,
      measurements: [],
      nextStep: backup === null ? null : backupSteps[backup],
      summary: backupSummary(backupRun, backup, at(backupRun)),
      title: 'Backup',
    },
    restoreDrill: {
      ageMs: runAgeMs(drillRun, options.now),
      finding: drill,
      lastRun: drillRun,
      measurements:
        drillRun === null
          ? []
          : [
              measurement(
                'Recovery point',
                drillRun.rpoMs,
                recoveryPointMet(drillRun),
                recoveryPointHours,
              ),
              measurement(
                'Recovery time',
                drillRun.rtoMs,
                recoveryTimeMet(drillRun),
                recoveryTimeHours,
              ),
            ],
      nextStep: drill === null ? null : drillSteps[drill],
      summary: drillSummary(drillRun, drill, at(drillRun)),
      title: 'Restore drill',
    },
  }
}

/**
 * What the job queue's health check reports from the view: jobs that need attention, then jobs
 * still waiting `backlogMs` after they fell due, which means nothing is working the queue.
 */
export function jobQueueFinding(
  view: OwnerJobView,
  now: Date,
  backlogMs: number = defaultJobBacklogMs,
): HealthFinding | null {
  if (view.counts['needs-attention'] > 0) return 'needs_attention'
  const waiting = [...view.jobs['waiting-to-retry'], ...view.jobs['waiting-to-send']]
  const stalled = waiting.some(
    ({ dueAt }) => dueAt !== null && Date.parse(dueAt) <= now.valueOf() - backlogMs,
  )
  return stalled ? 'backlog' : null
}
