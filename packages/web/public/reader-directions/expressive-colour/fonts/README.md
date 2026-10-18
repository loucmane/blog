# Expressive Colour fonts

Self-hosted Latin WOFF2 subsets from Fontsource 5.3.0. The coordinator
downloaded the npm archives into `ci-artifacts/fonts-blog-0044.7/`; both archives'
SHA-512 integrity strings were verified before copying their contents here.
`sources.json` records package URLs, integrity, exact member paths, byte counts and
SHA-256 hashes for every file, including the complete SIL OFL 1.1 licences.
The Fraunces records also retain original hashes/byte counts and processing versions.
The archives are not vendored.

- **Fraunces:** `fraunces-latin-reader-{normal,italic}.woff2`, 56,036 + 70,336 bytes.
  The upstream SOFT subsets were 62,432 + 77,776 bytes, with `wght` 100–900 and
  `SOFT` 0–100. Offline instancing trims the unused ranges to `wght` 400–900 and
  `SOFT` 30–100, rebased at 400/30. All characters (222 normal, 223 italic), layout
  features and naming/licence records remain. The italic angle is still −16°.
  CSS still selects SOFT 100 for headlines and 30 for text. Neither optical-size
  nor width axes are shipped. The larger full/opsz files are unnecessary.
- **Martian Mono:** Latin normal 400 (10,352 bytes) and 500 (10,644 bytes).
  Used for labels/navigation and numbered markers/read affordances respectively.
- Total webfont payload: **147,368 bytes**, down from 161,204 (8.6%), loaded only by
  the active direction. Martian Mono remains unmodified.
  Real italics are used for the wordmark, decks and quotes. No remote font calls,
  preloads, font-loader imports, or stylesheet imports.

Reproduce metric-adjusted fallback declarations from the installed Next metric
table:

```sh
node packages/web/src/reader-directions/expressive-colour/font-metrics.mjs
```

Fraunces uses Times New Roman with size-adjust 115.45%, ascent 84.71%, descent
22.09%, line gap 0%. Martian Mono uses Arial with size-adjust 157.02%, ascent
63.69%, descent 12.74%, line gap 0%. The shared contract emits `font-display:
optional`, so an unavailable face cannot cause a late swap. Metrics alone do
not prove zero CLS; the direction browser suite measures cold and warm loads
without its separate screenshot font gate.

For exact reproduction, retrieve the archives at the `sources.json` URLs and
verify their `npmIntegrity`. Copy the two Martian Mono files and licences from
their recorded `package/<packagePath>` members. For Fraunces, install the offline
maintenance dependencies `fonttools==4.63.0` and `Brotli==1.1.0` in an isolated
Python environment, then run from the repository root:

```sh
python3 packages/web/src/reader-directions/expressive-colour/prepare-fonts.py \
  ci-artifacts/fonts-blog-0044.7/fontsource-variable-fraunces-5.3.0.tgz
pnpm exec prettier --write packages/web/public/reader-directions/expressive-colour/fonts/sources.json
```

The script verifies the archive's SHA-512, processes only the two Fraunces faces,
and compares every encoded glyph's decomposed outline and advance at weights
400/700/800/900 and SOFT 30/100 against the originals before writing. TrueType
rounding introduces at most 2.547 of 2000 font units (0.0013 em); no glyph is
removed. The script rejects differences above 3 units. It then writes the assets
and provenance hashes; it is not a runtime dependency or part of the app build.
Append `--check` to reproduce both faces and verify byte-for-byte equality without
writing files.
`fonts.test.ts` checks the files, glyphs, trimmed axes, italic style, metrics,
licences, hashes and a 150 KB regression budget offline.
