# Cinematic Feature fonts

Unmodified Fontsource 5.3.0 Latin normal WOFF2 subsets, staged by the coordinator
from npm on 2026-10-07. SHA-512 integrity of both archives was verified against
the bead record, and each copied file matches its archive entry. Archives remain
in ignored `ci-artifacts/fonts-blog-0044.6/`; they are not vendored.

Archivo's single `archivo-latin-wdth-normal.woff2` contains both axes:
`wght` 100–900 (default 600) and `wdth` 62–125 (default 100). Display titles
select weight 850 and width 68%; prose selects 400 and normal width, strong
emphasis 700. Other headings use 800. Martian Mono supplies only 400 and 500.
Genuine Archivo italic 400 and 700 are separate static, normal-width faces,
staged by the coordinator from Fontsource's font-files repository on 2026-10-20.
They report font version 2.001, no variable axes, OS/2 width class 5 and italic
angle −10°. Their SHA-256 and Git blob hashes match the coordinator's
GitHub-verified record. The accompanying Archivo OFL is byte-identical to the
existing complete licence. These are unmodified upstream Latin subsets; no
local subset command was run and no npm package version is inferred for them.

Total WOFF2 size: **142,924 bytes** (180,000-byte budget). Latin includes Å/Ä/Ö;
other scripts use system fallback. Prose emphasis and combined bold/italic use
the genuine 400/700 italic faces. Emphasis inside condensed h2/h3 headings and
pull quotes selects normal width to match those genuine italic faces.
`.cf-page` allows weight and style synthesis so a cold optional-font visit
retains readable bold and italic emphasis over the adjusted Arial fallback.

[`sources.json`](sources.json) records exact bytes, SHA-256, package version,
archive URL, npm integrity, package path and upstream project for npm assets,
and source URL, internal font version, Git blob and licence for staged italics:

- [Archivo variable 5.3.0](https://registry.npmjs.org/@fontsource-variable/archivo/-/archivo-5.3.0.tgz),
  [upstream](https://github.com/Omnibus-Type/Archivo), [complete OFL](Archivo-OFL.txt).
- [Martian Mono 5.3.0](https://registry.npmjs.org/@fontsource/martian-mono/-/martian-mono-5.3.0.tgz),
  [upstream](https://github.com/evilmartians/mono), [complete OFL](Martian-Mono-OFL.txt).
- [Archivo 400 italic](https://github.com/fontsource/font-files/blob/main/fonts/google/archivo/files/archivo-latin-400-italic.woff2)
  and [700 italic](https://github.com/fontsource/font-files/blob/main/fonts/google/archivo/files/archivo-latin-700-italic.woff2),
  [complete OFL](Archivo-OFL.txt). Exact content is pinned by the hashes in `sources.json`.

## Fallback metrics and captures

Reproduce normal-width family metrics from the installed Next font table:

```sh
node packages/web/src/reader-directions/cinematic-feature/font-metrics.mjs
```

| Family       | Local fallback | Ascent | Descent | Line gap | Size adjust |
| ------------ | -------------- | ------ | ------- | -------- | ----------- |
| Archivo      | Arial          | 88.96% | 21.28%  | 0.00%    | 98.70%      |
| Martian Mono | Arial          | 63.69% | 12.74%  | 0.00%    | 157.02%     |

The script also measures each shipped Archivo binary. Normal and both italic
faces share 1,000 units per em, ascent 878, descent −210, line gap 0, x-height
526 and cap height 686. These independently measured vertical metrics support
retaining the shared family fallback above; they do not assert identical glyph
advances or wrapping between styles. CSS omits stretch for the static italics,
which declares normal width rather than the normal face's variable width range.

These are normal-width family metrics, not a claim that Arial reproduces the
condensed Archivo axis. `font-display: optional` and no font preloads prevent
a late font swap for both body and condensed titles. A cold navigation may
retain the adjusted fallback; its title can wrap differently but must not swap
later. Host checks must measure cold and warm CLS, including the condensed title.

The shared `capture-fonts.ts` helper gates first layout on font readiness and
verifies actual rendered faces before every screenshot. Capture readiness is
separate from cold-load performance. The maintenance script is never imported
by the registry or runtime; only the active direction emits font CSS.
