# Reader directions

A reader direction is one complete presentation of the public site. Readers see the default
direction, `baseline`. In the Reader Lab (`/owner/reader-lab`), the signed-in owner can view the
real site, with real published stories, in any registered direction.

## The contract

`defineReaderDirection()` in `contract.ts` takes:

| Field                                | What it is                                                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `id`                                 | Short lowercase kebab-case, such as `quiet-monograph`.                                                  |
| `name`, `thesis`                     | What the owner sees in the lab: a name of up to 48 characters and a one-line idea.                      |
| `Home`, `Article`, `Section`         | Server components that receive `{ view }` (`HomeView`, `ArticleView`, `SectionView`).                   |
| `Author`, `Topic` (optional)         | Server components that receive `{ view }` (`AuthorView`, `TopicView`); baseline's if left out.          |
| `NotFound`, `Unavailable` (optional) | Failure pages receiving `{ view: ReaderFailureView }`; baseline's if left out.                          |
| `Error` (optional)                   | Client-compatible failure page receiving `{ view: ReaderFailureView, reset }`; baseline's if left out.  |
| `imageSizes` (optional)              | Partial `{ body, gallery }` sizes map, passed to the Article component for forwarding to `ArticleBody`. |
| `fonts` (optional)                   | Local WOFF2 faces, a CSS variable, and metric-adjusted fallback data (see below).                       |
| `tokens` (optional)                  | CSS custom properties for `light` and `dark`, plus the `textPairs` that must reach WCAG AA (4.5:1).     |
| `styles` (optional)                  | CSS that is nested under the direction's root element, so it reaches only this direction.               |

Registration fails fast, with a `ReaderDirectionError`, on an invalid id, a missing view, an optional
view that is not a component, malformed image sizes, empty or overlong metadata, a malformed font,
a token with an unsafe value, a text pair below 4.5:1, or a duplicate id or name.

## Add a direction

1. Create a folder, for example `quiet-monograph/`, with the Home, Article, and Section views
   (and, if the direction has its own, the Author and Topic views) and an `index.ts` that exports
   `defineReaderDirection({ ... })`.
2. In `registry.ts`, import it and add it to `directions`.
3. Run the contract and registry tests, and then the browser checks (see [Checks](#checks)).

Nothing else changes. The routes, the lab page, and the lab bar pick the direction up from the
registry.

## What a view renders

- **The whole page below the root layout.** That includes the site header, `main`, and any
  footer. Render exactly one `h1`: the site name on home, the story title on an article, the
  section name on a section page, the author's name on an author page, and the topic's name on a
  topic page. Failure pages also have exactly one `h1`, naming the failure; their site name is a
  link, not another heading.
- **Only what the view provides.** Never fetch data or read cookies, and never hard-code copy that
  belongs to content. Use `siteName` from `@/reader/components/site-header` for the magazine's name.
- **Every page type.** An article view carries the byline as `authorLinks` (`authors` keeps the
  plain names), its categories and tags as `topics`, and a few `related` stories; each list may be
  empty. Author and topic pages list only visible stories and may have none, so give them an empty
  state. A direction without its own `Author` or `Topic` renders baseline's inside its own root,
  with its tokens and styles.
- **The shared renderers.** Use `ArticleBody` for story bodies, and `ReaderImageView` or
  `ReaderFigure` for images, so blocks and image privacy rules stay in one place. Style their
  semantic HTML and `data-block` attributes rather than reimplementing them.
- **Images are `<picture>` elements.** `ReaderImageView` renders resized AVIF and WebP variants
  with a fallback, as `<picture class="contents">` around the `<img>`. The picture takes no part in
  layout, but it does sit between the `<img>` and its parent in the DOM. So select images with a
  descendant selector such as `figure img`, never a child selector such as `figure > img`. Pass a
  `sizes` value that matches the width the image is laid out at, and set `preload` only on the
  page's lead image.

## Failure pages

`NotFound`, `Error`, and `Unavailable` each fall back independently to baseline's view. Their
`ReaderFailureView` contains `siteName` and `navigation`; navigation may be empty. The shared
failure model does not load stories, so a missing content store cannot break the recovery page.
Use the supplied site name and navigation and render exactly one `h1`, a `main`, and a way home.

The home unavailable state resolves presentation on the server and renders inside `ReaderPage`,
including the active direction's tokens/fonts and the owner's lab controls. Root not-found is
a server component with no request APIs. It passes the static Baseline view and root as children
to a small client upgrader, so its markup and header travel in the server payload rather than
the upgrader's JavaScript. The required client error boundary imports only `baseline/error`
and its static header/frame, keeping the other failure views out of its eager graph. Both use
the same upgrader, which imports no fallback presentation, contract, registry, or lab controls.

Once mounted, each boundary calls `resolveErrorPresentation` to confirm the owner selection on
the server. Only an authorized, still-current lab selection loads the registry and `ReaderPage`
on the client. The selected failure view then renders inside its direction root with lab controls.
A failed or stale lookup keeps Baseline and its working home/retry links. No browser cookie or
DOM attribute authorizes a lab direction. Client presentation upgrades do not redirect or change
the HTTP not-found status.

`NotFound` and `Error` views must be synchronous and client-compatible (no server-only imports).
The error view's `reset`
callback is Next's retry action; attach it to a button with `type="button"`. The error object,
message, stack, and digest are never passed to the view. The root boundary does not catch errors
in the root layout itself. Check actual server and client failures in a production browser;
component tests cannot prove Next boundary recovery or hydration behavior.
The failure-only dynamic import includes the registry's direction modules, so keep that module
graph client-compatible too. Normal article bodies still render as server components; this
hook does not turn them into client components on successful reader pages.

## Body and gallery image sizes

Set `imageSizes` on a direction, and forward the Article prop to the shared renderer:

```tsx
function Article({ view, imageSizes }: ArticleDirectionProps) {
  return (
    <main>
      <h1>{view.title}</h1>
      <ArticleBody blocks={view.body} imageSizes={imageSizes} />
    </main>
  )
}

defineReaderDirection({
  // ...id, name, thesis, Home, Section...
  Article,
  imageSizes: {
    body: '(min-width: 60rem) 48rem, 100vw',
    gallery: '(min-width: 60rem) 24rem, 50vw',
  },
})
```

Registration copies and freezes the map and supplies it to Article via a component wrapper.
Directions without a map retain their Article component; registering an already defined direction
reuses its frozen definition without adding another wrapper.
The map accepts only `body` and `gallery`, with nonempty string values and no markup,
declaration delimiters, or line breaks. It does not parse the full HTML `sizes` grammar;
verify that the browser selects candidates matching the actual layout. Omitted entries keep
`(min-width: 768px) 42rem, 100vw`. Existing directions need no changes until they opt in.

`ArticleBody` also accepts an explicit partial `imageSizes` map. It forwards both values through
nested quotes, lists, checklists, and editorial blocks to `ReaderFigure`/`ReaderImageView`, including
every responsive `<source>` and `<img>`. Hero and story-card hints remain separate. Responsive
sources, alt text, captions, credits, dimensions, and media authorization stay in the shared
renderer; do not replace it to customize sizes.

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
  Variable sources may use `weight: [min, max]` (integers 1–1000, ordered) and
  `stretch: ['min%', 'max%']` (percentages 25–200, ordered). These emit CSS ranges
  such as `font-weight: 100 900; font-stretch: 62% 125%`. Use only the axes the
  actual file provides. Arrays are copied and frozen. Omitting `stretch` and using
  a numeric weight preserves existing static font CSS byte for byte. Body text
  can retain normal width while display titles select a condensed `font-stretch`.
  Optional display still prevents a late font swap, including for condensed titles;
  validate actual CLS on the host, for both cold and warm font loads.
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
  The registry test renders every direction's author and topic pages and expects one `h1` each.
- `packages/web/tests/reader/author-topic-routes.test.ts` covers the author and topic routes, in
  the lab too.
- `packages/web/src/app/failure-views.test.tsx` covers custom/fallback failure views and reset;
  `packages/web/tests/reader/failure-views.test.ts` checks real owner selection on failure surfaces.
- `packages/web/src/reader/components/article-body.test.tsx` checks default and supplied sizes
  through nested figures/galleries. The registry test renders all registered failure views.
- Browser handoff: visit missing routes, trigger a server/client error, and simulate unavailable
  stories in each direction. At 390 and 1440 pixels, check one h1, axe, keyboard retry/home/lab
  controls, theme contrast, and active-only fonts. Also check initial error fallback, selection
  after hydration, failed selection lookup, and successful retry.
- `tests/e2e/reader-lab.spec.ts` opens every registered direction from the lab and runs axe on
  home, an article, and a section at 390 and 1440 pixels, with the lab bar showing.
- The [signed-in Lighthouse harness](../../../../scripts/lab-lighthouse.md) measures home,
  article, and section with the owner session and selected direction, and rejects baseline fallback.
