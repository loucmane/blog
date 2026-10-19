import type { Metadata } from 'next'
import Link from 'next/link'

import { readerDirections } from '@/reader-directions/registry'
import { openComparedDirection } from '@/reader-lab/compare-actions'
import { loadCompareChoices, loadComparePage } from '@/reader-lab/compare-data'
import { CompareFrames } from '@/reader-lab/compare-frames'
import { CompareView } from '@/reader-lab/compare-view'
import { requireOwnerPageSession } from '@/server/owner/session'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Compare Reader Lab directions',
  robots: { index: false, follow: false, noarchive: true },
}

const button =
  'inline-flex min-h-11 items-center justify-center rounded-md border border-border bg-card px-4 py-2 text-sm font-semibold hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring'
const groups = [
  { kind: 'home', label: 'Home', empty: '' },
  { kind: 'section', label: 'Sections', empty: 'No published sections yet' },
  { kind: 'story', label: 'Recent stories', empty: 'No published stories yet' },
  { kind: 'author', label: 'Authors', empty: 'No published author pages yet' },
  { kind: 'topic', label: 'Topics', empty: 'No published topic pages yet' },
] as const

export default async function ComparePage({
  searchParams,
}: {
  readonly searchParams: Promise<{ page?: string | string[] }>
}) {
  await requireOwnerPageSession()
  const requested = (await searchParams).page ?? '/'
  const selected = await loadComparePage(requested)
  const choices = await loadCompareChoices(selected)
  return (
    <div>
      <header className="max-w-3xl">
        <Link className={button} href="/owner/reader-lab">
          Back to Reader Lab
        </Link>
        <p className="mt-6 text-sm font-semibold uppercase tracking-widest text-primary">
          Reader Lab
        </p>
        <h1 className="mt-2 text-4xl font-semibold">Compare your magazine</h1>
        <p className="mt-3 text-muted-foreground">
          The same published page in every direction. These previews are only for you; your stories
          and the site your readers see stay as they are.
        </p>
      </header>
      <form
        action="/owner/reader-lab/compare"
        className="mt-8 flex max-w-3xl flex-wrap items-end gap-3"
        method="get"
      >
        <label className="grid min-w-0 flex-1 gap-2 font-semibold" htmlFor="compare-page">
          Published page
          <select
            className="min-h-11 w-full rounded-md border border-border bg-background px-3 py-2 font-normal"
            defaultValue={selected.status === 'ready' ? selected.path : '/'}
            id="compare-page"
            name="page"
          >
            {groups.map((group) => (
              <optgroup key={group.kind} label={group.label}>
                {choices
                  .filter((choice) => choice.kind === group.kind)
                  .map((choice) => (
                    <option key={choice.path} value={choice.path}>
                      {choice.title}
                    </option>
                  ))}
                {!choices.some((choice) => choice.kind === group.kind) ? (
                  <option disabled value={`unavailable-${group.kind}`}>
                    {group.empty}
                  </option>
                ) : null}
              </optgroup>
            ))}
          </select>
        </label>
        <button className={button} type="submit">
          Compare page
        </button>
      </form>
      <details className="mt-4 max-w-3xl">
        <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold">
          Choose another published page by its path
        </summary>
        <form
          action="/owner/reader-lab/compare"
          className="flex flex-wrap items-end gap-3"
          method="get"
        >
          <label className="grid min-w-0 flex-1 gap-2 text-sm" htmlFor="compare-path">
            Page path
            <input
              aria-describedby="compare-path-help"
              className="min-h-11 rounded-md border border-border bg-background px-3"
              id="compare-path"
              name="page"
              placeholder="/stories/your-story"
              required
              type="text"
            />
          </label>
          <button className={button} type="submit">
            Compare path
          </button>
        </form>
        <p className="mt-2 text-sm text-muted-foreground" id="compare-path-help">
          Use / for home, or a published /sections/, /stories/, /authors/ or /topics/ path. The
          picker lists recent stories and their authors and topics.
        </p>
      </details>
      {selected.status === 'ready' ? (
        <>
          <p className="mt-6 text-sm">
            Comparing: <strong>{selected.title}</strong>{' '}
            <span className="break-all text-muted-foreground">({selected.path})</span>
          </p>
          <CompareFrames
            key={selected.path}
            items={readerDirections.directions.map((direction) => ({
              id: direction.id,
              name: direction.name,
              thesis: direction.thesis,
              content: <CompareView direction={direction} page={selected.page} />,
              open: (
                <form action={openComparedDirection}>
                  <input name="direction" type="hidden" value={direction.id} />
                  <input name="page" type="hidden" value={selected.path} />
                  <button className={button} type="submit">
                    Open in Reader Lab
                    <span className="sr-only">
                      : {direction.name}, {selected.title}
                    </span>
                  </button>
                </form>
              ),
            }))}
          />
        </>
      ) : (
        <p className="mt-8 rounded-lg border border-border bg-card p-4" role="status">
          {selected.status === 'unavailable'
            ? 'Published pages are unavailable right now. Try again later.'
            : selected.status === 'invalid'
              ? 'Choose a published page path from this magazine, without a query or fragment.'
              : 'This page is not currently published. Choose another page to compare.'}
        </p>
      )}
    </div>
  )
}
