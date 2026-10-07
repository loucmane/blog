import type { ReaderDirectionTokens, ReaderDirectionTokenSet } from '../contract'
import { ink, paper, storyColours } from './colours'

const swatches: ReaderDirectionTokenSet = Object.fromEntries(
  storyColours.flatMap(({ name, background, foreground }) => [
    [`--ec-${name}`, background],
    [`--ec-on-${name}`, foreground],
  ]),
)

// A deliberately light, paper-based presentation in either inherited site theme.
export const tokens = {
  light: {
    ...swatches,
    '--ec-paper': paper,
    '--ec-ink': ink,
    '--ec-serif': 'var(--font-ec-serif), Georgia, serif',
    '--ec-mono': 'var(--font-ec-mono), monospace',
    '--ec-label': '0.6875rem',
    '--ec-small': '0.75rem',
    '--ec-copy': '1.125rem',
    '--ec-body': '1.25rem',
    '--ec-card': 'clamp(1.875rem, 1.5rem + 1vw, 2.75rem)',
    '--ec-dek': 'clamp(1.5rem, 1.2rem + 1vw, 2rem)',
    '--ec-heading': 'clamp(2rem, 1.5rem + 2vw, 3.25rem)',
    '--ec-lead': 'clamp(2.5rem, 1.4rem + 3vw, 4.75rem)',
    '--ec-title': 'clamp(2.75rem, 1.4rem + 5.5vw, 6.5rem)',
    '--ec-wordmark': 'clamp(2.5rem, 1.75rem + 3.5vw, 5.25rem)',
    '--ec-leading': '1.75',
    '--ec-measure': '65ch',
    '--ec-page': '88rem',
    '--ec-gutter': 'clamp(1rem, 3vw, 3rem)',
    '--ec-gap': 'clamp(1rem, 2vw, 1.75rem)',
    '--ec-space': 'clamp(3rem, 6vw, 6rem)',
    '--ec-radius': '1.5rem',
  },
  textPairs: [
    ['--ec-ink', '--ec-paper'],
    ['--ec-paper', '--ec-ink'],
    ...storyColours.map(({ name }) => [`--ec-on-${name}`, `--ec-${name}`] as const),
  ],
} satisfies ReaderDirectionTokens
