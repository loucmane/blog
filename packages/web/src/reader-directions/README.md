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
| `fonts` (optional)           | `next/font` loaders, each with a `variable` and `preload: false`.                                   |
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

## Assets load only for the active direction

Next preloads every font declared anywhere in a route's module graph, and it bundles every
imported stylesheet into each reader page, whichever direction is active. A build of Next 16.3.8
(Turbopack) showed that `next/dynamic` does not change this. So:

- **Fonts** set `preload: false`. The page applies a direction's font `variable` classes only on
  that direction's root element, so the browser downloads a direction's font files only when that
  direction renders text with them. `registry.test.ts` fails if a direction font can preload.
- **No imported stylesheets** (`.css`, `.module.css`). Use Tailwind utilities, `tokens`, and
  `styles`. The page inlines a direction's tokens and styles only when it renders that direction.
  `registry.test.ts` fails on a stylesheet import.
- **Page background.** If a direction paints its own page background, paint the root too (for
  example `styles: '& { background: var(--paper); }'`). The Reader Lab reserves room for its bar at
  the end of the root.

## Checks

- `vitest run packages/web/src/reader-directions` runs the contract, contrast, and registry tests.
- `tests/e2e/reader-lab.spec.ts` opens every registered direction from the lab and runs axe on
  home, an article, and a section at 390 and 1440 pixels, with the lab bar showing.
