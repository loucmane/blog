import type { ReaderDirectionFont } from '../contract'

// Fontsource 5.3.0 Latin subsets; full provenance and licences accompany the public assets.
// Schibsted Grotesk's genuine 400 and 700 italics share the family's fallback. Each sha256 is its
// file's hash and versions the font URL, so new bytes need a new hash. Reproduce the installed
// Next table's fallback metrics with font-metrics.mjs.
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
      {
        file: 'schibsted-grotesk-latin-400-normal.woff2',
        sha256: '437cd97c802be9f10f60b4db8a723261e5c35dfe1529de0562981871028bd670',
        weight: 400,
      },
      {
        file: 'schibsted-grotesk-latin-700-normal.woff2',
        sha256: 'd656a2dcc2bf850a9af5156f2de42f6051facfbaa8d5790cf31159de39bc2568',
        weight: 700,
      },
      {
        file: 'schibsted-grotesk-latin-800-normal.woff2',
        sha256: '46876fbd58d448ffabbffca1598e18cf25546e57d9b5e4b95ac576f935465292',
        weight: 800,
      },
      {
        file: 'schibsted-grotesk-latin-400-italic.woff2',
        sha256: 'b10306edd100a0706ea6060350f5a077a2e747bad1f46ec6605159719ba4a082',
        weight: 400,
        style: 'italic',
      },
      {
        file: 'schibsted-grotesk-latin-700-italic.woff2',
        sha256: '0cf55d899de73b4872bec42cf44565eeeda5a1fb24393e1d0c8b31fe363753e1',
        weight: 700,
        style: 'italic',
      },
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
      {
        file: 'ibm-plex-mono-latin-400-normal.woff2',
        sha256: '08949f728dc52d528e69b1667d15c89a5686a4ee9a296ff90983985f99c380f7',
        weight: 400,
      },
      {
        file: 'ibm-plex-mono-latin-500-normal.woff2',
        sha256: '01d285447409c8a588692162439a038b8cbd7871309ee20267b0d2d91c6e8e22',
        weight: 500,
      },
    ],
    variable: '--font-si-mono',
  },
] as const satisfies readonly ReaderDirectionFont[]
