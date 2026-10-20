# Swiss Index fonts

Unmodified Latin WOFF2 subsets from **Fontsource 5.3.0**, staged by the
coordinator from npm on 2026-10-07. Both tarballs' SHA-512 integrity values match the
coordinator's record; each vendored file was compared with its tarball entry.
The tarballs and extracted packages stay in ignored `ci-artifacts/`. The two
Schibsted Grotesk italics were added on 2026-10-20 from the same Schibsted Grotesk
tarball, whose npm integrity is the one recorded in `sources.json`: the coordinator
extracted them on the host, and the copies here match their tarball entries' bytes
and SHA-256.

| Family            | Upstream metadata | Faces                                    | Use                                                            |
| ----------------- | ----------------- | ---------------------------------------- | -------------------------------------------------------------- |
| Schibsted Grotesk | v7                | 400, 700, 800 normal; 400 and 700 italic | Body, story titles/strong emphasis, masthead/display; emphasis |
| IBM Plex Mono     | v20               | 400, 500 normal                          | Metadata/captions/code, labels and state                       |

Total WOFF2 size: **156,080 bytes**. Schibsted 500 is omitted because the design
does not use it. Latin includes Å/Ä/Ö; other scripts use system fallbacks.

## Italics and the font budget

The developed-magazine spec (`docs/design/reader-bakeoff/swiss-index.md`, sections 3,
7 and 10) sets inline emphasis in the real italic face. Emphasis in text uses the 400
italic; emphasis in bold text (`strong`, headings and pull quotes) uses the 700 italic.
Both are genuine italics, with slanted outlines, a negative italic angle and the OS/2
italic bit; their PostScript names are `SchibstedGrotesk-Italic` and
`SchibstedGrotesk-BoldItalic`. They share the upright faces' vertical metrics, so the
family's one fallback serves both styles. There is no 800 italic: the wordmark, titles
and number plates hold no emphasis. IBM Plex Mono has upright 400 and 500 faces only,
so mono text never takes emphasis: inline code, in either order of marks, and list
markers stay upright and regular rather than take a synthesized slant or bold.

An italic is requested only on pages whose text uses it. Home, section, author, topic
and failure pages use the five normal faces (104,192 bytes; the spec's budget is
105,000). A typical story adds the 400 italic (129,728 bytes; budget 130,000). A story
with bold emphasis as well loads all seven faces, 156,080 bytes, within the 157,000 the
spec allows with both italics (raised from 155,000 by operator decision on 2026-10-20).
`src/reader-directions/swiss-index/fonts.test.ts` checks these totals.

`.si-page` keeps `font-synthesis: weight style`. Each family's metric-adjusted fallback
is one upright local face. On a cold view where a face misses its short block period,
its text keeps that fallback, and synthesis keeps bold and italic text bold and italic.

[`sources.json`](sources.json) records the package version, source tarball URL,
package-relative path, npm integrity, upstream project, bytes and SHA-256 for each
font and full licence:

- [`@fontsource/schibsted-grotesk` 5.3.0](https://registry.npmjs.org/@fontsource/schibsted-grotesk/-/schibsted-grotesk-5.3.0.tgz),
  [upstream](https://github.com/schibsted/schibsted-grotesk),
  [complete SIL OFL 1.1 licence](Schibsted-Grotesk-OFL.txt).
- [`@fontsource/ibm-plex-mono` 5.3.0](https://registry.npmjs.org/@fontsource/ibm-plex-mono/-/ibm-plex-mono-5.3.0.tgz),
  [upstream](https://github.com/IBM/plex),
  [complete SIL OFL 1.1 licence](IBM-Plex-Mono-OFL.txt).

## Stable first layout

The active direction root alone emits faces with `font-display: optional`, no font
preloads, and local metric-adjusted fallbacks. Reproduce the installed Next 16.3.8
Capsize table's `calculateSizeAdjustValues` output from the repository root:

```sh
node packages/web/src/reader-directions/swiss-index/font-metrics.mjs
```

| Family            | Local fallback | Ascent | Descent | Line gap | Size adjust |
| ----------------- | -------------- | ------ | ------- | -------- | ----------- |
| Schibsted Grotesk | Arial          | 93.46% | 24.67%  | 0.00%    | 104.49%     |
| IBM Plex Mono     | Arial          | 76.16% | 20.43%  | 0.00%    | 134.59%     |

These are Next's family-level adjusted Arial metrics (also for Plex Mono), not
measurements against a local monospace face. A cold optional fallback may persist
for that navigation. The shared `capture-fonts.ts` helper gates first layout on font
readiness and verifies the rendered faces before saving screenshots.
The maintenance script is never imported by runtime code. The host browser checks
must still measure CLS; metric overrides alone are not proof of zero shift.
