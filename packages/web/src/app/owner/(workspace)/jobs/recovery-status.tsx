import { cn } from '@/lib/utils'
import type { OwnerRecoveryCheck, OwnerRecoveryView } from '@/server/observability/jobs'

function RunDetails({ run }: { readonly run: NonNullable<OwnerRecoveryCheck['lastRun']> }) {
  const rows: (readonly [string, string])[] = [
    ['Kind', run.kind],
    ['Outcome', run.outcome],
    ['Failure code', run.failureReason ?? 'None'],
    ['Started', run.startedAt],
    ['Finished', run.finishedAt],
  ]
  if (run.kind === 'restore-drill') {
    rows.push(
      ['Recovery point (ms)', run.rpoMs === null ? 'Not measured' : String(run.rpoMs)],
      ['Recovery time (ms)', run.rtoMs === null ? 'Not measured' : String(run.rtoMs)],
    )
  }
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

function RecoveryCard({ check }: { readonly check: OwnerRecoveryCheck }) {
  return (
    <li
      className={cn(
        'rounded-xl border border-border bg-card p-5 shadow-sm',
        check.finding !== null && 'border-destructive/50',
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="text-lg font-semibold">{check.title}</h3>
        <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold uppercase tracking-wide">
          {check.finding === null ? 'Up to date' : 'Needs attention'}
        </span>
      </div>
      <p className="mt-3">{check.summary}</p>
      {check.measurements.length > 0 ? (
        <dl className="mt-3 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-[max-content_minmax(0,1fr)]">
          {check.measurements.map(({ label, text }) => (
            <div className="contents" key={label}>
              <dt className="font-semibold">{label}</dt>
              <dd className="mb-2 sm:mb-0">{text}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {check.nextStep === null ? null : (
        <p className="mt-3">
          <span className="font-semibold">Next step:</span> {check.nextStep}
        </p>
      )}
      {check.lastRun === null ? null : <RunDetails run={check.lastRun} />}
    </li>
  )
}

/**
 * The last backup and the last restore drill: when each finished and whether it worked, the
 * drill's recovery point and time against their targets, and one plain next step for each that
 * needs attention. A site without a database has neither to show.
 */
export function RecoveryStatus({ recovery }: { readonly recovery: OwnerRecoveryView | null }) {
  return (
    <section aria-labelledby="backups-and-drills" className="mt-10">
      <h2 className="text-2xl font-semibold" id="backups-and-drills">
        Backups and restore drills
      </h2>
      <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
        A maintainer should back up the site’s database every day and rehearse restoring it every
        month. This shows how the last ones went.
      </p>
      {recovery === null ? (
        <p className="mt-4 rounded-xl border border-dashed border-border bg-card p-5">
          This site has no database, so there are no backups or restore drills to show.
        </p>
      ) : (
        <ul className="mt-4 grid gap-4 lg:grid-cols-2">
          <RecoveryCard check={recovery.backup} />
          <RecoveryCard check={recovery.restoreDrill} />
        </ul>
      )}
    </section>
  )
}
