import { storyMotif } from './colours'

/** Decorative cut-paper geometry. No resources, random values or SVG id collisions. */
export function StoryMotif({ slug }: { readonly slug: string }) {
  const { kind, rotation } = storyMotif(slug)
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      className="ec-motif"
      data-motif={`${kind}-${rotation}`}
      viewBox="0 0 360 270"
      width="360"
      height="270"
      fill="none"
    >
      <g transform={`translate(180 135) rotate(${rotation})`}>
        {kind === 0 ? (
          <>
            <path
              d="M-90 95V-5a90 90 0 0 1 180 0v100H45V-5a45 45 0 0 0-90 0v100Z"
              fill="currentColor"
            />
            <path d="M-105 110H105" stroke="currentColor" strokeWidth="3" />
          </>
        ) : kind === 1 ? (
          <>
            <circle r="96" fill="currentColor" />
            <path d="M-96 0H96M0-96V96" stroke="var(--ec-story)" strokeWidth="16" />
          </>
        ) : (
          <>
            <path
              d="M-96-96H0V0A96 96 0 0 1-96-96ZM0 0H96V96A96 96 0 0 1 0 0Z"
              fill="currentColor"
            />
            <path
              d="M0-96A96 96 0 0 1 96 0M-96 0A96 96 0 0 1 0 96"
              stroke="currentColor"
              strokeWidth="22"
            />
          </>
        )}
      </g>
    </svg>
  )
}
