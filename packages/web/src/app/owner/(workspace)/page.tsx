import Link from 'next/link'

import { getOwnerRuntime } from '@/server/owner/runtime'
import { requireOwnerPageSession } from '@/server/owner/session'

export const dynamic = 'force-dynamic'

export default async function OwnerDashboardPage() {
  await requireOwnerPageSession()
  const stories = await getOwnerRuntime().workspace.listStories()
  const active = stories.filter(({ deletedAt }) => deletedAt === null)
  const deleted = stories.filter(({ deletedAt }) => deletedAt !== null)

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Your magazine
          </p>
          <h1 className="mt-2 text-4xl font-semibold">Stories</h1>
          <p className="mt-2 text-muted-foreground">
            Draft, schedule, publish, and recover stories without technical tools.
          </p>
        </div>
        <Link
          className="flex min-h-12 items-center rounded-md bg-primary px-5 font-semibold text-primary-foreground"
          href="/owner/stories/new"
        >
          Write a new story
        </Link>
      </div>

      {active.length > 0 ? (
        <ul className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {active.map((story) => (
            <li className="rounded-xl border border-border bg-card p-5 shadow-sm" key={story.id}>
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-2xl font-semibold">{story.title}</h2>
                <span className="rounded-full bg-muted px-2 py-1 text-xs font-semibold uppercase tracking-wide">
                  {story.status}
                </span>
              </div>
              <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">
                {story.dek || 'No summary yet.'}
              </p>
              <p className="mt-4 text-xs text-muted-foreground">
                Updated {new Date(story.updatedAt).toLocaleString()}
              </p>
              <Link
                className="mt-4 inline-flex min-h-11 items-center font-semibold text-primary underline-offset-4 hover:underline"
                href={`/owner/stories/${story.id}`}
              >
                Open story
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <section className="mt-8 rounded-xl border border-dashed border-border bg-card p-8 text-center">
          <h2 className="text-2xl font-semibold">Your first story starts here</h2>
          <p className="mt-2 text-muted-foreground">
            The workspace will save a local recovery copy while you write.
          </p>
        </section>
      )}

      {deleted.length > 0 ? (
        <section className="mt-10" aria-labelledby="deleted-stories">
          <h2 className="text-2xl font-semibold" id="deleted-stories">
            Deleted stories
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">These remain recoverable.</p>
          <ul className="mt-4 divide-y divide-border rounded-xl border border-border bg-card">
            {deleted.map((story) => (
              <li className="flex flex-wrap items-center justify-between gap-3 p-4" key={story.id}>
                <span>{story.title}</span>
                <Link
                  className="min-h-11 px-3 py-3 font-semibold text-primary"
                  href={`/owner/stories/${story.id}`}
                >
                  Review and restore
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
