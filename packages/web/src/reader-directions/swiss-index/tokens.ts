import type { ReaderDirectionTokens } from '../contract'

export const tokens = {
  light: {
    '--si-paper': '#FFFFFF',
    '--si-ink': '#0E0E0E',
    '--si-secondary': '#6A6A6A',
    '--si-signal': '#FF4F1F',
    '--si-signal-ink': '#0E0E0E',
    '--si-sans': 'var(--font-si-sans), Arial, sans-serif',
    '--si-mono': 'var(--font-si-mono), monospace',
    '--si-label': '0.75rem',
    '--si-small': '0.8125rem',
    '--si-copy': '1rem',
    '--si-body': '1.25rem',
    '--si-card': 'clamp(1.5rem, 1.15rem + 1vw, 2.125rem)',
    '--si-dek': 'clamp(1.25rem, 1rem + 0.8vw, 1.75rem)',
    '--si-heading': 'clamp(2rem, 1.25rem + 2vw, 3.25rem)',
    '--si-title': 'clamp(3rem, 1.25rem + 5vw, 6rem)',
    '--si-wordmark': 'clamp(2rem, 3.1vw, 2.875rem)',
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
  },
  textPairs: [
    ['--si-ink', '--si-paper'],
    ['--si-secondary', '--si-paper'],
    ['--si-signal-ink', '--si-signal'],
  ],
} as const satisfies ReaderDirectionTokens
