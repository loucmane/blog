# Quiet Monograph font assets

Vendored on 2026-10-06 from [Fontsource's font-files repository](https://github.com/fontsource/font-files),
which distributes Google Fonts subsets. These are font assets, not an installed package.
`sources.json` records the exact source URL, Git blob SHA, byte count and SHA-256 of every file.
Retrieval used the GitHub connector's base64 file reads; decoded bytes were checked against the
Git blob SHA before saving. No font binaries were modified locally.

| Family             | Version | Subset/style   | Weights       | Total bytes |
| ------------------ | ------- | -------------- | ------------- | ----------: |
| Cormorant Garamond | v21     | Latin / normal | 400, 500      |      46,188 |
| Jost               | v20     | Latin / normal | 300, 400, 500 |      29,756 |

Total: **75,944 bytes**. Latin includes Swedish Å/Ä/Ö and their lowercase forms. Other scripts
use the system fallback; there are no additional script subsets or unused weights to download.
The browser requests only faces used by text in the active direction. No external font service
is contacted during builds or browsing. If bytes change, change the filename and source record.

Both fonts are under SIL Open Font License 1.1. Full original texts and copyright notices are
included beside these files:

- [Cormorant-Garamond-OFL.txt](Cormorant-Garamond-OFL.txt), from
  [Google Fonts](https://github.com/google/fonts/blob/main/ofl/cormorantgaramond/OFL.txt),
  Git blob `507d70f4565352dbfcf2dfc9b42eb092b57c0be8`.
- [Jost-OFL.txt](Jost-OFL.txt), from
  [Google Fonts](https://github.com/google/fonts/blob/main/ofl/jost/OFL.txt),
  Git blob `85b6b99d12470b54d8cbc919bc45102d99f23437`.

## Fallback metrics

`src/reader-directions/quiet-monograph/fonts.ts` pins the same values produced by Next 16.3.8's
Google font loader with `adjustFontFallback: true`. They match the inherited production font
CSS. Reproduce them offline from the repository root using the already installed Next package:

```sh
node packages/web/src/reader-directions/quiet-monograph/font-metrics.mjs
```

| Family             | Local fallback  | Ascent override | Descent override | Line gap override | Size adjust |
| ------------------ | --------------- | --------------: | ---------------: | ----------------: | ----------: |
| Cormorant Garamond | Times New Roman |          95.27% |           29.59% |             0.00% |      96.98% |
| Jost               | Arial           |         111.45% |           39.06% |             0.00% |      96.01% |

The script calls Next's installed `calculateSizeAdjustValues`, which uses its Capsize metric
table and fallback average glyph width to compute size adjustment and scaled vertical metrics.
It is a maintenance tool only; runtime modules do not import it. When changing fonts, review
the metrics and measure CLS again. Keep `font-display: optional`: matching metrics alone cannot
prevent every line-wrap change during a late font swap.
