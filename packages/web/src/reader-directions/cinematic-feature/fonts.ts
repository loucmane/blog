import type { ReaderDirectionFont } from '../contract'

// Unmodified Fontsource Latin subsets; provenance and OFL licences accompany the assets.
// Reproduce normal-width fallback metrics with font-metrics.mjs. Optional display prevents
// a late swap even when the local fallback cannot reproduce Archivo's condensed width.
export const fonts = [
  {
    fallback: {
      family: 'Arial',
      ascentOverride: '88.96%',
      descentOverride: '21.28%',
      lineGapOverride: '0.00%',
      sizeAdjust: '98.70%',
    },
    genericFamily: 'sans-serif',
    sources: [
      { file: 'archivo-latin-wdth-normal.woff2', weight: [100, 900], stretch: ['62%', '125%'] },
      { file: 'archivo-latin-400-italic.woff2', weight: 400, style: 'italic' },
      { file: 'archivo-latin-700-italic.woff2', weight: 700, style: 'italic' },
    ],
    variable: '--font-cf-sans',
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
    variable: '--font-cf-mono',
  },
] as const satisfies readonly ReaderDirectionFont[]
