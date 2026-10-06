import type { ReaderDirectionTokens } from '../contract'

/** One paper palette in both application themes. Stone is decorative; small text uses stone-ink. */
export const tokens = {
  light: {
    '--qm-paper': '#F6F5F1',
    '--qm-ink': '#1C1B19',
    '--qm-stone': '#7A766E',
    '--qm-stone-ink': '#746F67',
    '--qm-sand': '#D9D3C7',
    '--qm-display': 'var(--font-qm-display), Georgia, serif',
    '--qm-text': 'var(--font-qm-text), Arial, sans-serif',
    '--qm-small': '0.8125rem',
    '--qm-label': '0.75rem',
    '--qm-body': 'clamp(1.125rem, 1rem + 0.25vw, 1.25rem)',
    '--qm-dek': 'clamp(1.25rem, 1rem + 0.6vw, 1.625rem)',
    '--qm-card': 'clamp(1.75rem, 1.4rem + 0.8vw, 2.25rem)',
    '--qm-heading': 'clamp(2rem, 1.5rem + 1vw, 2.75rem)',
    '--qm-title': 'clamp(2.625rem, 1.5rem + 4vw, 5rem)',
    '--qm-section-title': 'clamp(3.75rem, 2rem + 6vw, 7.5rem)',
    '--qm-leading': '1.8',
    '--qm-measure': '66ch',
    '--qm-gutter': 'clamp(1.25rem, 4vw, 4rem)',
    '--qm-space': 'clamp(4rem, 9vw, 8rem)',
    '--qm-page': '75rem',
  },
  textPairs: [
    ['--qm-ink', '--qm-paper'],
    ['--qm-stone-ink', '--qm-paper'],
    ['--qm-ink', '--qm-sand'],
  ],
} as const satisfies ReaderDirectionTokens
