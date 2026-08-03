import {
  BodyEditor,
  EditorFields,
  ReadinessList,
  ReaderState,
  revisionLabel,
  SaveState,
  statusLabel,
  StoryCopy,
  StoryImage,
  wordCount,
} from '../view-helpers'
import type { DesignLabDirectionProps } from '../types'

export function FolioDesk({ actions, story }: DesignLabDirectionProps) {
  return (
    <section className="min-h-[calc(100vh-4.75rem)] bg-[#eef1ef] text-[#131619]">
      <header className="grid min-h-20 grid-cols-[1fr_auto] items-center border-b border-black/15 px-6 lg:grid-cols-[1fr_auto_1fr]">
        <div>
          <strong className="block text-lg">North House</strong>
          <span className="text-[0.65rem] text-slate-500">
            Independent magazine of design, place & ritual
          </span>
        </div>
        <nav className="hidden gap-8 text-xs lg:flex">
          <b>Desk</b>
          <span>Stories</span>
          <span>Media</span>
          <span>Release</span>
        </nav>
        <span className="justify-self-end text-xs text-slate-500">{story.saved}</span>
      </header>
      <div className="grid gap-6 p-5 lg:grid-cols-[minmax(15rem,.65fr)_minmax(32rem,2fr)_minmax(14rem,.65fr)] lg:p-8">
        <section className="flex min-h-96 flex-col justify-between py-8">
          <div>
            <p className="design-lab-mono-label">The owner&apos;s folio · Issue 07</p>
            <h1 className="mt-8 text-[clamp(4rem,7vw,8rem)] leading-[.78] tracking-[-.075em]">
              Shape the
              <br />
              <em className="font-normal">next edition.</em>
            </h1>
          </div>
          <button className="design-lab-pill w-fit" onClick={actions.createStory} type="button">
            Begin a story <span>+</span>
          </button>
        </section>
        <article className="grid overflow-hidden rounded-[2rem] bg-white shadow-[0_35px_90px_rgba(20,30,30,.12)] md:grid-cols-[2.5rem_1.1fr_1fr]">
          <div className="flex flex-col items-center justify-between bg-[#244edb] py-5 text-[.6rem] font-bold text-white [writing-mode:vertical-rl]">
            <span>STORY {revisionLabel(story)}</span>
            <b>{statusLabel(story)}</b>
            <span>DESIGN</span>
          </div>
          <StoryImage className="min-h-[26rem]" story={story} />
          <div className="flex min-h-[26rem] flex-col p-8">
            <p className="design-lab-mono-label">{story.saved}</p>
            <h2 className="mt-auto text-5xl leading-[.9] tracking-[-.06em]">{story.title}</h2>
            <div className="my-6 flex gap-4 text-[.65rem] text-slate-500">
              <span>{wordCount(story)} words</span>
              <span>Revision {revisionLabel(story)}</span>
            </div>
            <button
              className="design-lab-pill"
              onClick={() => actions.setView('write')}
              type="button"
            >
              Continue writing ↗
            </button>
          </div>
        </article>
        <aside className="hidden rounded-[2rem] border border-black/10 bg-white/55 p-6 lg:block">
          <p className="design-lab-mono-label">Next release</p>
          <strong className="mt-12 block text-5xl">08:00</strong>
          <span className="text-xs text-slate-500">Sunday · Stockholm</span>
          <div className="mt-16 border-t border-black/10 pt-5 text-sm">
            One protected story is taking form.
          </div>
        </aside>
      </div>
    </section>
  )
}

export function FolioWrite(props: DesignLabDirectionProps) {
  const { actions, story } = props
  return (
    <section className="min-h-[calc(100vh-4.75rem)] bg-[#eef1ef] text-[#131619]">
      <header className="grid min-h-20 grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-black/15 px-5">
        <button className="design-lab-pill" onClick={() => actions.setView('desk')} type="button">
          ← Desk
        </button>
        <div>
          <span className="design-lab-mono-label">
            {statusLabel(story)} / {story.section}
          </span>
          <strong className="block truncate text-sm">{story.title}</strong>
          <SaveState story={story} />
        </div>
        <div className="flex gap-2">
          <button
            className="design-lab-pill hidden sm:block"
            onClick={() => actions.setView('reader')}
            type="button"
          >
            Private preview
          </button>
          <button className="design-lab-primary" onClick={actions.openPublication} type="button">
            Publication check
          </button>
        </div>
      </header>
      <div className="grid gap-6 p-4 lg:grid-cols-[11rem_minmax(32rem,1fr)_19rem] lg:p-8">
        <aside className="hidden py-6 lg:block">
          <p className="design-lab-mono-label">Story folio</p>
          <ol className="mt-8 space-y-6 text-xs">
            <li>01 · Title</li>
            <li className="font-bold text-[#244edb]">02 · Opening</li>
            <li>03 · Rooms facing north</li>
            <li>04 · The blue hour</li>
            <li>05 · Sources</li>
          </ol>
          <div className="mt-20 border-t border-black/15 pt-6">
            <span className="design-lab-mono-label">Revision</span>
            <strong className="block text-5xl font-normal">{revisionLabel(story)}</strong>
          </div>
        </aside>
        <article className="relative overflow-hidden rounded-[2rem] bg-[#fffefa] px-[clamp(1.5rem,6vw,6rem)] py-16 shadow-[0_35px_90px_rgba(20,30,30,.12)] before:absolute before:inset-y-0 before:left-0 before:w-7 before:bg-[#244edb]">
          <div className="mb-10 flex justify-between text-[.6rem] uppercase tracking-[.18em] text-slate-500">
            <span>{story.section}</span>
            <span>Revision {revisionLabel(story)}</span>
          </div>
          <EditorFields {...props} />
          <StoryImage className="mt-10 aspect-[16/10]" story={story} />
          <div className="mt-3 flex justify-between text-[.6rem] text-slate-500">
            <span>{story.imageCaption ?? 'Lead image · add context before publishing'}</span>
            <button className="underline" onClick={actions.openUpload} type="button">
              Edit image
            </button>
          </div>
          <div className="my-10 flex w-fit gap-5 rounded-full border border-black/15 px-5 py-3 text-xs">
            <span>Text</span>
            <b>B</b>
            <i>I</i>
            <span>Quote</span>
            <button onClick={actions.openUpload} type="button">
              + Media
            </button>
          </div>
          <BodyEditor {...props} />
        </article>
        <aside className="rounded-[2rem] border border-black/10 bg-white/65 p-6">
          <div className="flex justify-between">
            <span className="design-lab-mono-label">Publication</span>
            <b className="design-lab-mono-label">{statusLabel(story)}</b>
          </div>
          <h2 className="mt-16 text-4xl leading-[.9] tracking-[-.055em]">
            Your story is ready for final review.
          </h2>
          <p className="mt-4 text-sm text-slate-500">
            Preview, schedule, or publish the exact protected revision.
          </p>
          <ReadinessList story={story} />
          <button
            className="design-lab-pill mt-6 w-full"
            onClick={actions.openUpload}
            type="button"
          >
            {story.mediaId ? 'Replace image' : 'Add image'}
          </button>
          <button
            className="design-lab-primary mt-3 w-full"
            onClick={actions.openPublication}
            type="button"
          >
            Review publication
          </button>
        </aside>
      </div>
    </section>
  )
}

export function FolioReader({ actions, story }: DesignLabDirectionProps) {
  return (
    <section className="min-h-[calc(100vh-4.75rem)] bg-[#f2f3f1] pb-24 text-[#131619]">
      <header className="flex min-h-20 items-center justify-between border-b border-black/15 px-6">
        <strong className="text-xl">North House</strong>
        <span className="design-lab-mono-label">Issue 07 · Sunday edition</span>
      </header>
      <ReaderState story={story} />
      <article className="mx-auto max-w-6xl px-6 py-16">
        <header className="mx-auto max-w-4xl text-center">
          <p className="design-lab-mono-label">{story.section} · 7 min read</p>
          <h1 className="mt-8 text-[clamp(4rem,9vw,9rem)] leading-[.78] tracking-[-.08em]">
            {story.title}
          </h1>
          <p className="mx-auto mt-10 max-w-2xl font-serif text-2xl text-slate-600">{story.dek}</p>
        </header>
        <StoryImage className="mt-16 aspect-[16/10] rounded-[2rem]" story={story} />
        <StoryCopy className="design-lab-reader-copy" story={story} />
      </article>
      <button
        className="design-lab-floating-action"
        onClick={() => actions.setView('write')}
        type="button"
      >
        ← Back to owner studio
      </button>
    </section>
  )
}
