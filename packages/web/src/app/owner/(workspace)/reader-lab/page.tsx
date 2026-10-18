import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Link from 'next/link'

import { loadHomeView } from '@/reader/cache'
import { readerDirections } from '@/reader-directions/registry'
import { exitReaderLab, openReaderDirection } from '@/reader-lab/actions'
import { readerLabCookieName } from '@/reader-lab/cookie'
import { ReaderLabTour } from '@/reader-lab/lab-tour'
import { requireOwnerPageSession } from '@/server/owner/session'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Reader Lab',
}

const primaryAction =
  'inline-flex min-h-11 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/90'
const secondaryAction =
  'inline-flex min-h-11 items-center rounded-md border border-border bg-card px-4 text-sm font-semibold text-foreground hover:bg-muted'

export default async function ReaderLabPage() {
  await requireOwnerPageSession()
  const cookieStore = await cookies()
  const viewing = readerDirections.find(cookieStore.get(readerLabCookieName)?.value)
  const home = await loadHomeView()
  const latestStory = home.status === 'ready' ? home.view.lead : null
  const { defaultDirection } = readerDirections

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
            Reader Lab
          </p>
          <h1 className="mt-2 text-4xl font-semibold">See your magazine in each direction</h1>
          <p className="mt-3 text-muted-foreground">
            Open the real site in a direction and read your published stories the way readers would.
            Only you see the change, and only while you are signed in. Everyone else keeps seeing{' '}
            {defaultDirection.name}.
          </p>
        </div>
        <nav aria-label="Reader Lab shortcuts" className="flex flex-wrap gap-3">
          <ReaderLabTour />
          <Link className={secondaryAction} href="/owner/stories/new">
            Write a new post
          </Link>
          <Link className={secondaryAction} href="/owner">
            Back to my stories
          </Link>
        </nav>
      </header>

      {viewing ? (
        <section
          aria-label="Your Reader Lab view"
          className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 shadow-sm"
        >
          <p>
            You are viewing the site in <strong className="font-semibold">{viewing.name}</strong>.
          </p>
          <form action={exitReaderLab}>
            <button className={secondaryAction} type="submit">
              Exit lab
            </button>
          </form>
        </section>
      ) : null}

      <p className="mt-10 text-sm text-muted-foreground">
        {latestStory ? (
          <>
            Latest story: <span className="font-semibold text-foreground">{latestStory.title}</span>
          </>
        ) : (
          'No published story yet. Publish one to read it in each direction.'
        )}
      </p>

      <ol aria-label="Directions" className="mt-4 grid gap-4 md:grid-cols-2">
        {readerDirections.directions.map((direction) => (
          <li
            className="flex flex-col rounded-xl border border-border bg-card p-6 shadow-sm data-[active=true]:border-primary"
            data-active={direction.id === viewing?.id ? 'true' : undefined}
            data-reader-direction-card={direction.id}
            key={direction.id}
          >
            <h2 className="text-2xl font-semibold">{direction.name}</h2>
            {direction.id === defaultDirection.id || direction.id === viewing?.id ? (
              <ul aria-label={`About ${direction.name}`} className="mt-2 flex flex-wrap gap-2">
                {direction.id === defaultDirection.id ? (
                  <li className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                    What readers see
                  </li>
                ) : null}
                {direction.id === viewing?.id ? (
                  <li className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                    You are viewing this
                  </li>
                ) : null}
              </ul>
            ) : null}
            <p className="mt-3 flex-1 text-muted-foreground">{direction.thesis}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <form action={openReaderDirection}>
                <input name="direction" type="hidden" value={direction.id} />
                <input name="destination" type="hidden" value="home" />
                <button className={primaryAction} type="submit">
                  View the site in this direction
                  <span className="sr-only">: {direction.name}</span>
                </button>
              </form>
              {latestStory ? (
                <form action={openReaderDirection}>
                  <input name="direction" type="hidden" value={direction.id} />
                  <input name="destination" type="hidden" value="latest-story" />
                  <button className={secondaryAction} type="submit">
                    Open latest story
                    <span className="sr-only"> in {direction.name}</span>
                  </button>
                </form>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}
