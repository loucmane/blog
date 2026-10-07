import { contrastRatio } from '../contrast'

export const paper = '#FBF4EA'
export const ink = '#1D1A2B'

const swatches = [
  { name: 'cobalt', background: '#2F45D6' },
  { name: 'saffron', background: '#F2A93B' },
  { name: 'rose', background: '#E86A8E' },
  { name: 'forest', background: '#276451' },
  { name: 'lilac', background: '#B8A1DF' },
  { name: 'brick', background: '#AD352C' },
] as const

export type StoryColourName = (typeof swatches)[number]['name']

/** These pairs also generate the CSS tokens: there is only one source of colour truth. */
export const storyColours = Object.freeze(
  swatches.map((swatch) =>
    Object.freeze({
      ...swatch,
      foreground:
        contrastRatio(ink, swatch.background) >= contrastRatio(paper, swatch.background)
          ? ink
          : paper,
    }),
  ),
)

/** FNV-1a over UTF-16 code units. No runtime seed, locale, date or list-position dependence. */
export function storyHash(identity: string): number {
  let hash = 0x811c9dc5
  for (let index = 0; index < identity.length; index++) {
    hash = Math.imul(hash ^ identity.charCodeAt(index), 0x01000193)
  }
  return hash >>> 0
}

/** All three view models have a slug. Keep palette order stable to preserve assignments. */
export function storyColour(slug: string, preferred?: StoryColourName | null) {
  // Future owner-colour seam, restricted to the already contrast-checked palette.
  // Current callers pass only the slug; no owner field or persistence is introduced.
  return (
    storyColours.find((colour) => colour.name === preferred) ??
    storyColours[storyHash(slug) % storyColours.length]!
  )
}

export function storyMotif(slug: string) {
  const hash = storyHash(slug)
  return { kind: (hash >>> 8) % 3, rotation: ((hash >>> 16) % 4) * 90 }
}
