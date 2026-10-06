import type { ReaderDirectionFont } from '../contract'

// Local Latin subsets, normal weights only. Sources, OFL licences and hashes live beside
// the files in public/reader-directions/quiet-monograph/fonts/. Reproduce these Next 16.3.8
// fallback metrics with `node packages/web/src/reader-directions/quiet-monograph/font-metrics.mjs`.
export const fonts = [
  {
    fallback: {
      family: 'Times New Roman',
      ascentOverride: '95.27%',
      descentOverride: '29.59%',
      lineGapOverride: '0.00%',
      sizeAdjust: '96.98%',
    },
    genericFamily: 'serif',
    sources: [
      { file: 'cormorant-garamond-latin-400-normal.woff2', weight: 400 },
      { file: 'cormorant-garamond-latin-500-normal.woff2', weight: 500 },
    ],
    variable: '--font-qm-display',
  },
  {
    fallback: {
      family: 'Arial',
      ascentOverride: '111.45%',
      descentOverride: '39.06%',
      lineGapOverride: '0.00%',
      sizeAdjust: '96.01%',
    },
    genericFamily: 'sans-serif',
    sources: [
      { file: 'jost-latin-300-normal.woff2', weight: 300 },
      { file: 'jost-latin-400-normal.woff2', weight: 400 },
      { file: 'jost-latin-500-normal.woff2', weight: 500 },
    ],
    variable: '--font-qm-text',
  },
] as const satisfies readonly ReaderDirectionFont[]
