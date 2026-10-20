import type { ReaderDirectionFont } from '../contract'

// Unmodified Fontsource Latin subsets; provenance and OFL licences accompany the assets.
// Each sha256 is its file's hash and versions the font URL, so new bytes need a new hash.
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
      {
        file: 'archivo-latin-wdth-normal.woff2',
        sha256: 'e3a28eade21a900c7155a247757f4b2834c07bb7ef07ad7efa55cebaac1e8f5e',
        weight: [100, 900],
        stretch: ['62%', '125%'],
      },
      {
        file: 'archivo-latin-400-italic.woff2',
        sha256: 'aff750193376fa0cc7299242c3847f3c1189a78a23d526bfc205dbfc526a5403',
        weight: 400,
        style: 'italic',
      },
      {
        file: 'archivo-latin-700-italic.woff2',
        sha256: '8b6268c2884ad2b89cb947b6823f2218eaad07fcf8dec770ef95c244fdd3273a',
        weight: 700,
        style: 'italic',
      },
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
      {
        file: 'martian-mono-latin-400-normal.woff2',
        sha256: 'bb677c9c5cf5b384b5e4a1fd86755a47e0cbafe6bc70a9ba458b5e13e1d7a5c0',
        weight: 400,
      },
      {
        file: 'martian-mono-latin-500-normal.woff2',
        sha256: '98f9af6b1f769d57e58f6fd4e53d813be82106c7d24d84213a74836548e44071',
        weight: 500,
      },
    ],
    variable: '--font-cf-mono',
  },
] as const satisfies readonly ReaderDirectionFont[]
