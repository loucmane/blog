# Reader directions

A reader direction is one complete presentation of the public site. Readers see the default
direction, `baseline`. In the Reader Lab (`/owner/reader-lab`), the signed-in owner can view the
real site, with real published stories, in any registered direction.

## The contract

`defineReaderDirection()` in `contract.ts` takes:

| Field                        | What it is                                                                                          |
| ---------------------------- | --------------------------------------------------------------------------------------------------- |
| `id`                         | Short lowercase kebab-case, such as `quiet-monograph`.                                              |
| `name`, `thesis`             | What the owner sees in the lab: a name of up to 48 characters and a one-line idea.                  |
| `Home`, `Article`, `Section` | Server components that receive `{ view }` (`HomeView`, `ArticleView`, `SectionView`).               |
| `fonts` (optional)           | Local WOFF2 faces, a CSS variable, and metric-adjusted fallback data (see below).                   |
| `tokens` (optional)          | CSS custom properties for `light` and `dark`, plus the `textPairs` that must reach WCAG AA (4.5:1). |
| `styles` (optional)          | CSS that is nested under the direction's root element, so it reaches only this direction.           |

Registration fails fast, with a `ReaderDirectionError`, on an invalid id, a missing view, empty
or overlong metadata, a malformed font, a token with an unsafe value, a text pair below 4.5:1, or a
duplicate id or name.

## Add a direction

1. Create a folder, for example `quiet-monograph/`, with the three views and an `index.ts` that
   exports `defineReaderDirection({ ... })`.
2. In `registry.ts`, import it and add it to `directions`.
3. Run the contract and registry tests, and then the browser checks (see [Checks](#checks)).

Nothing else changes. The routes, the lab page, and the lab bar pick the direction up from the
registry.

## What a view renders

- **The whole page below the root layout.** That includes the site header, `main`, and any
  footer. Render exactly one `h1`: the site name on home, the story title on an article, and the
  section name on a section page.
- **Only what the view provides.** Never fetch data or read cookies, and never hard-code copy that
  belongs to content. Use `siteName` from `@/reader/components/site-header` for the magazine's name.
- **The shared renderers.** Use `ArticleBody` for story bodies, and `ReaderImageView` or
  `ReaderFigure` for images, so blocks and image privacy rules stay in one place. Style their
  semantic HTML and `data-block` attributes rather than reimplementing them.
- **Images are `<picture>` elements.** `ReaderImageView` renders resized AVIF and WebP variants
  with a fallback, as `<picture class="contents">` around the `<img>`. The picture takes no part in
  layout, but it does sit between the `<img>` and its parent in the DOM. So select images with a
  descendant selector such as `figure img`, never a child selector such as `figure > img`. Pass a
  `sizes` value that matches the width the image is laid out at, and set `preload` only on the
  page's lead image.

## Assets load only for the active direction

Next bundles `next/font` CSS into reader route entries even when `preload: false` prevents
font-file preloads. The inherited Next 16.3.8 production manifest confirms this for Quiet
Monograph; a dynamic import alone is not proof of isolation. Direction modules must never
import or re-export `next/font` (Google or local), or import a stylesheet, including dynamically.

- **Fonts are data.** Declare `fonts` in the direction's own `fonts.ts`, following
  [Quiet Monograph](quiet-monograph/fonts.ts). Each declaration provides a `variable` CSS custom
  property, a `genericFamily` (`serif`, `sans-serif` or `monospace`), `sources` of `{ file, weight, style? }`
  for the weights used, and a `fallback` with `family`, `ascentOverride`, `descentOverride`,
  `lineGapOverride` and `sizeAdjust`. Metrics are nonnegative percentages; size adjustment is positive.
  Source `style` accepts only `normal` or `italic`, defaults to `normal`, and is emitted as the
  face's `font-style`. Use genuine italic files when the direction uses italic text. Omitting
  `style` preserves the original normal-face output byte for byte.
  Document their source and reproduction command. The contract validates and freezes the data.
- **Local, licensed subsets.** Put WOFF2 files in `public/reader-directions/<id>/fonts/`, with
  their full licence text and source URLs/hashes. `file` is a lowercase filename, not a URL or
  path. Ship only subsets and weights actually used. No new per-direction shared plumbing is
  needed: the root generates URLs, unique family names, and scoped variable declarations.
- **Only the active root emits font CSS.** `ReaderDirectionRoot` renders an ordinary inline
  `<style data-reader-direction-fonts="<id>">` before the direction's content, with no `href` or
  `precedence`. It is removed on a switch to baseline; React must not retain it as a hoisted
  stylesheet. `@font-face` rules are top-level because selectors cannot scope them; their family
  names include the direction id and variable, and only that root gets the variables. Do not
  manually emit font rules or preloads from views, a shared layout, tokens, or `styles`.
- **Stable first layout.** Generated web faces use `font-display: optional`, no preloads, and
  local fallbacks with size/ascent/descent/line-gap overrides. A slow first visit can retain its
  adjusted fallback for that navigation; a warm visit can use the intended font immediately.
  Metrics alone do not guarantee zero shift; keep the no-late-swap policy and verify CLS in a browser.
- **Baseline has no font rules or references.** The registry remains safe to import on every
  route because declarations are plain data. Visitor authorization, cache behavior, publication
  versions and CSP are unchanged. Existing `font-src 'self'` and inline-style policy suffice.
- **No imported stylesheets** (`.css`, `.module.css`). Use Tailwind utilities, `tokens`, and
  `styles`. The page inlines a direction's tokens and styles only when it renders that direction.
  `registry.test.ts` rejects font and stylesheet imports; root and visitor tests guard active-only emission.
- **Page background.** If a direction paints its own page background, paint the root too (for
  example `styles: '& { background: var(--paper); }'`). The Reader Lab reserves room for its bar at
  the end of the root.

## Checks

- `vitest run packages/web/src/reader-directions` runs the contract, contrast, and registry tests.
- `tests/e2e/reader-lab.spec.ts` opens every registered direction from the lab and runs axe on
  home, an article, and a section at 390 and 1440 pixels, with the lab bar showing.
- The [signed-in Lighthouse harness](../../../../scripts/lab-lighthouse.md) measures home,
  article, and section with the owner session and selected direction, and rejects baseline fallback.
