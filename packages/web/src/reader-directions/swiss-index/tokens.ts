import type { ReaderDirectionTokens } from '../contract'

export const tokens = {
  light: {
    '--si-paper': '#FFFFFF',
    '--si-ink': '#0E0E0E',
    '--si-secondary': '#6A6A6A',
    '--si-signal': '#FF4F1F',
    '--si-signal-ink': '#0E0E0E',
    // Image cells, number plates and boxed blocks; never the edge of a control.
    '--si-plate': '#F2F2F2',
    '--si-sans': 'var(--font-si-sans), Arial, sans-serif',
    '--si-mono': 'var(--font-si-mono), monospace',
    '--si-label': '0.75rem',
    '--si-small': '0.8125rem',
    '--si-copy': '1rem',
    '--si-body': 'clamp(1.125rem, 1rem + 0.5vw, 1.25rem)',
    '--si-card': 'clamp(1.5rem, 1.15rem + 1vw, 2.125rem)',
    '--si-dek': 'clamp(1.25rem, 1rem + 0.8vw, 1.75rem)',
    '--si-heading': 'clamp(2rem, 1.25rem + 2vw, 3.25rem)',
    '--si-title': 'clamp(2.5rem, 1rem + 5.5vw, 6rem)',
    // The page title size for titles over 80 characters.
    '--si-title-long': 'clamp(2rem, 1rem + 3vw, 3.75rem)',
    '--si-wordmark': 'clamp(2rem, 3.1vw, 2.875rem)',
    '--si-plate-number': 'clamp(4rem, 2rem + 6vw, 7.5rem)',
    '--si-leading': '1.65',
    '--si-measure': '65ch',
    '--si-page': '84rem',
    '--si-gutter': 'clamp(1.25rem, 3vw, 3rem)',
    '--si-gap': '1.5rem',
    '--si-space': 'clamp(3rem, 6vw, 6rem)',
  },
  dark: {
    '--si-paper': '#000000',
    '--si-ink': '#F5F5F0',
    '--si-secondary': '#A6A6A6',
    '--si-plate': '#1A1A1A',
  },
  textPairs: [
    ['--si-ink', '--si-paper'],
    ['--si-secondary', '--si-paper'],
    ['--si-signal-ink', '--si-signal'],
    ['--si-ink', '--si-plate'],
    ['--si-secondary', '--si-plate'],
  ],
} as const satisfies ReaderDirectionTokens
