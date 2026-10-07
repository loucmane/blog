# Swiss Index fonts

Unmodified Latin normal WOFF2 subsets from **Fontsource 5.3.0**, staged by the
coordinator from npm on 2026-10-07. Both tarballs' SHA-512 integrity values match the
coordinator's record; each vendored file was compared with its tarball entry.
The tarballs and extracted packages stay in ignored `ci-artifacts/`.

| Family            | Upstream metadata | Weights              | Use                                                  |
| ----------------- | ----------------- | -------------------- | ---------------------------------------------------- |
| Schibsted Grotesk | v7                | 400, 700, 800 normal | Body, story titles/strong emphasis, masthead/display |
| IBM Plex Mono     | v20               | 400, 500 normal      | Metadata/captions/code, labels and state             |

Total WOFF2 size: **104,192 bytes**. Schibsted 500 is omitted because the design
does not use it. Latin includes Å/Ä/Ö; other scripts use system fallbacks. Inline
emphasis uses browser-synthesized italic because this brief supplies normal faces
only. No files are renamed or modified to suggest genuine italics.

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
for that navigation. Capture tests warm fonts and reload before saving screenshots.
The maintenance script is never imported by runtime code. The host browser checks
must still measure CLS; metric overrides alone are not proof of zero shift.
