import Link from 'next/link'

import { ThemeSwitcher } from '@minniewinnie/ui'

import { listPublishedFrameworkStories } from '@/lib/framework-content'

export default function HomePage() {
  const stories = listPublishedFrameworkStories()

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/95">
        <div className="container mx-auto flex items-center justify-between gap-6 px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold text-primary">Magazine Foundation</h1>
            <p className="text-sm text-muted-foreground">Portable, owner-operated publishing</p>
          </div>
          <ThemeSwitcher />
        </div>
      </header>

      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Framework migration proof
          </p>
          <h2 className="mb-5 text-4xl font-bold text-primary md:text-6xl">
            A stable reader and owner foundation, before the full magazine is built.
          </h2>
          <p className="text-lg text-muted-foreground">
            This deliberately small shell proves the selected rendering, preview, cache, image,
            metadata, accessibility, and portable Node boundaries. Product design and content
            implementation remain separate roadmap tasks.
          </p>
        </div>
      </section>

      <section aria-labelledby="foundation-stories" className="container mx-auto px-4 pb-16">
        <h2 id="foundation-stories" className="mb-6 text-2xl font-semibold text-primary">
          Published framework fixture
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {stories.map((story) => (
            <article className="rounded-lg border border-border bg-card p-6" key={story.slug}>
              <p className="mb-2 text-sm text-muted-foreground">
                {story.section} · {story.readingMinutes} min read
              </p>
              <h3 className="mb-3 text-2xl font-semibold">{story.title}</h3>
              <p className="mb-5 text-muted-foreground">{story.dek}</p>
              <Link
                className="font-semibold text-primary underline-offset-4 hover:underline"
                href={`/stories/${story.slug}`}
              >
                Read the framework story
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
