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

export function ContactDesk({ actions, story }: DesignLabDirectionProps) {
  return (
    <section className="min-h-[calc(100vh-4.75rem)] bg-[#d9dcdd] text-[#17191a]">
      <header className="flex min-h-20 items-center justify-between border-b border-black/20 px-6">
        <div>
          <b className="mr-4 rounded-full border border-current p-3">N/H</b>
          <span className="design-lab-mono-label">North House production</span>
        </div>
        <span className="text-xs">{story.saved}</span>
      </header>
      <div className="p-5 lg:p-8">
        <section className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <p className="design-lab-mono-label">Issue 07 / owner&apos;s worktable</p>
            <h1 className="mt-4 text-[clamp(4rem,8vw,9rem)] leading-[.78] tracking-[-.08em]">
              The edition
              <br />
              as a <em className="font-normal">sequence.</em>
            </h1>
          </div>
          <button
            className="rounded-full bg-[#681b28] px-6 py-4 text-sm font-bold text-white"
            onClick={actions.createStory}
            type="button"
          >
            + Start a protected draft
          </button>
        </section>
        <section className="relative mt-10 grid min-h-[34rem] grid-cols-2 gap-3 overflow-hidden rounded-[2rem] bg-[#c6c9ca] p-3 lg:grid-cols-[.75fr_1.35fr_.9fr]">
          <StoryImage
            className="min-h-56 grayscale"
            story={{ ...story, image: '/design-lab/winter-room.svg' }}
          />
          <StoryImage className="min-h-[32rem]" story={story} />
          <StoryImage
            className="hidden min-h-56 saturate-50 lg:block"
            story={{ ...story, image: '/design-lab/winter-room.svg' }}
          />
          <article className="absolute bottom-7 right-7 w-[min(28rem,calc(100%-3.5rem))] rounded-[1.5rem] bg-[#f7e8e7]/95 p-7 shadow-2xl backdrop-blur-xl">
            <p className="design-lab-mono-label">
              {statusLabel(story)} · {story.saved}
            </p>
            <h2 className="mt-6 text-5xl leading-[.9] tracking-[-.06em]">{story.title}</h2>
            <div className="my-6 flex gap-4 text-[.65rem]">
              <span>{wordCount(story)} words</span>
              <span>Revision {revisionLabel(story)}</span>
            </div>
            <button
              className="design-lab-pill"
              onClick={() => actions.setView('write')}
              type="button"
            >
              Open story ↗
            </button>
          </article>
        </section>
      </div>
    </section>
  )
}

export function ContactWrite(props: DesignLabDirectionProps) {
  const { actions, story } = props
  return (
    <section className="min-h-[calc(100vh-4.75rem)] bg-[#d6d9da] text-[#17191a]">
      <header className="grid min-h-20 grid-cols-[auto_1fr_auto] items-center gap-4 border-b border-black/20 px-5">
        <button className="design-lab-pill" onClick={() => actions.setView('desk')} type="button">
          ← Worktable
        </button>
        <div>
          <span className="design-lab-mono-label">Story 02 / {statusLabel(story)}</span>
          <strong className="block truncate">{story.title}</strong>
          <SaveState story={story} />
        </div>
        <button
          className="rounded-full bg-[#681b28] px-5 py-3 text-xs font-bold text-white"
          onClick={actions.openPublication}
          type="button"
        >
          Check + publish
        </button>
      </header>
      <div className="grid gap-4 p-4 lg:grid-cols-[9rem_minmax(32rem,1fr)_18rem] lg:p-8">
        <aside className="hidden space-y-3 lg:block">
          <p className="design-lab-mono-label">Contacts</p>
          {[0, 1, 2].map((index) => (
            <button
              className="relative block aspect-[4/5] w-full overflow-hidden rounded-xl border border-black/10"
              key={index}
              onClick={index === 0 ? actions.openUpload : undefined}
              type="button"
            >
              <StoryImage className="size-full" story={story} />
              <span className="absolute bottom-2 left-2 rounded-full bg-white px-2 py-1 text-[.55rem]">
                {index === 0 ? 'Lead' : `Frame ${index + 1}`}
              </span>
            </button>
          ))}
          <button className="design-lab-pill w-full" onClick={actions.openUpload} type="button">
            + Add image
          </button>
        </aside>
        <article className="rounded-[1.5rem] bg-[#fffdf8] px-[clamp(1.5rem,6vw,6rem)] py-14 shadow-2xl">
          <div className="mb-10 flex justify-between text-[.6rem] uppercase tracking-[.16em]">
            <span>{story.section}</span>
            <span>Revision {revisionLabel(story)}</span>
          </div>
          <EditorFields {...props} />
          <StoryImage className="mt-10 aspect-[16/10]" story={story} />
          <button
            className="mt-3 text-[.65rem] underline"
            onClick={actions.openUpload}
            type="button"
          >
            Crop + describe image ↗
          </button>
          <BodyEditor {...props} />
        </article>
        <aside className="rounded-[1.5rem] bg-[#f5dedd] p-6">
          <p className="design-lab-mono-label">Proof / {statusLabel(story)}</p>
          <h2 className="mt-14 text-4xl leading-[.9] tracking-[-.06em]">
            The story is ready to release.
          </h2>
          <p className="mt-4 text-sm text-[#724d51]">
            Nothing publishes until you confirm the exact protected revision.
          </p>
          <ReadinessList story={story} />
          <button
            className="design-lab-pill mt-6 w-full"
            onClick={actions.openUpload}
            type="button"
          >
            {story.mediaId ? 'Replace lead image' : 'Describe lead image'}
          </button>
          <button
            className="mt-3 w-full rounded-full bg-[#681b28] px-5 py-4 text-xs font-bold text-white"
            onClick={actions.openPublication}
            type="button"
          >
            Publication review
          </button>
        </aside>
      </div>
    </section>
  )
}

export function ContactReader({ actions, story }: DesignLabDirectionProps) {
  return (
    <section className="min-h-[calc(100vh-4.75rem)] bg-[#f4e9e8] pb-24 text-[#191616]">
      <header className="flex min-h-20 items-center justify-between border-b border-black/20 px-6">
        <b className="text-2xl tracking-[-.08em]">NORTH / HOUSE</b>
        <span className="design-lab-mono-label">Independent review of design, place & ritual</span>
      </header>
      <ReaderState story={story} />
      <article className="mx-auto max-w-7xl px-6 py-14">
        <header className="grid gap-8 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <p className="design-lab-mono-label">
              {story.section} / {statusLabel(story)} / 7 min
            </p>
            <h1 className="mt-8 text-[clamp(4rem,9vw,9rem)] leading-[.78] tracking-[-.08em]">
              {story.title}
            </h1>
          </div>
          <p className="self-end font-serif text-3xl leading-tight text-[#704d50]">{story.dek}</p>
        </header>
        <div className="mt-14 grid gap-4 lg:grid-cols-[1.4fr_.6fr]">
          <StoryImage className="min-h-[36rem]" story={story} />
          <StoryImage
            className="hidden min-h-[36rem] grayscale lg:block"
            story={{ ...story, image: '/design-lab/winter-room.svg' }}
          />
        </div>
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
