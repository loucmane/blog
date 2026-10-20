import type { ReaderDirectionFont } from '../contract'

// Fontsource 5.3.0 Latin subsets; full provenance and licences accompany the public assets.
// Schibsted Grotesk's genuine 400 and 700 italics share the family's fallback. Reproduce the
// installed Next table's fallback metrics with font-metrics.mjs.
export const fonts = [
  {
    fallback: {
      family: 'Arial',
      ascentOverride: '93.46%',
      descentOverride: '24.67%',
      lineGapOverride: '0.00%',
      sizeAdjust: '104.49%',
    },
    genericFamily: 'sans-serif',
    sources: [
      { file: 'schibsted-grotesk-latin-400-normal.woff2', weight: 400 },
      { file: 'schibsted-grotesk-latin-700-normal.woff2', weight: 700 },
      { file: 'schibsted-grotesk-latin-800-normal.woff2', weight: 800 },
      { file: 'schibsted-grotesk-latin-400-italic.woff2', weight: 400, style: 'italic' },
      { file: 'schibsted-grotesk-latin-700-italic.woff2', weight: 700, style: 'italic' },
    ],
    variable: '--font-si-sans',
  },
  {
    fallback: {
      family: 'Arial',
      ascentOverride: '76.16%',
      descentOverride: '20.43%',
      lineGapOverride: '0.00%',
      sizeAdjust: '134.59%',
    },
    genericFamily: 'monospace',
    sources: [
      { file: 'ibm-plex-mono-latin-400-normal.woff2', weight: 400 },
      { file: 'ibm-plex-mono-latin-500-normal.woff2', weight: 500 },
    ],
    variable: '--font-si-mono',
  },
] as const satisfies readonly ReaderDirectionFont[]
