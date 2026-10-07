# Cinematic Feature fonts

Unmodified Fontsource 5.3.0 Latin normal WOFF2 subsets, staged by the coordinator
from npm on 2026-10-07. SHA-512 integrity of both archives was verified against
the bead record, and each copied file matches its archive entry. Archives remain
in ignored `ci-artifacts/fonts-blog-0044.6/`; they are not vendored.

Archivo's single `archivo-latin-wdth-normal.woff2` contains both axes:
`wght` 100–900 (default 600) and `wdth` 62–125 (default 100). Display titles
select weight 850 and width 68%; prose selects 400 and normal width, strong
emphasis 700. Other headings use 800. Martian Mono supplies only 400 and 500.
Total WOFF2 size: **111,100 bytes**. Latin includes Å/Ä/Ö; other scripts use
system fallback. Inline italics are browser-synthesized from normal faces.

[`sources.json`](sources.json) records exact bytes, SHA-256, package version,
archive URL, npm integrity, package path and upstream project for every file:

- [Archivo variable 5.3.0](https://registry.npmjs.org/@fontsource-variable/archivo/-/archivo-5.3.0.tgz),
  [upstream](https://github.com/Omnibus-Type/Archivo), [complete OFL](Archivo-OFL.txt).
- [Martian Mono 5.3.0](https://registry.npmjs.org/@fontsource/martian-mono/-/martian-mono-5.3.0.tgz),
  [upstream](https://github.com/evilmartians/mono), [complete OFL](Martian-Mono-OFL.txt).

## Fallback metrics and captures

Reproduce normal-width family metrics from the installed Next font table:

```sh
node packages/web/src/reader-directions/cinematic-feature/font-metrics.mjs
```

| Family       | Local fallback | Ascent | Descent | Line gap | Size adjust |
| ------------ | -------------- | ------ | ------- | -------- | ----------- |
| Archivo      | Arial          | 88.96% | 21.28%  | 0.00%    | 98.70%      |
| Martian Mono | Arial          | 63.69% | 12.74%  | 0.00%    | 157.02%     |

These are normal-width family metrics, not a claim that Arial reproduces the
condensed Archivo axis. `font-display: optional` and no font preloads prevent
a late font swap for both body and condensed titles. A cold navigation may
retain the adjusted fallback; its title can wrap differently but must not swap
later. Host checks must measure cold and warm CLS, including the condensed title.

The shared `capture-fonts.ts` helper gates first layout on font readiness and
verifies actual rendered faces before every screenshot. Capture readiness is
separate from cold-load performance. The maintenance script is never imported
by the registry or runtime; only the active direction emits font CSS.
