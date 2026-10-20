import type { ReaderDirectionFont } from '../contract'

// Fontsource 5.3.0 Latin subsets. Licences and measured hashes accompany the public assets.
// Each sha256 is its file's hash and versions the font URL, so new bytes need a new hash.
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
      {
        file: 'newsreader-latin-400-normal.woff2',
        sha256: 'e66067814f1c672d33a457e4f4d102c818b481420e2234cf685ebdbf2f443904',
        weight: 400,
      },
      {
        file: 'newsreader-latin-500-normal.woff2',
        sha256: '5613e2fc8377392c02e8ac9d55014689fb5320a5f2a7be55e8088a314728ac2c',
        weight: 500,
      },
      {
        file: 'newsreader-latin-600-normal.woff2',
        sha256: '05c91a26d19a61eafe7ce8e0b77eff3fd279ce994dc89f432f4cd06784935e84',
        weight: 600,
      },
      {
        file: 'newsreader-latin-400-italic.woff2',
        sha256: 'fa9b900403949d9a723106752a5c8ad2797012a0c9057427b1da2db72d552148',
        weight: 400,
        style: 'italic',
      },
      {
        file: 'newsreader-latin-600-italic.woff2',
        sha256: '63ff324ab27c27c3ad19c6c61b2fbee3b74931ad9909dd051e8be7340133ceaa',
        weight: 600,
        style: 'italic',
      },
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
      {
        file: 'libre-franklin-latin-400-normal.woff2',
        sha256: '50a24a85106ad722ab9d1353977c1f7b3b3d18465a807c0d6f1551b57a705f41',
        weight: 400,
      },
      {
        file: 'libre-franklin-latin-600-normal.woff2',
        sha256: 'aaa877781157fd03a54d6b0f27283e5b153a6d1b44a20c2d80c695f5e07d242b',
        weight: 600,
      },
    ],
    variable: '--font-ll-sans',
  },
] as const satisfies readonly ReaderDirectionFont[]
