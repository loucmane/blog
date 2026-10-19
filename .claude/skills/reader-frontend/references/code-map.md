# Reader frontend code map

Read the files at the reviewed revision; this map records the Task 53 starting code, not a
promise that later implementations are identical. Report drift instead of repeating stale claims.

## Routes and data

- `packages/web/src/app/page.tsx`, `packages/web/src/app/stories/[slug]/page.tsx`, and
  `packages/web/src/app/sections/[slug]/page.tsx` call `connection()`, load reader views, then
  render the selected Home/Article/Section through ReaderPage. Home has a ReaderUnavailable
  state; absent or unavailable story/section views lead to `notFound()`.
- `packages/web/src/app/layout.tsx` provides `lang="en"` and ThemeProvider;
  `packages/web/src/app/globals.css` owns global styles. Direction views render the page
  below that layout, including header, main, and any footer. The one-h1 convention is in
  `packages/web/src/reader-directions/README.md`; verify actual rendered output.
- `packages/web/src/reader/views.ts` defines direction-neutral JSON shapes.
  `packages/web/src/reader/read-model.ts` uses published revision copy, picks the newest
  visible home lead and at most twelve recent stories, supplies `authors: []`, and returns
  null section descriptions. These are real data limits, not invitations to hard-code copy.
- `packages/web/src/reader/cache.ts` reads the publication version fresh for each request
  before looking up a process-scoped, version-keyed view cache (3,600-second revalidation).
  Tag expiry complements the version key. Performance proposals must preserve visibility
  after publication changes; backend consistency belongs to `content-platform-backend`.

## Images and editorial semantics

- `packages/web/src/reader/blocks.ts` converts document nodes and extracts an opening image
  as the hero; `packages/web/src/reader/components/article-body.tsx` is the shared body
  renderer. `editorial-blocks` owns changes to that projection and its semantic HTML.
- `packages/web/src/reader/components/reader-image.tsx` renders a `picture` with
  `className="contents"`. Use descendant selectors such as `figure img`; `figure > img`
  misses the image. Stored width/height preserve intrinsic dimensions. Without both,
  the fallback is a 3:2 cropped frame using the focal point. Cropped direction layouts
  must propagate focal points themselves when overriding intrinsic layout.
- ReaderImageView defaults to lazy loading; its `preload` flag sets high fetch priority
  and removes lazy loading. The shared component does not emit a preload link. The five
  designed directions have their own `image-preload.tsx` helpers; for example
  `packages/web/src/reader-directions/quiet-monograph/image-preload.tsx` emits a real
  responsive image link. Check link and image candidates/sizes agree and only the lead
  gets priority; do not infer current behavior from the shared component's flag name.
- ReaderFigure emits a figcaption when caption or credit exists, and ReaderImageCredit
  preserves credit links. Check meaningful alt text as a separate property. Current
  document media validation requires nonempty alt text; decorative editorial-image
  support would be a contract change, not an undocumented blank-alt convention.
- `packages/web/src/reader/media-variants.ts` builds AVIF/WebP and fallback sources using
  shared format rules, caps descriptors at original width, and lists none for unknown
  width. GIF, measured animation, or excessive pixel dimensions bypass variants.
- `packages/web/src/reader/media.ts` sets `public, no-cache` with ETags.
  `packages/web/src/app/api/media/[id]/route.ts` checks public visibility before query
  handling or a 304; a format the original's type does not allow returns 400, a variant that
  is ruled out (animated, over the pixel limit) or cannot be produced redirects (307) to the
  original, and storage failures return 500. Do not replace this with an optimizer that serves revoked images.

## Direction presentation and fonts

`packages/web/src/reader-directions/registry.ts` registers Baseline (the visitor default),
Quiet Monograph, Literary Long-read, Swiss Index, Cinematic Feature, and Expressive Colour.
Compare their Home/Article/Section views, `styles.ts`, `tokens.ts`, and `fonts.ts` in:

- `packages/web/src/reader-directions/quiet-monograph/` — quiet hierarchy and whitespace;
- `packages/web/src/reader-directions/literary-longread/` — long-form reading and serif type;
- `packages/web/src/reader-directions/swiss-index/` — numbered hierarchy and grid;
- `packages/web/src/reader-directions/cinematic-feature/` — image-led layouts and overlays;
- `packages/web/src/reader-directions/expressive-colour/` — story color pairs and display type.

These descriptions guide comparison; they do not rank styles or impose a redesign.

- `packages/web/src/reader-directions/contract.ts` accepts fonts as local WOFF2 data with
  metric-adjusted fallbacks. Generated faces use `font-display:optional`, never font
  preloads. `packages/web/src/reader-directions/direction-root.tsx` emits active-direction
  font rules and scoped tokens/styles; registry tests reject direction `next/font` and
  stylesheet imports. Check asset licenses and metrics alongside the actual fonts under
  `packages/web/public/reader-directions/`.
- `packages/web/src/reader-directions/contrast.ts` computes ratios for opaque hex, rgb(),
  and oklch() colors. The contract enforces 4.5:1 for declared `textPairs` in light and
  merged dark palettes. It does not discover every rendered pairing or measure text over
  photographs. Keep image-overlay and interactive-state checks explicit.
- `packages/web/src/reader-directions/capture-fonts.ts` is a screenshot-only gate: it hides
  first layout, loads fonts, then uses CDP to verify painted faces. This changes loading
  conditions and must not be used for visitor-performance evidence.

## Accessibility and performance evidence

| Evidence | What it establishes and what remains unverified |
| --- | --- |
| `playwright.config.ts` | Desktop Chromium and Pixel 7 Chromium projects; production build served in the local test runtime. It is not a cross-browser matrix. |
| `tests/e2e/homepage.spec.ts` and `tests/e2e/accessibility-baseline.json` | Axe WCAG 2/2.1/2.2 AA tags, no critical violations, exact serious/critical fingerprints; additional keyboard/theme tests. Automated coverage is scoped to tested pages/states. |
| `scripts/ci/check-accessibility-baseline.mjs` | Protected-base ratchet forbids adding/rewriting accepted fingerprints; do not relax the baseline to hide a failure. |
| `tests/e2e/reader-lab.spec.ts` | The only per-direction sweep: axe on every registered direction at 390 and 1440 px with the lab bar, lab-bar keyboard focus, and no font files on default pages. Run it for any direction change. |
| `tests/e2e/homepage.spec.ts` (article budget) | The one enforced anonymous performance budget: article HTML under 150,000 bytes and no editor bundles on reader routes. |
| `tests/e2e/reader.spec.ts` and direction-specific `.e2e.ts` files | Reader behavior and individual direction checks; inspect the selected test before claiming viewport/theme/focus coverage. |
| `packages/web/src/reader-directions/cinematic-feature/cinematic-feature.e2e.ts` | Cold/warm article layout-shift assertion below 0.05. |
| `packages/web/src/reader-directions/expressive-colour/expressive-colour.e2e.ts` | Cold/warm article layout-shift assertion equal to zero. Neither test establishes a universal production CLS budget. |
| `scripts/lab-lighthouse.mjs` and `scripts/lab-lighthouse.md` | Signed-in local fixture audit of home, article, section; verifies URL, HTTP 200, selected direction and lab bar, then records performance/accessibility scores, LCP, CLS, TBT. Scores are measurements, not enforced budgets. |

The Lighthouse harness uses fresh browser contexts and simulated mobile settings; server
image variants may already be warm. It writes a fresh run directory only after all three
routes verify. A failed run cannot reuse an old summary as new evidence. TBT is not INP:
the harness does not collect INP or field Core Web Vitals. Request real interaction/field
evidence where needed; record its absence, and keep proposed thresholds advisory until
there is an accepted budget and a reproducing check. Do not claim that a 95 score is a gate.

Use the tests appropriate to the change, within the active task's execution scope:

```sh
corepack pnpm exec vitest run packages/web/src/reader packages/web/src/reader-directions
corepack pnpm exec playwright test tests/e2e/homepage.spec.ts tests/e2e/reader.spec.ts tests/e2e/reader-lab.spec.ts
```

Direction browser configs live in each direction folder. The Lighthouse command needs
preinstalled tooling and a dedicated local fixture server; do not install dependencies,
seed a shared store, or start the persistent trial merely to conduct a review.

`docs/reader-lab-local.md` distinguishes the temporary in-memory lab from the persistent
local trial. `docs/reader-lab-owner-guide.md` provides qualitative owner comparison questions.
`docs/design/modern-blog-mockup-brief.md` is a 2025 mockup brief, with historical targets and
speculative features; it is not evidence that those features or budgets exist today.
