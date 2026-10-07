import type { ReaderDirectionFont } from '../contract'

// Fontsource 5.3.0 Latin subsets. Licences and measured hashes accompany the public assets.
// Reproduce fallback metrics with this directory's font-metrics.mjs (installed Next table).
export const fonts = [
  {
    fallback: {
      family: 'Times New Roman',
      ascentOverride: '69.68%',
      descentOverride: '25.12%',
      lineGapOverride: '0.00%',
      sizeAdjust: '105.48%',
    },
    genericFamily: 'serif',
    sources: [
      { file: 'newsreader-latin-400-normal.woff2', weight: 400 },
      { file: 'newsreader-latin-500-normal.woff2', weight: 500 },
      { file: 'newsreader-latin-600-normal.woff2', weight: 600 },
      { file: 'newsreader-latin-400-italic.woff2', weight: 400, style: 'italic' },
      { file: 'newsreader-latin-600-italic.woff2', weight: 600, style: 'italic' },
    ],
    variable: '--font-ll-serif',
  },
  {
    fallback: {
      family: 'Arial',
      ascentOverride: '92.61%',
      descentOverride: '23.58%',
      lineGapOverride: '0.00%',
      sizeAdjust: '104.31%',
    },
    genericFamily: 'sans-serif',
    sources: [
      { file: 'libre-franklin-latin-400-normal.woff2', weight: 400 },
      { file: 'libre-franklin-latin-600-normal.woff2', weight: 600 },
    ],
    variable: '--font-ll-sans',
  },
] as const satisfies readonly ReaderDirectionFont[]
