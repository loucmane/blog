import Image from 'next/image'

import type { DesignLabDirectionProps, DesignLabStory } from './types'

export function statusLabel(story: DesignLabStory): string {
  return story.status.toUpperCase()
}

export function revisionLabel(story: DesignLabStory): string {
  return String(story.server?.revisionNumber ?? 1).padStart(2, '0')
}

export function wordCount(story: DesignLabStory): number {
  return story.body.split(/\s+/).filter(Boolean).length
}

export function StoryImage({
  story,
  className,
}: {
  readonly className?: string
  readonly story: DesignLabStory
}) {
  return (
    <div className={`relative overflow-hidden ${className ?? ''}`}>
      <Image
        alt={story.imageAlt}
        className="object-cover"
        fill
        priority
        sizes="(max-width: 768px) 100vw, 65vw"
        src={story.image}
        unoptimized
      />
    </div>
  )
}

export function EditorFields({ actions, story }: DesignLabDirectionProps) {
  return (
    <>
      <label className="sr-only" htmlFor="design-lab-title">
        Story title
      </label>
      <textarea
        className="design-lab-title-field"
        id="design-lab-title"
        onChange={(event) => actions.change('title', event.target.value)}
        rows={3}
        value={story.title}
      />
      <label className="sr-only" htmlFor="design-lab-summary">
        Short summary
      </label>
      <textarea
        className="design-lab-summary-field"
        id="design-lab-summary"
        onChange={(event) => actions.change('dek', event.target.value)}
        rows={2}
        value={story.dek}
      />
    </>
  )
}

export function BodyEditor({ actions, story }: DesignLabDirectionProps) {
  return (
    <label className="block">
      <span className="sr-only">Story body</span>
      <textarea
        aria-label="Story body"
        className="design-lab-body-field"
        onChange={(event) => actions.change('body', event.target.value)}
        value={story.body}
      />
    </label>
  )
}

export function SaveState({ story }: { readonly story: DesignLabStory }) {
  return (
    <span aria-live="polite" className="mt-1 block text-[0.65rem] text-current/65" role="status">
      {story.saved}
    </span>
  )
}

export function ReaderState({ story }: { readonly story: DesignLabStory }) {
  const state =
    story.status === 'published'
      ? ['Live reader story', 'Readers can see this exact revision.', 'bg-emerald-500']
      : story.status === 'scheduled'
        ? [
            'Private scheduled preview',
            'This stays private until its release time.',
            'bg-indigo-500',
          ]
        : [
            'Private reader preview',
            'Only the owner can see this unpublished revision.',
            'bg-amber-500',
          ]
  return (
    <div className="mx-auto mt-5 flex w-[min(42rem,calc(100%-2rem))] items-center gap-3 rounded-full border border-black/10 bg-white/85 px-4 py-3 text-xs text-slate-800 shadow-lg backdrop-blur-xl">
      <i className={`size-2 shrink-0 rounded-full ${state[2]}`} />
      <strong>{state[0]}</strong>
      <span className="text-slate-500">{state[1]}</span>
    </div>
  )
}

export function ReadinessList({ story }: { readonly story: DesignLabStory }) {
  const checks = [
    ['Story', story.title.trim().length >= 4 && story.body.trim().length >= 20],
    ['Summary', story.dek.trim().length >= 12],
    ['Image description', Boolean(story.imageAlt.trim())],
    ['Protected revision', Boolean(story.server)],
  ] as const
  return (
    <ul className="mt-6 divide-y divide-current/10 border-y border-current/10 text-xs">
      {checks.map(([label, ready]) => (
        <li className="flex min-h-12 items-center gap-3" key={label}>
          <i className={`size-2 rounded-full ${ready ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <span>{label}</span>
          <strong className="ml-auto text-[0.65rem] uppercase tracking-wider">
            {ready ? 'Ready' : 'Needs attention'}
          </strong>
        </li>
      ))}
    </ul>
  )
}

export function StoryCopy({
  story,
  className,
}: {
  readonly className?: string
  readonly story: DesignLabStory
}) {
  return (
    <div className={className}>
      {story.body
        .split(/\n\n+/)
        .filter(Boolean)
        .map((paragraph, index) =>
          index === story.body.split(/\n\n+/).filter(Boolean).length - 1 ? (
            <blockquote key={paragraph}>{paragraph}</blockquote>
          ) : (
            <p key={paragraph}>{paragraph}</p>
          ),
        )}
    </div>
  )
}
