# Quiet Monograph font assets

Vendored from [Fontsource's font-files repository](https://github.com/fontsource/font-files),
which distributes Google Fonts subsets. These are font assets, not an installed package.
`sources.json` records the exact source URL, Git blob SHA, byte count and SHA-256 of every file.
The normal faces were vendored on 2026-10-06 with the GitHub connector's base64 file reads. The
two italics were added on 2026-10-20: the coordinator downloaded them on the host and checked them
against GitHub's recorded Git blob SHAs. In both cases the bytes were checked against the Git blob
SHA before saving. No font binaries were modified locally.

| Family             | Version | Subset | Faces                | Total bytes |
| ------------------ | ------- | ------ | -------------------- | ----------: |
| Cormorant Garamond | v21     | Latin  | 400, 500, 400 italic |      69,848 |
| Jost               | v20     | Latin  | 400, 500, 400 italic |      30,968 |

Total: **100,816 bytes**. Every face of a family has the same name-table version (Cormorant
Garamond 4.001, Jost 3.710). Latin includes Swedish Å/Ä/Ö and their lowercase forms. Other scripts
use the system fallback; there are no additional script subsets or unused weights to download.
The browser requests only faces used by text in the active direction. No external font service
is contacted during builds or browsing. If bytes change, update the source record and the hash
declared in `fonts.ts` (see [Caching](#caching)).

## Italics and the font budget

The developed-magazine spec (`docs/design/reader-bakeoff/quiet-monograph.md`, sections 3 and 10)
sets deks, bios and descriptions in Cormorant italic and emphasis in story text in the italic of
its family. Both italics are genuine faces (italic angle −10° for Cormorant, −5° for Jost), and
`.qm-page` sets `font-synthesis: none`, so the browser never bolds a face and slants one only for
emphasis on a cold view (below). Jost 300 was removed: no style used it.

An italic is requested only on pages whose text uses it. Home uses at most five faces (89,728
bytes): the cover dek needs the Cormorant italic, and nothing on home needs the Jost italic. An
article with a dek and emphasis uses all six (100,816 bytes). The spec's budgets are 95,000 bytes
on home and 105,000 on an article; `src/reader-directions/quiet-monograph/fonts.test.ts` checks
both.

Each italic shares its family's metric-adjusted fallback (below), which has only an upright face.
On a cold view where a face misses its short block period, its text keeps that fallback. Where
Times New Roman and Arial are installed, deks, bios and pull quotes are then upright for that view,
because synthesis is off. Emphasis is the one exception: `em` sets `font-synthesis-style: auto`, so
the fallback is slanted and emphasis keeps its meaning. A genuine italic face never needs
synthesis, so warm views are unchanged. Upright fallbacks for every italic would need italic
fallback faces (`local("Times New Roman Italic")`, `local("Arial Italic")`), which only a shared
contract change can emit. Synthetic bold starts at weight 600, and the direction uses only 400 and
500, so a cold view draws the 500 weights at 400 with or without synthesis.

## Licences

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
It is a maintenance tool only; runtime modules do not import it. The italics have the same
vertical metrics as their family's upright faces (ascent, descent and line gap per 1,000 units:
Cormorant 924, −287 and 0; Jost 1,070, −375 and 0), so one fallback per family serves both
styles. When changing fonts, review the metrics and measure CLS again. Keep `font-display:
optional`: matching metrics alone cannot prevent every line-wrap change during a late font swap.

## Caching

The page requests each face as `<file>?v=<version>`, where the version is the first 16 hex
digits of the file's SHA-256. The hash is declared as `sha256` on the face's source in
`src/reader-directions/quiet-monograph/fonts.ts`, the same value as in `sources.json`. The server
caches these versioned URLs for a year as immutable. If a file's bytes change, update both
hashes: the URL changes with them, so returning readers fetch the new file. `fonts.test.ts`
fails while a declared hash differs from its file.
