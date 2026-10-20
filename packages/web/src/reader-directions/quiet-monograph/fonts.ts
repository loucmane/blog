import type { ReaderDirectionFont } from '../contract'

// Local Latin subsets: 400 and 500 in each family, plus a genuine 400 italic, which shares the
// family's fallback. Sources, OFL licences and hashes live beside the files in
// public/reader-directions/quiet-monograph/fonts/. Each sha256 is its file's hash and versions the
// font URL, so new bytes need a new hash (fonts.test.ts checks). Reproduce these Next 16.3.8
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
      {
        file: 'cormorant-garamond-latin-400-normal.woff2',
        sha256: '8048ac209bec741e1c29cd0cfac5aac1c0c2ba8c3ddbd4a58fa9bd92ef5c63c2',
        weight: 400,
      },
      {
        file: 'cormorant-garamond-latin-500-normal.woff2',
        sha256: '8197bf53615ddc8c423f444c7f0eec63b7fa0ba093fcfbec60dfdd28429b0fc8',
        weight: 500,
      },
      {
        file: 'cormorant-garamond-latin-400-italic.woff2',
        sha256: 'e48e58027030df56869b795ca6f19b7012158275f7ad7cde1900b4a0b68d02e2',
        weight: 400,
        style: 'italic',
      },
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
      {
        file: 'jost-latin-400-normal.woff2',
        sha256: 'f94cffda16515fbb1667a2662d6b46f5610a942fd02fe88d67ff98f776288962',
        weight: 400,
      },
      {
        file: 'jost-latin-500-normal.woff2',
        sha256: '98dce4f076fe71a123a7cd44470e6f05e969cb6d7c9b2717766ad103e3597297',
        weight: 500,
      },
      {
        file: 'jost-latin-400-italic.woff2',
        sha256: '5e2038b7f8d366fc1c4036228b648b9a84676155e7a6235fab9c48a42f88ab41',
        weight: 400,
        style: 'italic',
      },
    ],
    variable: '--font-qm-text',
  },
] as const satisfies readonly ReaderDirectionFont[]
