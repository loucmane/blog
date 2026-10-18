import type { ReaderDirectionFont } from '../contract'

// Fontsource 5.3.0 Latin subsets, trimmed offline by prepare-fonts.py to the used
// wght 400–900 and SOFT 30–100 ranges. All glyphs, features and genuine italics remain.
// Reproduce fallback metrics with font-metrics.mjs. Optional display prevents late swaps.
export const fonts = [
  {
    fallback: {
      family: 'Times New Roman',
      ascentOverride: '84.71%',
      descentOverride: '22.09%',
      lineGapOverride: '0.00%',
      sizeAdjust: '115.45%',
    },
    genericFamily: 'serif',
    sources: [
      { file: 'fraunces-latin-reader-normal.woff2', weight: [400, 900] },
      { file: 'fraunces-latin-reader-italic.woff2', weight: [400, 900], style: 'italic' },
    ],
    variable: '--font-ec-serif',
  },
  {
    fallback: {
      family: 'Arial',
      ascentOverride: '63.69%',
      descentOverride: '12.74%',
      lineGapOverride: '0.00%',
      sizeAdjust: '157.02%',
    },
    genericFamily: 'monospace',
    sources: [
      { file: 'martian-mono-latin-400-normal.woff2', weight: 400 },
      { file: 'martian-mono-latin-500-normal.woff2', weight: 500 },
    ],
    variable: '--font-ec-mono',
  },
] as const satisfies readonly ReaderDirectionFont[]
