import type { ReaderDirectionTokens } from '../contract'

/**
 * Paper by day and warm graphite by night. Stone is decorative; small text uses stone ink, which
 * never sits on sand. There is no accent colour: the only colour comes from the pictures.
 */
export const tokens = {
  light: {
    '--qm-paper': '#F6F5F1',
    '--qm-ink': '#1C1B19',
    '--qm-stone': '#7A766E',
    '--qm-stone-ink': '#6B665E',
    '--qm-sand': '#D9D3C7',
    '--qm-print': '0 0.5rem 1.75rem #1C1B1914',
    '--qm-print-hover': '0 0.75rem 2.25rem #1C1B1926',
    '--qm-scheme': 'light',
    '--qm-display': 'var(--font-qm-display), Georgia, serif',
    '--qm-text': 'var(--font-qm-text), Arial, sans-serif',
    '--qm-small': '0.8125rem',
    '--qm-label': '0.75rem',
    '--qm-copy': '1rem',
    '--qm-body': 'clamp(1.125rem, 1rem + 0.25vw, 1.25rem)',
    '--qm-dek': 'clamp(1.375rem, 1.1rem + 0.8vw, 1.875rem)',
    '--qm-card': 'clamp(1.75rem, 1.4rem + 0.8vw, 2.25rem)',
    '--qm-heading': 'clamp(2rem, 1.5rem + 1vw, 2.75rem)',
    '--qm-title': 'clamp(2.625rem, 1.5rem + 4vw, 5rem)',
    '--qm-title-long': 'clamp(2rem, 1.4rem + 2vw, 3.25rem)',
    '--qm-section-title': 'clamp(2.75rem, 1.5rem + 6vw, 7.5rem)',
    '--qm-wordmark': 'clamp(0.9375rem, 0.8rem + 0.5vw, 1.3125rem)',
    '--qm-monogram': 'clamp(6rem, 3rem + 8vw, 10rem)',
    '--qm-leading': '1.8',
    '--qm-measure': '30em',
    '--qm-gutter': 'clamp(1.25rem, 4vw, 4rem)',
    '--qm-space': 'clamp(4rem, 9vw, 8rem)',
    '--qm-page': '75rem',
  },
  dark: {
    '--qm-paper': '#2E2B27',
    '--qm-ink': '#EEEBE4',
    '--qm-stone-ink': '#B5AEA2',
    '--qm-stone': '#8C867C',
    '--qm-sand': '#4A463F',
    '--qm-print': 'none',
    '--qm-print-hover': 'none',
    '--qm-scheme': 'dark',
  },
  textPairs: [
    ['--qm-ink', '--qm-paper'],
    ['--qm-stone-ink', '--qm-paper'],
    ['--qm-ink', '--qm-sand'],
  ],
} as const satisfies ReaderDirectionTokens
