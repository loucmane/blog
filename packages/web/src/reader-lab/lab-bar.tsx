import { ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react'
import Link from 'next/link'

import { exitReaderLab, switchReaderDirection } from './actions'
import { ReaderLabBarHelp } from './lab-bar-help'
import type { ReaderLabState } from './presentation'

const control =
  'inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-colors hover:bg-background/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-background'

/**
 * The owner's Reader Lab controls on reader pages. The bar floats at the bottom of the screen and
 * the page reserves room for it, so it never moves the layout. Only the signed-in owner gets it.
 *
 * In print the bar shrinks to nothing instead of using `display: none`: a control that stops
 * rendering loses keyboard focus, so after a print preview Enter would no longer reach it.
 */
export function ReaderLabBar({ lab }: { readonly lab: ReaderLabState }) {
  return (
    <section
      aria-label="Reader Lab"
      className="fixed inset-x-3 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 mx-auto max-w-2xl rounded-2xl border border-transparent bg-foreground text-background shadow-lg print:size-0 print:overflow-hidden print:border-0 print:shadow-none"
      data-reader-lab-bar=""
    >
      <ReaderLabBarHelp />
      <div className="flex items-center gap-1 p-1.5">
        <form action={switchReaderDirection}>
          <input name="direction" type="hidden" value={lab.previous.id} />
          <button className={control} type="submit">
            <ChevronLeft aria-hidden="true" className="size-5" />
            <span className="sr-only sm:not-sr-only">Previous</span>
            <span className="sr-only"> direction: {lab.previous.name}</span>
          </button>
        </form>
        <p className="min-w-0 flex-1 px-2 text-center" role="status">
          <span className="block truncate text-xs font-medium text-muted">
            Reader Lab · {lab.position} of {lab.total}
          </span>
          <span className="block truncate font-semibold">{lab.direction.name}</span>
        </p>
        <form action={switchReaderDirection}>
          <input name="direction" type="hidden" value={lab.next.id} />
          <button className={control} type="submit">
            <span className="sr-only sm:not-sr-only">Next</span>
            <span className="sr-only"> direction: {lab.next.name}</span>
            <ChevronRight aria-hidden="true" className="size-5" />
          </button>
        </form>
        <Link className={control} href="/owner/reader-lab" prefetch={false}>
          <LayoutGrid aria-hidden="true" className="size-4" />
          <span className="sr-only sm:not-sr-only">All directions</span>
        </Link>
        <form action={exitReaderLab}>
          <button className={control} type="submit">
            Exit<span className="sr-only sm:not-sr-only"> lab</span>
          </button>
        </form>
      </div>
    </section>
  )
}
