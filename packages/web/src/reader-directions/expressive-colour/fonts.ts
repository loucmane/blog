import type { ReaderDirectionFont } from '../contract'

// Fontsource 5.3.0 Latin subsets, trimmed offline by prepare-fonts.py to the used
// wght 400–900 and SOFT 30–100 ranges. All glyphs, features and genuine italics remain.
// Each sha256 is its file's hash and versions the font URL; prepare-fonts.py rewrites the
// Fraunces hashes with their bytes. Reproduce fallback metrics with font-metrics.mjs.
// Optional display prevents late swaps.
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
      {
        file: 'fraunces-latin-reader-normal.woff2',
        sha256: 'd577218299e0c251101fd2bf2e06b9bcb973948b46bec68a87285182694f9b12',
        weight: [400, 900],
      },
      {
        file: 'fraunces-latin-reader-italic.woff2',
        sha256: 'aacf7a6dcabddcb2e90adfd32eb32e03660ef0ed2c665bcb8fec18be8fc28c94',
        weight: [400, 900],
        style: 'italic',
      },
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
    variable: '--font-ec-mono',
  },
] as const satisfies readonly ReaderDirectionFont[]
