import { SiteHeader } from './site-header'

/**
 * The home page when no content store is configured. It is the same in every direction, because
 * there is no view to present.
 */
export function ReaderUnavailable() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader isHome navigation={{ sections: [] }} />
      <main className="container mx-auto flex flex-col gap-16 px-4 py-10">
        <section aria-labelledby="reader-unavailable" className="max-w-2xl py-12">
          <h2 className="mb-4 text-3xl font-semibold" id="reader-unavailable">
            Stories are unavailable
          </h2>
          <p className="text-lg text-muted-foreground">
            The magazine cannot reach its stories right now. Please try again later.
          </p>
        </section>
      </main>
    </div>
  )
}
