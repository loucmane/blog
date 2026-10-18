# Literary Long-read fonts

Unmodified Latin WOFF2 subsets from **Fontsource 5.3.0**, staged by the coordinator on
2026-10-07 from the npm registry. Each tarball's SHA-512 integrity was checked against
the coordinator's record, and every copied file was compared with its tarball entry.
Only the following seven faces and the full original SIL OFL 1.1 licences are vendored.
The tarballs and extracted package trees stay in ignored `ci-artifacts/`.

| Family         | Upstream metadata | Faces                                 | Role                                                        |
| -------------- | ----------------- | ------------------------------------- | ----------------------------------------------------------- |
| Newsreader     | v26               | 400, 500, 600 normal; 400, 600 italic | Reading text, titles, strong emphasis, deks and pull quotes |
| Libre Franklin | v20               | 400, 600 normal                       | Navigation, labels, bylines and captions                    |

Total WOFF2 bytes: **151,996**. No unused scripts or weights. Latin includes Swedish
Å/Ä/Ö; other scripts use system fallbacks. The browser fetches only faces used on the
active page. No font service or network fetch is required at build time.

The supplied Newsreader files are static **16pt optical instances**, not variable
fonts (no `opsz` axis). These exact coordinator-approved assets are used for display
and body; responsive type sizes do not imply variable optical sizing. No files have
been renamed to suggest otherwise or altered to add axes.

[`sources.json`](sources.json) records each file's package name and version, package-relative
path, source tarball URL, upstream project, npm integrity, byte count and SHA-256,
including both licences. Sources:

- [`@fontsource/newsreader` 5.3.0](https://registry.npmjs.org/@fontsource/newsreader/-/newsreader-5.3.0.tgz);
  upstream [Production Type Newsreader](https://github.com/productiontype/Newsreader);
  full [Newsreader licence](Newsreader-OFL.txt).
- [`@fontsource/libre-franklin` 5.3.0](https://registry.npmjs.org/@fontsource/libre-franklin/-/libre-franklin-5.3.0.tgz);
  upstream [Libre Franklin](https://github.com/googlefonts/Libre-Franklin);
  full [Libre Franklin licence](Libre-Franklin-OFL.txt).

## Stable first layout

Faces are direction data, emitted only by the active root with `font-display: optional`
and no font preload. The following fallback metrics come from the installed Next
16.3.8 Capsize metric table, using its `calculateSizeAdjustValues` helper, exactly as
Quiet Monograph does. Reproduce offline from the repository root:

```sh
node packages/web/src/reader-directions/literary-longread/font-metrics.mjs
```

| Family         | Local fallback  | Ascent | Descent | Line gap | Size adjust |
| -------------- | --------------- | ------ | ------- | -------- | ----------- |
| Newsreader     | Times New Roman | 69.68% | 25.12%  | 0.00%    | 105.48%     |
| Libre Franklin | Arial           | 92.61% | 23.58%  | 0.00%    | 104.31%     |

These family-level metrics use Next's table, not newly measured per-style metrics.
The maintenance script is never imported by the runtime. Optional display prevents
late font swaps; the coordinator's production browser checks must verify CLS is zero.
If assets change, update filenames, provenance, metrics and performance evidence.
