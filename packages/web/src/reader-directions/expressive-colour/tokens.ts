import type { ReaderDirectionTokens, ReaderDirectionTokenSet } from '../contract'
import { ink, paper, storyColours } from './colours'

const swatches: ReaderDirectionTokenSet = Object.fromEntries(
  storyColours.flatMap(({ name, background, foreground }) => [
    [`--ec-${name}`, background],
    [`--ec-on-${name}`, foreground],
  ]),
)

// Night print changes the ground, never the story swatches or their on-colours.
export const tokens = {
  light: {
    ...swatches,
    '--ec-scheme': 'light',
    '--ec-paper': paper,
    '--ec-paper-2': '#F2E8D8',
    '--ec-ink': ink,
    '--ec-ink-soft': '#514B63',
    '--ec-serif': 'var(--font-ec-serif), Georgia, serif',
    '--ec-mono': 'var(--font-ec-mono), monospace',
    '--ec-label': '0.75rem',
    '--ec-small': '0.8125rem',
    '--ec-copy': '1.125rem',
    '--ec-body': '1.25rem',
    '--ec-row': 'clamp(1.25rem, 1.1rem + 0.4vw, 1.5rem)',
    '--ec-card': 'clamp(1.5rem, 1.25rem + 0.75vw, 2.125rem)',
    '--ec-card-lg': 'clamp(1.875rem, 1.5rem + 1vw, 2.75rem)',
    '--ec-dek': 'clamp(1.375rem, 1.1rem + 1vw, 2rem)',
    '--ec-h3': 'clamp(1.5rem, 1.3rem + 0.5vw, 1.875rem)',
    '--ec-heading': 'clamp(1.875rem, 1.5rem + 1.25vw, 2.75rem)',
    '--ec-lead': 'clamp(2.5rem, 1.4rem + 3vw, 4.75rem)',
    '--ec-title': 'clamp(2.75rem, 1.4rem + 5.5vw, 6.5rem)',
    '--ec-title-long': 'clamp(2.25rem, 1.2rem + 3.5vw, 4.5rem)',
    '--ec-wordmark': 'clamp(2.5rem, 1.75rem + 3.5vw, 5.25rem)',
    '--ec-wordmark-sm': 'clamp(1.75rem, 1.4rem + 1.5vw, 2.75rem)',
    '--ec-leading': '1.75',
    '--ec-measure': '45rem',
    '--ec-feature': '56rem',
    '--ec-wide': '72rem',
    '--ec-page': '88rem',
    '--ec-gutter': 'clamp(1rem, 3vw, 3rem)',
    '--ec-gap': 'clamp(1rem, 2vw, 1.75rem)',
    '--ec-space': 'clamp(3rem, 6vw, 6rem)',
    '--ec-radius': '1.5rem',
    '--ec-card-padding': 'clamp(1.25rem, 2vw, 2rem)',
    '--ec-lead-padding': 'clamp(1.5rem, 3vw, 3rem)',
    '--ec-lead-gap': 'clamp(2rem, 4vw, 4rem)',
    '--ec-band-padding': 'clamp(1.5rem, 5vw, 5rem)',
  },
  dark: {
    '--ec-scheme': 'dark',
    '--ec-paper': '#17141F',
    '--ec-paper-2': '#231F2D',
    '--ec-ink': '#F1E8DA',
    '--ec-ink-soft': '#C4BBCB',
  },
  textPairs: [
    ['--ec-ink', '--ec-paper'],
    ['--ec-paper', '--ec-ink'],
    ['--ec-ink-soft', '--ec-paper'],
    ['--ec-ink', '--ec-paper-2'],
    ['--ec-ink-soft', '--ec-paper-2'],
    ...storyColours.map(({ name }) => [`--ec-on-${name}`, `--ec-${name}`] as const),
  ],
} satisfies ReaderDirectionTokens
