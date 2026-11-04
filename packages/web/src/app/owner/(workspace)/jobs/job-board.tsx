import { cn } from '@/lib/utils'
import {
  ownerJobStateNames,
  ownerJobStates,
  type OwnerJob,
  type OwnerJobState,
  type OwnerJobView,
} from '@/server/observability/jobs'

const stateDescriptions: Readonly<Record<OwnerJobState, string>> = {
  'needs-attention': 'The site has stopped trying these. Each says why; a maintainer can fix them.',
  sending: 'The site is working on these right now.',
  sent: 'Finished. The most recent are listed first.',
  'waiting-to-retry': 'The last try did not work. The site tries again on its own.',
  'waiting-to-send': 'Queued, or scheduled for later.',
}

function MaintainerDetails({ job }: { readonly job: OwnerJob }) {
  const { maintainer } = job
  const rows: (readonly [string, string])[] = [
    ['Job', maintainer.id],
    ['Type', maintainer.type],
    ['Stored status', maintainer.status],
    ['Story', maintainer.storyId],
    ['Attempts', String(maintainer.attempts)],
    ['Last error', maintainer.lastError ?? 'None'],
    ['Next attempt', maintainer.nextAttemptAt ?? 'None'],
  ]
  if (maintainer.deadLetteredAt) rows.push(['Set aside', maintainer.deadLetteredAt])
  if (maintainer.runAt) rows.push(['Due to run', maintainer.runAt])
  if (maintainer.leaseUntil) rows.push(['Held until', maintainer.leaseUntil])
  rows.push(['Created', maintainer.createdAt], ['Updated', maintainer.updatedAt])
  return (
    <details className="mt-4 rounded-lg border border-border">
      <summary className="min-h-11 cursor-pointer px-3 py-3 text-sm font-semibold">
        Details for a maintainer
      </summary>
      <dl className="grid gap-x-4 gap-y-1 border-t border-border p-3 text-sm sm:grid-cols-[max-content_minmax(0,1fr)]">
        {rows.map(([term, value]) => (
          <div className="contents" key={term}>
            <dt className="font-semibold">{term}</dt>
            <dd className="mb-2 break-all font-mono text-xs leading-5 sm:mb-0">{value}</dd>
          </div>
        ))}
      </dl>
    </details>
  )
}

function JobCard({ job }: { readonly job: OwnerJob }) {
  return (
    <li
      className={cn(
        'rounded-xl border border-border bg-card p-5 shadow-sm',
        job.state === 'needs-attention' && 'border-destructive/50',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-lg font-semibold">{job.title}</h3>
        <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold uppercase tracking-wide">
          {ownerJobStateNames[job.state]}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">
        {job.storyTitle === null ? (
          'Its story no longer exists.'
        ) : (
          <>
            Story: <span className="font-semibold text-foreground">{job.storyTitle}</span>
          </>
        )}
      </p>
      <p className="mt-3">{job.summary}</p>
      <MaintainerDetails job={job} />
    </li>
  )
}

/**
 * The owner's publishing jobs: how many are in each of the five states, then the jobs of each
 * state that has any, the most urgent state first. Each job says in plain language what it does
 * and what became of it, and opens onto the stored detail a maintainer needs.
 */
export function JobBoard({
  timeZone,
  view,
}: {
  readonly timeZone: string
  readonly view: OwnerJobView
}) {
  const total = ownerJobStates.reduce((sum, state) => sum + view.counts[state], 0)
  return (
    <div className="mx-auto max-w-6xl">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
        Your magazine
      </p>
      <h1 className="mt-2 text-4xl font-semibold">Publishing jobs</h1>
      <p className="mt-2 max-w-3xl text-muted-foreground">
        What the site does after you publish or schedule a story: updating search, refreshing pages,
        and publishing on schedule. Times are in {timeZone}.
      </p>

      <section aria-labelledby="jobs-by-state" className="mt-8">
        <h2 className="sr-only" id="jobs-by-state">
          Jobs by state
        </h2>
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {ownerJobStates.map((state) => (
            <div
              className={cn(
                'rounded-xl border border-border bg-card p-4 shadow-sm',
                state === 'needs-attention' &&
                  view.counts[state] > 0 &&
                  'border-destructive/50 bg-destructive/5',
              )}
              key={state}
            >
              <dt className="text-sm font-semibold text-muted-foreground">
                {ownerJobStateNames[state]}
              </dt>
              <dd className="mt-1 text-3xl font-semibold">{view.counts[state]}</dd>
            </div>
          ))}
        </dl>
      </section>

      {total === 0 ? (
        <section className="mt-8 rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <h2 className="text-2xl font-semibold">No jobs yet</h2>
          <p className="mt-2 text-muted-foreground">
            Publish or schedule a story, and the work the site does for it appears here.
          </p>
        </section>
      ) : null}

      {ownerJobStates.map((state) =>
        view.jobs[state].length > 0 ? (
          <section aria-labelledby={`jobs-${state}`} className="mt-10" key={state}>
            <h2 className="text-2xl font-semibold" id={`jobs-${state}`}>
              {ownerJobStateNames[state]}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{stateDescriptions[state]}</p>
            <ul className="mt-4 grid gap-4 lg:grid-cols-2">
              {view.jobs[state].map((job) => (
                <JobCard job={job} key={job.key} />
              ))}
            </ul>
            {state === 'sent' && view.unlistedSent > 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                {view.unlistedSent === 1
                  ? '1 older sent job is not listed.'
                  : `${view.unlistedSent} older sent jobs are not listed.`}
              </p>
            ) : null}
          </section>
        ) : null,
      )}

      <p className="mt-10 text-sm text-muted-foreground">
        Cancelled and replaced schedules are not listed: nothing is sent for them.
      </p>
    </div>
  )
}
