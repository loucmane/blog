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
} from '../view-helpers'
import type { DesignLabDirectionProps } from '../types'

const darkButton =
  'rounded-full border border-white/20 bg-white/10 px-5 py-3 text-xs font-bold text-white backdrop-blur-xl hover:bg-white/20'

export function HaloDesk({ actions, story }: DesignLabDirectionProps) {
  return (
    <section className="design-lab-halo relative min-h-[calc(100vh-4.75rem)] overflow-hidden text-[#eef4ff]">
      <div className="design-lab-orbit design-lab-orbit-one" />
      <div className="design-lab-orbit design-lab-orbit-two" />
      <header className="relative z-10 flex min-h-20 items-center justify-between border-b border-white/15 px-6">
        <div>
          <b className="mr-3 grid size-10 place-items-center rounded-full border border-white/30">
            NH
          </b>
          <span className="text-xs">North House</span>
        </div>
        <span className="text-xs text-blue-100">● All work safe</span>
      </header>
      <div className="relative z-10 grid min-h-[46rem] items-center gap-10 px-6 py-12 lg:grid-cols-[.75fr_1.25fr] lg:px-[6vw]">
        <section>
          <p className="design-lab-mono-label text-blue-200">Issue 07 · Sunday 08:00</p>
          <h1 className="mt-8 text-[clamp(4rem,8vw,9rem)] leading-[.78] tracking-[-.08em]">
            One edition.
            <br />
            <em className="font-normal text-[#aebdff]">A clear orbit.</em>
          </h1>
          <p className="mt-8 max-w-sm text-blue-100/70">
            Writing is moving. Nothing needs recovery.
          </p>
          <button className={`${darkButton} mt-10`} onClick={actions.createStory} type="button">
            Start a story +
          </button>
        </section>
        <article className="relative mx-auto w-full max-w-3xl rounded-[3rem] border border-white/15 bg-white/10 p-4 shadow-[0_60px_140px_rgba(0,0,0,.45)] backdrop-blur-2xl">
          <div className="absolute -right-8 -top-8 grid size-32 place-items-center rounded-full border border-white/30 bg-[#27367e]/80 text-2xl shadow-[0_0_90px_rgba(126,146,255,.55)]">
            {story.mediaId ? '100%' : '80%'}
          </div>
          <StoryImage className="aspect-[16/11] rounded-[2.2rem]" story={story} />
          <div className="p-7">
            <p className="design-lab-mono-label text-blue-200">
              {statusLabel(story)} · {story.saved}
            </p>
            <h2 className="mt-5 text-5xl leading-[.9] tracking-[-.06em]">{story.title}</h2>
            <button
              className={`${darkButton} mt-8`}
              onClick={() => actions.setView('write')}
              type="button"
            >
              Continue writing ↗
            </button>
          </div>
        </article>
      </div>
    </section>
  )
}

export function HaloWrite(props: DesignLabDirectionProps) {
  const { actions, story } = props
  return (
    <section className="design-lab-halo min-h-[calc(100vh-4.75rem)] text-[#eef4ff]">
      <header className="grid min-h-20 grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-white/15 px-5">
        <button className={darkButton} onClick={() => actions.setView('desk')} type="button">
          ← Now
        </button>
        <div>
          <span className="design-lab-mono-label text-blue-200">
            {statusLabel(story)} / {story.section}
          </span>
          <strong className="block truncate">{story.title}</strong>
          <SaveState story={story} />
        </div>
        <button
          className="rounded-full bg-[#d8ddff] px-5 py-3 text-xs font-bold text-[#1b2555]"
          onClick={actions.openPublication}
          type="button"
        >
          Publication check
        </button>
      </header>
      <div className="grid gap-5 p-4 lg:grid-cols-[11rem_minmax(32rem,1fr)_19rem] lg:p-8">
        <aside className="hidden py-6 text-blue-100/75 lg:block">
          <p className="design-lab-mono-label">Story map</p>
          <ol className="mt-8 space-y-6 text-xs">
            <li>● Title</li>
            <li className="font-bold text-white">◉ Opening</li>
            <li>○ Rooms facing north</li>
            <li>○ The blue hour</li>
            <li>○ Sources</li>
          </ol>
          <div className="mt-20 border-t border-white/15 pt-6">
            <span className="design-lab-mono-label">Revision</span>
            <strong className="block text-5xl font-normal text-white">
              {revisionLabel(story)}
            </strong>
          </div>
        </aside>
        <article className="relative overflow-hidden rounded-[2.5rem] border border-white/15 bg-[#f9f8f3] px-[clamp(1.5rem,6vw,6rem)] py-14 text-[#18203b] shadow-[0_55px_140px_rgba(0,0,0,.45)]">
          <div className="design-lab-page-glow" />
          <div className="relative mb-10 flex justify-between text-[.6rem] uppercase tracking-[.18em] text-indigo-800">
            <span>{story.section}</span>
            <span>Revision {revisionLabel(story)}</span>
          </div>
          <div className="relative">
            <EditorFields {...props} />
            <StoryImage className="mt-10 aspect-[16/10] rounded-[1.5rem]" story={story} />
            <button
              className="mt-3 text-[.65rem] underline"
              onClick={actions.openUpload}
              type="button"
            >
              Add image context
            </button>
            <BodyEditor {...props} />
          </div>
        </article>
        <aside className="rounded-[2rem] border border-white/15 bg-white/10 p-6 backdrop-blur-2xl">
          <div className="mx-auto grid size-28 place-items-center rounded-full border border-white/30 shadow-[0_0_70px_rgba(126,146,255,.45)]">
            <span>{story.mediaId ? '5 / 5' : '4 / 5'}</span>
          </div>
          <p className="design-lab-mono-label mt-10 text-blue-200">Publication readiness</p>
          <h2 className="mt-5 text-4xl leading-[.9] tracking-[-.055em]">Everything is aligned.</h2>
          <ReadinessList story={story} />
          <button
            className={`${darkButton} mt-6 w-full`}
            onClick={actions.openUpload}
            type="button"
          >
            {story.mediaId ? 'Replace lead image' : 'Add image'}
          </button>
          <button
            className="mt-3 w-full rounded-full bg-[#d8ddff] px-5 py-4 text-xs font-bold text-[#1b2555]"
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

export function HaloReader({ actions, story }: DesignLabDirectionProps) {
  return (
    <section className="design-lab-halo relative min-h-[calc(100vh-4.75rem)] overflow-hidden pb-24 text-[#eef4ff]">
      <div className="design-lab-orbit design-lab-orbit-reader" />
      <header className="relative z-10 flex min-h-20 items-center justify-between border-b border-white/15 px-6">
        <strong className="text-xl">NH · North House</strong>
        <span className="design-lab-mono-label text-blue-200">Issue 07 · Sunday edition</span>
      </header>
      <div className="relative z-10">
        <ReaderState story={story} />
        <article className="mx-auto max-w-6xl px-6 py-16">
          <header className="mx-auto max-w-4xl text-center">
            <p className="design-lab-mono-label text-blue-200">{story.section} · 7 min read</p>
            <h1 className="mt-8 text-[clamp(4rem,9vw,9rem)] leading-[.78] tracking-[-.08em]">
              {story.title}
            </h1>
            <p className="mx-auto mt-10 max-w-2xl font-serif text-2xl text-blue-100/75">
              {story.dek}
            </p>
          </header>
          <StoryImage
            className="mt-16 aspect-[16/10] rounded-[2.5rem] border border-white/20 p-2"
            story={story}
          />
          <StoryCopy className="design-lab-reader-copy design-lab-reader-copy-dark" story={story} />
        </article>
      </div>
      <button
        className="design-lab-floating-action border-white/20 bg-[#202b62]/80 text-white"
        onClick={() => actions.setView('write')}
        type="button"
      >
        ← Back to owner studio
      </button>
    </section>
  )
}
