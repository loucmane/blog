# Expressive Colour: developed-magazine spec

**Status:** draft for the Reader Lab bake-off (`blog-0044.27`). It is not owner-approved; the client
chooses between the five developed directions at `blog-0044.30`.

- **Direction:** `expressive-colour` (E), defined in `ec/index.ts:9-19` and registered last in
  `rd/registry.ts:15-22`.
- **Starting commit:** `cb6d081` (`origin/main`). Every statement about "today" is true at that
  commit and cites the file.
- **Depends on:** K0 `blog-0044.32` (article-author linkage), K1 `blog-0044.22` (optional `Author`
  and `Topic` views; `ArticleView.authorLinks`, `topics` and `related`), K3 `blog-0044.29` (authors,
  topics and more stories in the North House sample) and K4 `blog-0044.34` (optional `NotFound` and
  `Error` views, and a direction hook for body and gallery image `sizes`). None is merged at
  `cb6d081`. Names follow those beads' plans; builders use the names that land.
- **Paths:** `ec/` is `packages/web/src/reader-directions/expressive-colour/`, `rd/` is
  `packages/web/src/reader-directions/` and `reader/` is `packages/web/src/reader/`. Other paths are
  repository-relative.
- **Data limits:** the reader has no author portraits (`packages/web/src/server/database/schema.ts:33-44`),
  no taxonomy descriptions (`schema.ts:215-226`), section descriptions are `null`
  (`reader/read-model.ts:206`) and article authors are `[]` until K1 (`reader/read-model.ts:179`).
  Bios, descriptions, authors, topics and related stories may all be empty; every module below is
  omitted when its data is empty, and nothing is invented to fill it.

## 1. Thesis

Every story is a coloured object. Each story owns one of six saturated colours, and that colour
follows it everywhere: its card on the front page, the cover band of its article, its pull quotes
and key points, and every list it appears in, from sections and topics to an author's page and
"Read next". Soft, heavy Fraunces letters and small mono pill labels make the magazine warm and a
little playful, while the reading column stays calm paper by day and night ink in the dark.

**The feeling:** recognition and delight, like a shelf of colour-coded paperbacks or a stack of
risograph pamphlets: "that's the blue one about the boathouse". Cheerful and collectable, never
loud where people read.

**What separates it from the other four:**

| Direction          | Its idea (today)                                                                                                                                 | What Expressive Colour does instead                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Quiet Monograph    | One paper palette with no accent, generous space, one story at a time (`rd/quiet-monograph/index.ts:17-18`, `rd/quiet-monograph/tokens.ts:3-31`) | Six colours and many stories at once                                                          |
| Literary Long-read | Words first, one oxblood accent and a drop cap (`rd/literary-longread/index.ts:17`, `rd/literary-longread/tokens.ts:9,24`)                       | Colour is each story's identity and the reader's wayfinding, not an accent                    |
| Swiss Index        | Grotesk type, precise rules, one signal orange (`rd/swiss-index/index.ts:17`, `rd/swiss-index/tokens.ts:8`)                                      | Rounded colour blocks and a soft serif; numbers are decoration, not navigation                |
| Cinematic Feature  | A dark ground, expansive images, condensed titles (`rd/cinematic-feature/index.ts:17`, `rd/cinematic-feature/tokens.ts:5`)                       | Pictures are framed inside colour blocks; a story without pictures is just as strong (motifs) |

E shares Martian Mono with Cinematic Feature (`rd/cinematic-feature/fonts.ts:21-35`,
`ec/fonts.ts:22-36`) for small labels only; its display and reading face, Fraunces with the SOFT
axis, is used by no other direction.

**The rule that holds it together:** story colours are surfaces, never text. Text on a swatch is
always that swatch's on-colour (ink or paper, `ec/colours.ts:18-28`); text on the page ground is
always ink or soft ink. Every text pair in the direction is therefore a declared, tested pair (5).

## 2. Pages and layout

Breakpoints are mobile below 768px, tablet 768–1023px and desktop from 1024px (4).

### 2.1 Every page

DOM order: skip link "Skip to content" → masthead `header` (wordmark, Theme control,
`nav aria-label="Sections"` with "All stories" and every section) → `main#ec-main` → `footer`
(six-colour stripe, wordmark, `nav aria-label="Footer"` repeating "All stories" and the sections).

- **Today:** the skip link says "Skip to stories" on every page (`ec/shell.tsx:27-29`); the wordmark
  is the `h1` on home and a `p` elsewhere, at one size everywhere (`ec/shell.tsx:22,31-41`,
  `ec/styles.ts:19`); the pills are in `ec/shell.tsx:42-60`; the footer has the name and
  "All stories ↗" (`ec/shell.tsx:65-70`). E renders no theme control: only baseline's header renders
  `ThemeMenu` (`reader/components/site-header.tsx:29`).
- **Desktop:** masthead row 1 has the wordmark on the left and the shared `ThemeMenu` on the right;
  row 2 has the pills. The home wordmark uses `--ec-wordmark`; inner pages use `--ec-wordmark-sm`
  so the page's own `h1` leads. On home only, the issue's spine strip (2.8) sits under the pills.
  The footer stripe runs the full content width, then the wordmark on the left and the footer pills on
  the right.
- **Tablet:** as desktop; pills wrap.
- **Mobile:** the wordmark wraps to two lines beside the Theme control; pills wrap onto more rows
  (no horizontal scroller, so no section is hidden and 320px reflow holds); the footer stacks.

### 2.2 Home

`HomeView` is a lead plus at most twelve recent stories (`reader/views.ts:50-56`,
`reader/read-model.ts:38`). Today it is one `ol.ec-grid` labelled "Stories, newest first": a
full-width lead, then identical cards three, two or one per row (`ec/home.tsx:6-24`,
`ec/styles.ts:30,50-54,113-119`).

Developed: still one `ol` labelled "Stories, newest first", numbered 01…13, every title an `h2`,
in four tiers by position:

| Position | Tier         | Desktop                                                                  | Tablet                                      | Mobile                     |
| -------- | ------------ | ------------------------------------------------------------------------ | ------------------------------------------- | -------------------------- |
| 1        | Lead         | Full width: copy in the left 5/12, image in the right 7/12 at 4:3        | Full width: image on top at 3:2, copy below | As tablet                  |
| 2–3      | Secondary    | Two half-width cards, image on top at 3:2                                | Two half-width cards                        | One column                 |
| 4–9      | Standard     | Three per row, copy first, image below at 4:3 (today's card)             | Two per row                                 | One column                 |
| 10–13    | Compact rows | Full-width rows: colour chip with the number, title, section, date, time | As desktop                                  | Meta wraps under the title |

- Compact rows have no image and no dek, so the tail of the page loads no pictures.
- A lone secondary (exactly two stories) takes the lead's horizontal layout at secondary size.
  Partial standard rows stay left-aligned.
- **Empty** (`lead: null`): keep today's `section.ec-empty` with the `h2` "No stories yet" and its
  sentence (`ec/home.tsx:26-30`), add a large decorative motif, and keep the wordmark as the `h1`.

### 2.3 Section

`SectionView` lists every visible story in the section, newest first, with no limit
(`reader/read-model.ts:192-214`). Today: a label "Section · N stories", an `h1` with a colour chip
taken from the section slug, the description when present, a three-column grid and an empty
paragraph (`ec/section.tsx:14-41`).

Developed:

- **Header (2.8):** label "Section · N stories", the `h1` with the section chip, the description when
  non-null, the spine strip.
- **List:** position 1 is a lead card, positions 2–13 standard cards, 14 and later compact rows.
  Desktop, tablet and mobile follow the home tiers.
- **Empty:** the home empty block with today's sentence, "No stories have been published in this
  section yet." (`ec/section.tsx:40`).

### 2.4 Article

`ArticleView` (`reader/views.ts:68-84`) plus K1's `authorLinks`, `topics` and `related`. Today: a
colour band with the section pill (or "Story"), the reading time and the `h1`
(`ec/article.tsx:21-33`); the dek and "Words by … · date" sit below the band
(`ec/article.tsx:34-40`); a full-width hero (`ec/article.tsx:41-45`); a 65ch body
(`ec/article.tsx:46-48`, `ec/tokens.ts:30`).

Developed DOM order inside `article[data-story-colour]`:

1. **Cover band** (`header`, story colour, 1.5rem radius): meta row (section pill linking to the
   section, or "Story" when there is none, as today; reading time); the `h1`; the dek; the byline
   "By A and B · October 2, 2026" with author links from `authorLinks` (names from `authors` before
   K1; the "By" part is omitted when empty; the `time` always shows, formatted by
   `reader/format.ts:1-5`).
2. **Hero** `figure`, placed by the hero's orientation, r = width ÷ height:
   - **Landscape** (r ≥ 1.2) or unknown dimensions: below the band at full content width, natural
     ratio, at most 80svh tall (cropped around the focal point beyond that). Same on every
     breakpoint.
   - **Square or portrait** (r < 1.2): on desktop, inside the band as a cover: copy in the left 7/12,
     the figure in the right 5/12 at its natural ratio (at most min(80svh, 46rem) tall, then cropped
     around the focal point), its caption in the on-colour. On tablet and mobile, below the band,
     centred, at most 36rem wide.
   - **No hero:** on desktop the story's motif fills the band's right 5/12 (decorative). Tablet and
     mobile show no motif, so the band stays compact.
3. **Body:** a 45rem measure, centred; galleries break out to 72rem and pull quotes to 56rem on
   desktop (4, 7.5).
4. **End mark:** a 0.75rem dot in the story colour after the last block (decorative).
5. **Filed under:** `nav aria-label="Topics"` with a mono label and topic pills (omitted when
   `topics` is empty).

After the `article`, still inside `main`: **Read next**, a `section` labelled by its `h2`, with the
`related` stories as standard cards (`h3` titles, no numbers), three per row on desktop, two on
tablet, one on mobile; omitted when `related` is empty.

- **Long titles** (more than 80 characters, such as the 158-character boathouse title,
  `packages/web/src/server/lab/north-house.ts:355-356`) step down to `--ec-title-long`.
- **Short story** (the shelf story has two paragraphs, `north-house.ts:386-399`): the same structure;
  the end mark, topics and Read next keep the page from stopping short.
- **Image-free** (the chair story, `north-house.ts:359-384`): the band with its motif on desktop, no
  hero and no image preload.

### 2.5 Author (K1 `AuthorView`)

K1 plans name, slug, href, bio or `null`, stories and navigation. There is no portrait, and none is
faked.

- **Header:** label "Author · N stories"; an author mark, a decorative motif drawn from the author's
  slug in `storyColour(authorSlug)` (6rem rounded square, left of the `h1` on desktop and tablet,
  above it on mobile); the `h1` with the name; the bio as an italic dek (at most 34em) when non-null;
  the spine strip.
- **List:** as a section.
- **Empty:** whether an author without visible stories is a 404 is K1's choice; if the view arrives
  with no stories, show the home empty block with "No stories are published here yet."

### 2.6 Topic (K1 `TopicView`)

K1 plans name, slug, href, description or `null`, stories and navigation.

- **Header:** label "Topic · N stories"; the `h1` with a hollow ring chip (sections use a filled
  chip); the description when non-null; the spine strip.
- **List and empty state:** as an author.

### 2.7 Not found, error and unavailable

Today the story and section routes call `notFound()` before the direction is resolved
(`packages/web/src/app/stories/[slug]/page.tsx:57-61`,
`packages/web/src/app/sections/[slug]/page.tsx:43-47`), so the global
`packages/web/src/app/not-found.tsx` and `packages/web/src/app/error.tsx` render outside any
direction. "Unavailable" is the shared `ReaderUnavailable` (`reader/components/reader-unavailable.tsx:7-23`).
K4 plans optional per-direction `NotFound` and `Error` views. When it lands (b3):

- E's shell, with section pills when the hook supplies navigation and "All stories" otherwise. The
  error view is a client component (Next error boundaries are), so it uses only `siteName`,
  `next/link` and its `reset` prop.
- One paper block with a 3px ink outline and a large decorative motif: a label ("Error 404" or
  "Error"), the `h1` "Page not found" or "Something went wrong", one sentence, and an
  "All stories" pill. The error view adds a "Try again" pill button (44px) that calls `reset`.
- Unavailable keeps the wordmark as `h1` and uses the `h2` "Stories are unavailable" with the
  shared sentence.
- Desktop puts the motif in the right 5/12; tablet and mobile put an 8rem motif above the text.
- If K4 has not merged by b3, b3 records the gap.

### 2.8 Page header and spine strip

The section, author and topic pages share one header component (label, `h1`, chip or mark,
description or bio, spine strip). The **spine strip** is a decorative `div aria-hidden="true"` of up
to 24 rounded bars (0.5rem by 2.5rem, 0.25rem apart), one per listed story in list order, each in
that story's colour. It is hidden in forced colours and in print.

## 3. Typography

**Families: no change, no new font, no new licence.**

| Face                                                                         | Use                                   | Files (bytes)                                                                                  | Licence                             |
| ---------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------- |
| Fraunces, variable `wght` 400–900 and `SOFT` 30–100, upright and real italic | All display and reading text          | `fraunces-latin-reader-normal.woff2` (56,036), `fraunces-latin-reader-italic.woff2` (70,336)   | SIL OFL 1.1, `Fraunces-OFL.txt`     |
| Martian Mono 400 and 500                                                     | Labels, pills, numbers, credits, code | `martian-mono-latin-400-normal.woff2` (10,352), `martian-mono-latin-500-normal.woff2` (10,644) | SIL OFL 1.1, `Martian-Mono-OFL.txt` |

The files, provenance and licences are in `packages/web/public/reader-directions/expressive-colour/fonts/`
(`README.md`, `sources.json`). The total is 147,368 bytes against a 150,000-byte test budget
(`ec/fonts.test.ts:129-130`). The fallbacks are Times New Roman at 115.45% and Arial at 157.02%
(`ec/fonts.ts:8-29`), and the contract emits `font-display: optional` (`rd/contract.ts:451`).

**Settings (kept):** body `wght` 400, `SOFT` 30; strong 700; headings 800, `SOFT` 100, −0.035em
tracking, 1.08 leading (`ec/styles.ts:7,10`); wordmark 900, `SOFT` 100, −0.06em, last word in real
italic 700 (`ec/styles.ts:19-21`, `ec/shell.tsx:33-39`). **Added:** `font-synthesis: none` on the
page, so Martian Mono never gets faux bold or italic; titles use `text-wrap: balance` (browsers fall
back to normal wrapping past six lines) and body text `text-wrap: pretty`.

**Scale** (px; fluid tokens resolved at 390, 768, 1024 and 1440px wide; at 360px every token equals
its 390px value except the wordmarks, 40.6 and 28px):

| Token              | Value                                     | 390  | 768  | 1024 | 1440  | Use                                    | Today                       |
| ------------------ | ----------------------------------------- | ---- | ---- | ---- | ----- | -------------------------------------- | --------------------------- |
| `--ec-label`       | 0.75rem                                   | 12   | 12   | 12   | 12    | Mono labels, pills, meta               | 0.6875rem (11px)            |
| `--ec-small`       | 0.8125rem                                 | 13   | 13   | 13   | 13    | Credits, footer                        | 0.75rem                     |
| `--ec-copy`        | 1.125rem                                  | 18   | 18   | 18   | 18    | Card deks, code, methodology           | same                        |
| `--ec-body`        | 1.25rem, leading 1.75                     | 20   | 20   | 20   | 20    | Article body                           | same (`ec/tokens.ts:22,29`) |
| `--ec-row`         | clamp(1.25rem, 1.1rem + 0.4vw, 1.5rem)    | 20   | 20.7 | 21.7 | 23.4  | Compact-row titles                     | new                         |
| `--ec-card`        | clamp(1.5rem, 1.25rem + 0.75vw, 2.125rem) | 24   | 25.8 | 27.7 | 30.8  | Standard and related card titles       | was 30–38px for every card  |
| `--ec-card-lg`     | clamp(1.875rem, 1.5rem + 1vw, 2.75rem)    | 30   | 31.7 | 34.2 | 38.4  | Secondary card titles                  | today's `--ec-card`         |
| `--ec-dek`         | clamp(1.375rem, 1.1rem + 1vw, 2rem)       | 22   | 25.3 | 27.8 | 32    | Article and lead deks, bios            | min 24px                    |
| `--ec-h3`          | clamp(1.5rem, 1.3rem + 0.5vw, 1.875rem)   | 24   | 24.6 | 25.9 | 28    | Body `h3`                              | was `--ec-dek`              |
| `--ec-heading`     | clamp(1.875rem, 1.5rem + 1.25vw, 2.75rem) | 30   | 33.6 | 36.8 | 42    | Body `h2`, pull quotes                 | was 32–52px                 |
| `--ec-lead`        | clamp(2.5rem, 1.4rem + 3vw, 4.75rem)      | 40   | 45.4 | 53.1 | 65.6  | Lead card titles                       | same                        |
| `--ec-title`       | clamp(2.75rem, 1.4rem + 5.5vw, 6.5rem)    | 44   | 64.6 | 78.7 | 101.6 | Article, section, author, topic `h1`   | same                        |
| `--ec-title-long`  | clamp(2.25rem, 1.2rem + 3.5vw, 4.5rem)    | 36   | 46.1 | 55   | 69.6  | Any `h1` over 80 characters            | new                         |
| `--ec-wordmark`    | clamp(2.5rem, 1.75rem + 3.5vw, 5.25rem)   | 41.7 | 54.9 | 63.8 | 78.4  | Home wordmark                          | same, on every page         |
| `--ec-wordmark-sm` | clamp(1.75rem, 1.4rem + 1.5vw, 2.75rem)   | 28.3 | 33.9 | 37.8 | 44    | Wordmark on inner pages and the footer | new                         |

Card titles over 80 characters step down one size (lead to `--ec-card-lg`, secondary to
`--ec-card`, standard to `--ec-row`), using a class computed from the title's length. Body `h4` is
1.25rem/800, `h5` 1.125rem/800 italic, `h6` a 0.875rem mono label in capitals.

**Line lengths.** Today the measure is `65ch` (`ec/tokens.ts:30`). Fraunces' zero is wide: 0.6485em,
against 0.5256em for an average lowercase letter or space (measured from
`fraunces-latin-reader-normal.woff2`). So 65ch is 843px, about 80 characters per line, when
Fraunces renders, and 750px, about 68 characters, when a cold load keeps the metric-adjusted Times
fallback (Times' zero is 0.5em, scaled by 115.45%). The column width therefore changes between cold
and warm visits. **Change it to `45rem` (720px):** about 68 characters per line in Fraunces and 66 in
the fallback, in the same box either way, which also makes body image `sizes` exact. Deks are at
most 34em, titles at most 14em (replacing `max-width: 22ch`, `ec/styles.ts:57`), bios and
descriptions 34em.

## 4. Grid, spacing and breakpoints

- **Breakpoints:** mobile below 768px, tablet 768–1023px, desktop from 1024px (today's queries,
  `ec/styles.ts:113,118`). The page stops growing at 88rem, 1408px (`ec/tokens.ts:31`).
- **Page:** `max-width: 88rem`, gutter `clamp(1rem, 3vw, 3rem)` (`ec/tokens.ts:31-32`). The content
  width is 1312px from 1600px wide, 1323–1312px between 1408 and 1600px (1322px at 1440px), 94vw
  from 534 to 1407px and 100vw − 2rem below 534px.
- **Grid:** 12 columns on desktop, 6 on tablet, 1 on mobile; gap `--ec-gap`,
  `clamp(1rem, 2vw, 1.75rem)` (`ec/tokens.ts:33`).

| Element                    | Desktop                          | Tablet             | Mobile     |
| -------------------------- | -------------------------------- | ------------------ | ---------- |
| Lead card                  | 12 columns; inside 5/12 + 7/12   | 6 columns, stacked | 1, stacked |
| Secondary card             | 6                                | 3                  | 1          |
| Standard and related cards | 4                                | 3                  | 1          |
| Compact row                | 12                               | 6                  | 1          |
| Article band (cover split) | 12; inside 7/12 + 5/12, 3rem gap | 6, single column   | 1          |

- **Article columns:** measure 45rem, feature 56rem (pull quotes), wide 72rem (galleries) and full
  content (landscape hero). `.ec-body` becomes a full-content-width grid with named lines; every
  block sits in `measure`, pull quotes in `feature` and galleries in `wide` from 1024px. The side
  tracks shrink to zero first, so narrow screens get one full-width column:

  ```css
  grid-template-columns:
    [full-start] minmax(0, 1fr)
    [wide-start] minmax(0, calc((var(--ec-wide) - var(--ec-feature)) / 2))
    [feature-start] minmax(0, calc((var(--ec-feature) - var(--ec-measure)) / 2))
    [measure-start] min(var(--ec-measure), 100%)
    [measure-end] minmax(0, calc((var(--ec-feature) - var(--ec-measure)) / 2))
    [feature-end] minmax(0, calc((var(--ec-wide) - var(--ec-feature)) / 2))
    [wide-end] minmax(0, 1fr) [full-end];
  ```

- **Spacing tokens:** card padding `clamp(1.25rem, 2vw, 2rem)` (today, `ec/styles.ts:32`), lead
  padding `clamp(1.5rem, 3vw, 3rem)` and lead gap `clamp(2rem, 4vw, 4rem)` (`ec/styles.ts:51`), band
  padding `clamp(1.5rem, 5vw, 5rem)` (`ec/styles.ts:55`), page rhythm `--ec-space`
  `clamp(3rem, 6vw, 6rem)` between masthead, header, list, article end and footer
  (`ec/tokens.ts:34`). Radii: 1.5rem for cards and bands (`ec/tokens.ts:35`), 0.75rem for images
  inside them, code and callouts (`ec/styles.ts:45`). Body blocks 1.5rem apart, headings 3rem
  above and 1rem below (`ec/styles.ts:66-67`).

## 5. Colour

**Today:** paper `#FBF4EA`, ink `#1D1A2B` and six swatches whose foreground is the stronger of ink
or paper (`ec/colours.ts:3-28`); tokens are light only (`ec/tokens.ts:11-41`) and a test asserts
there is no dark set (`ec/colours.test.tsx:80`); the root forces `color-scheme: light`
(`ec/styles.ts:5`); the browser test asserts the paper ground in dark mode
(`ec/expressive-colour.e2e.ts:165-169`).

**Developed: "night print".** E follows the site theme. The contract writes dark overrides under
`.dark` (`rd/contract.ts:420-428`), and tokens the dark set does not name keep their light values
(`rd/contract.ts:65-66`). The swatches and their on-colours are not overridden, so a story's colour
card looks the same day and night; only the ground, the text and two quiet surfaces change. The
root uses `color-scheme: var(--ec-scheme)`. The swatch tokens stay generated from `ec/colours.ts`,
the single source of colour truth (`ec/tokens.ts:4-9`).

| Token                              | Light                 | Dark (night print) | Role                                                |
| ---------------------------------- | --------------------- | ------------------ | --------------------------------------------------- |
| `--ec-scheme`                      | `light`               | `dark`             | `color-scheme` of the root                          |
| `--ec-paper`                       | `#FBF4EA`             | `#17141F`          | Page ground; paper-surface cards                    |
| `--ec-paper-2`                     | `#F2E8D8`             | `#231F2D`          | Code, inline code, fact boxes, notes                |
| `--ec-ink`                         | `#1D1A2B`             | `#F1E8DA`          | Text, rules, outlines, focus rings on the ground    |
| `--ec-ink-soft`                    | `#514B63`             | `#C4BBCB`          | Captions, dates and meta on the ground, methodology |
| `--ec-cobalt` / `--ec-on-cobalt`   | `#2F45D6` / `#FBF4EA` | unchanged          | Story surface / its text                            |
| `--ec-saffron` / `--ec-on-saffron` | `#F2A93B` / `#1D1A2B` | unchanged          |                                                     |
| `--ec-rose` / `--ec-on-rose`       | `#E86A8E` / `#1D1A2B` | unchanged          |                                                     |
| `--ec-forest` / `--ec-on-forest`   | `#276451` / `#FBF4EA` | unchanged          |                                                     |
| `--ec-lilac` / `--ec-on-lilac`     | `#B8A1DF` / `#1D1A2B` | unchanged          |                                                     |
| `--ec-brick` / `--ec-on-brick`     | `#AD352C` / `#FBF4EA` | unchanged          |                                                     |

**Text pairs** (all declared in `tokens.textPairs`, so registration fails below 4.5:1 in either theme;
ratios from the WCAG formula in `rd/contrast.ts:104-118`; target at least 4.5:1, and 7:1 for ink on
the ground):

| Text on background                  | Light | Dark  | Used for                                                                                  |
| ----------------------------------- | ----- | ----- | ----------------------------------------------------------------------------------------- |
| `--ec-ink` on `--ec-paper`          | 15.57 | 14.96 | Body, headings, labels, pills, paper-surface cards                                        |
| `--ec-paper` on `--ec-ink`          | 15.57 | 14.96 | Current pill, skip link, selection, warning callout                                       |
| `--ec-ink-soft` on `--ec-paper`     | 7.58  | 9.79  | Captions, dates, meta, methodology                                                        |
| `--ec-ink` on `--ec-paper-2`        | 14.02 | 13.25 | Code, fact boxes, notes                                                                   |
| `--ec-ink-soft` on `--ec-paper-2`   | 6.82  | 8.67  | Captions inside fact boxes                                                                |
| `--ec-on-cobalt` on `--ec-cobalt`   | 6.53  | 6.53  | Everything on a story surface: titles, deks, labels, links, focus rings, captions, quotes |
| `--ec-on-saffron` on `--ec-saffron` | 8.51  | 8.51  |                                                                                           |
| `--ec-on-rose` on `--ec-rose`       | 5.57  | 5.57  | (the lowest pair; the 0044.7 commit `0a82cd5` records 5.57:1)                             |
| `--ec-on-forest` on `--ec-forest`   | 6.35  | 6.35  |                                                                                           |
| `--ec-on-lilac` on `--ec-lilac`     | 7.45  | 7.45  |                                                                                           |
| `--ec-on-brick` on `--ec-brick`     | 5.79  | 5.79  |                                                                                           |

Every pair clears 4.5:1, so large text (3:1) is covered too. **Non-text (3:1):** focus rings and
pill outlines are `currentColor`, so they get the pair of the text beside them (at least 5.57:1); the
filled current pill is ink with paper text. Swatch edges against the ground are decorative and need
no ratio (light: saffron 1.83, lilac 2.09, rose 2.79; dark: cobalt 2.55, forest 2.62, brick 2.87);
a card is identified by its text and its focus ring, not by its edge. The contract checks declared
pairs only; the browser test also paints every swatch behind a real title and compares the computed
colours (`ec/expressive-colour.e2e.ts:195-273`), and b1 runs it in both themes.

**Assignment (kept):** FNV-1a over the slug, in today's palette order (`ec/colours.ts:30-47`),
pinned by `ec/colours.test.tsx:12-25` and `ec/views.test.tsx:242-243`. The owner-colour seam
(`ec/colours.ts:40-47`) stays unused: there is no data field for it (12). With today's sample the
home order is rose, cobalt, lilac, lilac, lilac, saffron, lilac, brick: four of eight are lilac,
three in a row, and forest never appears (computed from `ec/colours.ts` over the slugs of
`north-house.ts:679-688`). The adjacent-repeat rule (7.2) fixes the runs without changing any story's
colour.

## 6. Imagery

**Art direction per page type:**

| Page                   | Image                          | Frame                                                                                                        | Focal point                          | Preload (the page's lead)               |
| ---------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------ | ------------------------------------ | --------------------------------------- |
| Home                   | Each card's `image`            | Lead 4:3 (desktop), 3:2 (tablet, mobile); secondary 3:2; standard and related 4:3; compact none              | Cropped frames use `object-position` | Lead card image, when it has one        |
| Section, author, topic | As home                        | As home                                                                                                      | As home                              | The first card's image, when it has one |
| Article                | `hero`, body images, galleries | 2.4: landscape full width at natural ratio, square and portrait in the cover band; body images natural ratio | Hero crop beyond the height caps     | `hero`, when present                    |
| Not found, error       | None                           | Motif only                                                                                                   | –                                    | None                                    |

- **Focal points:** today a card's frame gets `object-position` from `focalPoint` and the image
  inherits it (`ec/story-card.tsx:48-57`, `ec/styles.ts:45-48`). Keep that for every cropped frame,
  including the capped hero and cover. Images without stored dimensions keep the shared 3:2
  focal-point frame (`reader/components/reader-image.tsx:66-74`).
- **Image-free stories** draw the story's motif in the same frame (`ec/motif.tsx:3-47`).
- **Formats and widths:** AVIF and WebP with a JPEG or PNG fallback at 320–1920px
  (`packages/web/src/server/content/media-variant-rules.ts:8,51-62`); GIFs, animated, oversized and
  unknown-width originals load as the original (`ec/views.test.tsx:127-151`).
- **Preload:** exactly one responsive `<link rel="preload">` per page from
  `ec/image-preload.tsx:9-23`, given the same `sizes` string from `ec/sizes.ts` as the picture (the
  cover value for a square or portrait hero), so its `imagesrcset` and `imagesizes` equal the lead
  picture's (`ec/views.test.tsx:87-125`). There is no preload when the lead is image-free
  (`ec/views.test.tsx:70-85,153-165`). All other images stay lazy.

**`sizes` values** (resolved from the grid in 4; one module, `ec/sizes.ts`, owns them):

| Image                               | `sizes`                                                                                                                      |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Lead card                           | `(min-width: 1408px) 690px, (min-width: 1024px) 49vw, (min-width: 768px) 88vw, calc(100vw - 5rem)`                           |
| Secondary card                      | `(min-width: 1408px) 590px, (min-width: 768px) 42vw, calc(100vw - 4.5rem)`                                                   |
| Standard and related cards          | `(min-width: 1408px) 366px, (min-width: 1024px) 26vw, (min-width: 768px) 41vw, calc(100vw - 4.5rem)`                         |
| Landscape hero                      | `(min-width: 1408px) 1312px, (min-width: 534px) 94vw, calc(100vw - 2rem)`                                                    |
| Square or portrait hero (cover)     | `(min-width: 1408px) 472px, (min-width: 1024px) 33vw, (min-width: 613px) 576px, (min-width: 534px) 94vw, calc(100vw - 2rem)` |
| Body image, carousel item (K4 hook) | `(min-width: 768px) 720px, (min-width: 534px) 94vw, calc(100vw - 2rem)`                                                      |
| Gallery grid item (K4 hook)         | `(min-width: 1280px) 366px, (min-width: 1024px) 30vw, (min-width: 768px) 46vw, (min-width: 534px) 94vw, calc(100vw - 2rem)`  |
| Gallery diptych item (K4 hook)      | `(min-width: 1280px) 563px, (min-width: 768px) 46vw, (min-width: 534px) 94vw, calc(100vw - 2rem)`                            |

Today's values are close but coarser: `heroSizes` is `(min-width: 1408px) 1312px, 94vw`
(`ec/article.tsx:11`), and the card values end at `86vw` (`ec/story-card.tsx:10-12`). Until K4,
`ArticleBody` gives every body and gallery image `(min-width: 768px) 42rem, 100vw`
(`reader/components/article-body.tsx:13`): body images still pick the same candidate, but gallery
thumbnails are over-fetched until the hook lands.

**Captions and credits.** `ReaderFigure` renders the caption followed by a `span` " Credit: name"
(linked when there is a URL) (`reader/components/reader-image.tsx:77-111`). E sets the caption in
Fraunces italic 1rem/1.5 in soft ink and the credit `span` on its own line in Martian Mono
`--ec-label` capitals; credit links stay underlined and at least 44px tall (today,
`ec/styles.ts:63-64`). On a story surface (cover band, key points) both use the on-colour.

## 7. Components and editorial blocks

### 7.1 Masthead and navigation

- **Wordmark:** `siteName` ("Magazine Foundation", `reader/components/site-header.tsx:7`) with the
  last word in italic (`ec/shell.tsx:23-39`), linking home, at least 44px tall (`ec/styles.ts:20`).
- **Theme:** the shared `ThemeMenu` (`packages/web/src/components/theme-menu.tsx:35-101`), restyled
  through a scoped selector on `[data-slot='theme-menu-trigger']` as an outlined mono pill in
  `--ec-ink` (filled ink with paper text on hover); its popup keeps the site's own styles. It is
  the only client component E adds beyond `next/link`, and baseline already ships it to every
  visitor.
- **Pills:** Martian Mono `--ec-label`, 1px `currentColor` outline, 2rem radius, at least 44 by 44px
  (`ec/styles.ts:25`); the current page is filled ink with paper text (`ec/styles.ts:26`).
  `aria-current="page"` marks only the link to the page being viewed ("All stories" on home, the
  section's pill on its section page). An article's section pill gets the same fill with
  `aria-current="true"`; today it is `page` (`ec/article.tsx:17`, `ec/shell.tsx:53`).

### 7.2 Story cards

The whole card is one link, named by its title only through `aria-labelledby`
(`ec/story-card.tsx:30,39`). The section appears as text, not a nested link. The arrow becomes
"Read →" (the north-east arrow reads as "leaves the site"); it stays `aria-hidden`
(`ec/story-card.tsx:43-45`).

| Variant   | Where                                 | Surface                | Title                                    | Visual                                                      | Meta                                                   |
| --------- | ------------------------------------- | ---------------------- | ---------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------ |
| Lead      | Position 1 of every list page         | Filled                 | `h2`, `--ec-lead`; dek `--ec-dek` italic | 2.2; image or motif                                         | Number badge, section, reading time; date and "Read →" |
| Secondary | Home positions 2–3                    | Filled or paper        | `h2`, `--ec-card-lg`; dek `--ec-copy`    | Top, 3:2                                                    | As lead                                                |
| Standard  | Home 4–9; section, author, topic 2–13 | Filled or paper        | `h2`, `--ec-card`; dek `--ec-copy`       | Bottom, 4:3 (`ec/styles.ts:45`)                             | As lead                                                |
| Related   | Read next                             | Filled or paper        | `h3`, `--ec-card`                        | Bottom, 4:3                                                 | No number badge                                        |
| Compact   | Home 10–13; list pages 14 and later   | Ground, 1px rule below | `h2`, `--ec-row`                         | None; a 2.75rem chip in the story colour holding the number | Section, date and reading time in one mono line        |

- **Filled** is today's card: story colour with its on-colour (`ec/styles.ts:31`).
- **Paper** is the ground with ink text, a 0.375rem border in the story colour and the motif in ink
  and story colour.
- **Adjacent-repeat rule:** in any rendered list, a card that could be filled is paper when its
  story colour equals the previous card's and that previous card is filled. Compact rows are
  skipped. `data-story-colour` never changes, so the identity tests still hold
  (`ec/views.test.tsx:237-265`). With today's sample, home renders the three lilac stories as
  filled (chair), paper (shelf), filled (long table), and the Interiors section renders the shelf
  filled and the long table paper.
- **Number badge:** today's 2.75rem mono circle (`ec/styles.ts:38`), `aria-hidden`
  (`ec/story-card.tsx:33-35`).
- **Focus:** a 3px `currentColor` ring inset 7px inside the card (`ec/styles.ts:35`), on filled and
  paper cards alike; compact rows use a 3px ink ring 2px outside the row.

### 7.3 Page header, spine strip and author mark

As 2.8. The section chip stays the filled dot from `storyColour(section.slug)` (`ec/section.tsx:19-23`,
`ec/styles.ts:104`); the topic chip is a 0.18em ring of the same size; the author mark is a 6rem
square with radius 1.5rem holding the motif for the author's slug.

### 7.4 Footer

A stripe of the six swatches in palette order (equal segments, 0.5rem tall, fully rounded,
`aria-hidden`), then the wordmark at `--ec-wordmark-sm` and `nav aria-label="Footer"` with outlined
pills for "All stories" and each section. It replaces today's name and "All stories ↗"
(`ec/shell.tsx:65-70`, `ec/styles.ts:110-112`).

### 7.5 Editorial blocks

Every block kind from `packages/web/src/server/content/document.ts:6-26` reaches the article through
`reader/blocks.ts:116-216` and the shared `ArticleBody` (`reader/components/article-body.tsx:57-175`);
E only styles the markup and its `data-block`, `data-variant` and `data-layout` hooks.

| Document node → reader block                     | Markup                                                                                     | Expressive Colour style                                                                                                                                                                                                                        |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `paragraph` → paragraph                          | `p`                                                                                        | Fraunces `--ec-body`, 1.75 leading, `SOFT` 30, 1.5rem apart (kept, `ec/styles.ts:65-66`)                                                                                                                                                       |
| `heading` → heading 2–6                          | `h2`–`h6`                                                                                  | `h2` `--ec-heading` with a 0.4em story-colour dot before it (decorative pseudo-element); `h3` `--ec-h3`; `h4`–`h6` as in 3; 3rem above, 1rem below                                                                                             |
| `blockquote` → quote                             | `blockquote`                                                                               | 0.4rem story-colour bar on the left, italic, 1.25rem inset (kept, `ec/styles.ts:82`)                                                                                                                                                           |
| `pullQuote` → pull-quote                         | `figure[data-block=pull-quote]`, `blockquote`, `figcaption`                                | Filled story surface, 1.5rem radius, quote at `--ec-heading` 700 `SOFT` 100 (kept, `ec/styles.ts:83-85`), an oversized opening quote mark in Fraunces 900 as decoration; attribution in mono after an em dash; 56rem feature column on desktop |
| `bulletList` → bulleted-list                     | `ul > li`                                                                                  | Disc markers in ink, items 0.5rem apart, nested blocks 1rem apart (kept, `ec/styles.ts:73-81`)                                                                                                                                                 |
| `orderedList` → numbered-list                    | `ol[start][type]`                                                                          | Marker type from `type` (1, a, A, i, I; kept, `ec/styles.ts:75-79`); markers in Martian Mono 500                                                                                                                                               |
| `taskList` → checklist                           | `ul[data-block=checklist]`, glyph `span[aria-hidden]`, visually hidden "Done:"/"Not done:" | Glyph hung in a 1.75rem indent (kept, `ec/styles.ts:90-93`), in ink; no strike-through                                                                                                                                                         |
| `mediaImage` → image                             | `figure > picture > img` + `figcaption`                                                    | Measure width, natural ratio, 0.75rem radius (`ec/styles.ts:89`); caption and credit as 6                                                                                                                                                      |
| `gallery` → gallery (`grid`)                     | `ul[data-block=gallery][data-layout=grid] > li > figure`                                   | Wide column; three per row on desktop, two on tablet, one on mobile; 1.5rem gap                                                                                                                                                                |
| `gallery` → gallery (`diptych`)                  | `data-layout=diptych`                                                                      | Wide column; two per row from tablet, one on mobile                                                                                                                                                                                            |
| `gallery` → gallery (`carousel`)                 | `data-layout=carousel`                                                                     | Measure column, one per row (kept, `ec/styles.ts:88`): the renderer has no carousel control, so E draws no scroller                                                                                                                            |
| `callout` → callout (`tip`)                      | `div[data-block=callout][data-variant=tip][role=note]`, label in `strong`                  | Filled story surface (today every callout is, `ec/styles.ts:95`); label in mono capitals                                                                                                                                                       |
| `callout` → callout (`note`)                     | `data-variant=note`                                                                        | `--ec-paper-2`, 2px `currentColor` border, 0.75rem radius                                                                                                                                                                                      |
| `callout` → callout (`warning`)                  | `data-variant=warning`                                                                     | Inverse: `--ec-ink` ground with `--ec-paper` text, an "!" mark before the label (decorative)                                                                                                                                                   |
| `codeBlock` → code                               | `pre > code[data-language]`                                                                | `--ec-paper-2`, 1px border, 0.75rem radius, Martian Mono 0.875rem/1.7, wrapped (`ec/styles.ts:100`); no syntax colours                                                                                                                         |
| `horizontalRule` → divider                       | `hr`                                                                                       | Today's 4rem by 0.4rem story-colour bar with 3rem above and below (`ec/styles.ts:101`), now centred and fully rounded                                                                                                                          |
| `embed` → embed                                  | `figure[data-block=embed][data-provider] > p > a` + `figcaption`                           | `--ec-paper` block with a 2px `currentColor` border and a play mark before the link (decorative); link `--ec-copy` 700, underlined, at least 44px tall (`ec/styles.ts:98`); fallback in soft ink                                               |
| `editorialBlock` → editorial (`fact-box`)        | `section[data-block=editorial][data-variant=fact-box][aria-label]`                         | `--ec-paper-2` panel, 0.75rem radius                                                                                                                                                                                                           |
| `editorialBlock` → editorial (`key-points`)      | `data-variant=key-points`                                                                  | Filled story surface, 1.5rem radius                                                                                                                                                                                                            |
| `editorialBlock` → editorial (`methodology`)     | `data-variant=methodology`                                                                 | 1px `currentColor` rule above, `--ec-copy` in soft ink                                                                                                                                                                                         |
| `editorialBlock` → editorial (`related-stories`) | `data-variant=related-stories`                                                             | Paper with a 0.375rem story-colour border; its links come from the story's own content                                                                                                                                                         |

- **Editorial labels:** each editorial block shows its label ("Fact box", "Key points",
  "Methodology", "Related stories"; the renderer's `aria-label`s, `reader/components/article-body.tsx:15-20`)
  in mono capitals through `content: 'Key points' / ''`, the generated-content form with an empty
  alternative, so screen readers do not hear it twice. Browsers without that syntax drop the
  declaration and show no label.
- **Inline marks:** bold 700; italic in the real italic face; links underlined at 1px with a 0.2em
  offset, 2px on hover (`ec/styles.ts:72`); underline (`u`) as a wavy 1px underline so it never
  looks like a link; strike as a line-through; inline `code` in Martian Mono 0.85em on
  `--ec-paper-2` with a 0.25rem radius; line breaks as `br`.
- **Inside a story surface** (pull quote, tip, key points, cover band) text, links, markers and
  focus rings all use the on-colour.

## 8. Motion and interaction

- **What moves:** on card hover and keyboard focus, the image scales to 1.03 inside its frame, or
  the motif turns 6°, over 200ms ease-out; the title gains a 2px underline (today,
  `ec/styles.ts:34`). Only `transform` is animated, so nothing reflows and nothing counts as a layout
  shift.
- **What does not:** the reading column, page loads, theme switches (instant; no colour
  transitions), scrolling (no scroll-linked effects or parallax) and media (no autoplay).
- **Reduced motion:** today's rule removes every animation and transition (`ec/styles.ts:125-127`);
  the developed rule also sets the hover `transform` to `none`. The global rule already turns off
  smooth scrolling (`packages/web/src/app/globals.css:182-191`).
- **Focus:** keep the 3px solid `currentColor` ring with a 4px offset on the ground
  (`ec/styles.ts:14`), inset 7px inside cards (`ec/styles.ts:35`) and 5px inside filled pills
  (`ec/styles.ts:28`); `Highlight` in forced colours (`ec/styles.ts:128-133`). Focus is never
  removed, and hover adds nothing that focus lacks.
- **Forced colours and print:** keep today's rules (`ec/styles.ts:128-139`); add `CanvasText`
  borders to paper cards, callouts, fact boxes and the embed, hide the spine strip, stripe and
  author mark, and in print force white paper and black ink in both themes and hide the Theme
  control and Read next.

## 9. Accessibility (WCAG 2.2 AA)

- **Headings:** one `h1` per page (`rd/README.md:36-38`): the wordmark on home, the title on an
  article, the name on section, author and topic pages, and "Page not found" or "Something went
  wrong" on K4 pages. Card titles are `h2` in page lists and `h3` in Read next; Read next's own
  heading is an `h2`; body headings come from the story (`h2`–`h6`, `reader/views.ts:109-113`).
  Labels such as "Section · 4 stories" and "Filed under" are paragraphs, not headings.
- **Landmarks:** one banner (the masthead), `nav` "Sections", `main`, one contentinfo with `nav`
  "Footer", `nav` "Topics" on articles and the "Read next" region. Editorial blocks are labelled
  sections from the shared renderer (`reader/components/article-body.tsx:164-173`), and Read next
  is not called "Related stories", so no two regions share a name.
- **Focus order:** for the owner the lab bar comes first (`packages/web/src/reader-lab/reader-page.tsx:23`),
  then the skip link, wordmark, Theme control, pills, main content and footer. DOM order equals
  visual order (the Theme control precedes the pills in both). The skip link targets
  `main#ec-main` with `tabIndex={-1}` (`ec/shell.tsx:62`). The lab bar never hides focus: the
  site already pads scrolling when it is present (`packages/web/src/app/globals.css:97-100`).
- **Target sizes:** every control is at least 44 by 44px, above SC 2.5.8's 24px: pills, the Theme
  control, card links, topic pills, credit links, the embed link and Try again. Inline body links
  use the inline exception and keep their underline.
- **Link text:** cards are named by their title; author and topic links by the name; the embed
  link by its title (`reader/components/article-body.tsx:153-163`). No "click here". Links that
  share a name on one page share a target (the masthead, footer and band all link "Interiors" to
  the same section); if a topic has the same name as a section, its pill gets a visually hidden
  "Topic: " prefix.
- **Colour:** never the only signal. Callout variants carry their label, the current page carries
  `aria-current`, a fill and (in forced colours) a 3px border (`ec/styles.ts:131`).
- **Reflow, zoom and spacing:** no horizontal scrolling at 320px or at 400% zoom of 1280px; no
  fixed heights on text containers, so user text-spacing overrides cannot clip.
- **How it is checked:**
  - Unit (`ec/views.test.tsx`, jsdom): one `h1` per page type; one banner, `main` and contentinfo;
    card link names equal titles; `aria-current` values; the Theme control precedes the pills;
    decorative motif, spine strip, stripe, end mark and author mark are `aria-hidden`; empty data
    renders no empty module; heading levels in Read next.
  - Contract and contrast: `textPairs` in both themes (`rd/contract.ts:285-297`) and the full matrix
    in `ec/colours.test.tsx`, which drops today's "no dark set" assertion.
  - Browser (`ec/expressive-colour.e2e.ts`, extended): axe with today's WCAG 2.0–2.2 A/AA tags
    (`ec/expressive-colour.e2e.ts:188-190`) on home, section, article, author and topic (and the
    K4 pages) at 390 and 1440px, light and dark, with the lab bar; no overflow at 320, 360, 390, 768,
    1024, 1280 and 1440px (today from 360, `ec/expressive-colour.e2e.ts:77`); 44px targets for every
    control type; keyboard paths through skip link, Theme and pills; reduced motion leaves no
    transition; forced colours and print emulation each pass axe and get one screenshot; the shared
    sweep in `tests/e2e/reader-lab.spec.ts:193` stays green.
  - Manual (b3 worklog): a VoiceOver or NVDA pass of home and the long-table article (landmarks,
    headings and links lists), 200% browser zoom, and Windows forced colours.

## 10. Performance budgets

The field rows are the accepted product targets, and the article CLS and font rows are enforced by
tests today. Every other number is this direction's proposed budget: b3 measures it, and it stays
advisory until it is accepted with a reproducing check
(`.claude/skills/reader-frontend/references/code-map.md:96-101`).

| Measure                                      | Home                                  | Article            | Section, author, topic | Source and check                                                                            |
| -------------------------------------------- | ------------------------------------- | ------------------ | ---------------------- | ------------------------------------------------------------------------------------------- |
| LCP, field p75                               | ≤ 2.5 s                               | ≤ 2.5 s            | ≤ 2.5 s                | `docs/product/nonfunctional-requirements.md:17-21`; needs a hosted site                     |
| INP, field p75                               | ≤ 200 ms                              | ≤ 200 ms           | ≤ 200 ms               | Same                                                                                        |
| CLS, field p75                               | ≤ 0.1                                 | ≤ 0.1              | ≤ 0.1                  | Same                                                                                        |
| CLS, browser test, cold and warm             | 0                                     | 0 (enforced today) | 0                      | `ec/expressive-colour.e2e.ts:387-439`, extended to every page type                          |
| LCP, signed-in Lighthouse (simulated mobile) | ≤ 2.8 s                               | ≤ 2.8 s            | ≤ 3.0 s                | `scripts/lab-lighthouse.md`; advisory, two runs, compared with baseline in the same session |
| CLS and TBT, same runs                       | 0 and ≤ 100 ms                        | 0 and ≤ 100 ms     | 0 and ≤ 100 ms         | Same                                                                                        |
| Lead image transfer                          | ≤ 120 KB at 390px, ≤ 200 KB at 1440px | Same               | Same                   | b3 network log; one preload, no request wider than the `sizes` slot needs                   |
| Images loaded before any scroll              | ≤ 150 KB mobile, ≤ 350 KB desktop     | ≤ 150 KB, ≤ 300 KB | ≤ 150 KB, ≤ 350 KB     | b3 network log, cold cache                                                                  |
| Web fonts                                    | 147,368 B, never more than 150,000 B  | Same               | Same                   | `ec/fonts.test.ts:129-130`                                                                  |
| Article HTML                                 | –                                     | < 150,000 B        | –                      | Visitor budget `tests/e2e/homepage.spec.ts:223-236`, applied to E's signed-in article in b3 |
| Inline direction CSS (fonts, tokens, styles) | ≤ 24 KB uncompressed                  | Same               | Same                   | b3 measures the three `<style>` elements; `ec/styles.ts` is 11,816 bytes today              |
| Client JavaScript added by E                 | Only `ThemeMenu`                      | Same               | Same                   | Baseline already ships it (`reader/components/site-header.tsx:29`)                          |

- **Evidence today:** the Expressive Colour build recorded Lighthouse CLS 0 and performance 90–98
  (commit `0a82cd5`); in the same harness baseline measured LCP 2.40s (home), 2.65s (article) and
  2.44s (section) (commit `2b48dc9`). The harness covers home, the long-table article and Interiors
  with a cold browser cache and records scores as measurements, not gates
  (`scripts/lab-lighthouse.md:3-5,76-79`). Its routes do not include author or topic pages; b3
  either measures them with `--article`/`--section`-style options added by their owner or records the
  gap. TBT is not INP: b3 also times the Theme menu and a card click with Event Timing under 4x CPU
  throttling and records the longest interaction (advisory ≤ 200 ms).
- **LCP element:** the lead image or hero when there is one (preloaded at high priority, everything
  else lazy); otherwise the lead title or `h1`, which paints in the fallback face at once.
- **Fonts, cold load:** the font rules are inline in the root (`rd/direction-root.tsx:30`) with
  `font-display: optional` and no preload (`rd/README.md:85-88`). If Fraunces is not ready almost at
  once, the page keeps the metric-adjusted fallback for that whole load: no late swap, so no font
  layout shift, and with the 45rem measure no change of column width.
- **Fonts, warm load:** cached faces render at first paint, and client-side navigation within a
  visit keeps them. Public fonts are served with `max-age=0`, so every full load revalidates them
  (`rd/capture-fonts.ts:9-10`). On a distant host that round trip can exceed the optional window and
  keep the fallback even when warm: b3 measures this on the hosted Preview, and if it happens asks
  the platform owner for longer caching of `/reader-directions/*/fonts/` (outside this direction's
  files).

## 11. Delta from today, in three build batches

**Keep** (all batches): Fraunces and Martian Mono with their fallbacks, files, licences and budget
(`ec/fonts.ts`, `ec/fonts.test.ts`); the six swatches, their order, the slug hash and the ink-or-paper
rule (`ec/colours.ts`); the unused owner-colour seam; the motifs (`ec/motif.tsx`); rounded
colour-block cards that put words first; the article's colour band; filled pull quotes; one
responsive preload per page (`ec/image-preload.tsx`); the focus, skip-link, forced-colour and print
approach; 44px targets; styles scoped under the root with no stylesheet or `next/font` imports
(`rd/README.md:92-94`); and today's contrast, colour-identity, preload, CLS, font-removal, visitor
isolation and long-title tests.

**Remove:** the paper ground in dark mode, `color-scheme: light` and their assertions
(`ec/styles.ts:5`, `ec/tokens.ts:11`, `ec/colours.test.tsx:80`, `ec/expressive-colour.e2e.ts:165-169`);
the single-tier home grid (`ec/home.tsx:14-24`, `ec/styles.ts:30,50-54`); the dek and credits row
below the band (`ec/article.tsx:34-40`, `ec/styles.ts:58-60`); the 65ch measure (`ec/tokens.ts:30`);
the 11px label (`ec/tokens.ts:19`); one wordmark size on every page (`ec/styles.ts:19`); "Words by"
(`ec/article.tsx:37`); the north-east arrows on internal links (`ec/story-card.tsx:44`,
`ec/shell.tsx:68`); and `aria-current="page"` on an article's section pill (`ec/article.tsx:17`).

### b1: home and section (no dependency)

1. `ec/tokens.ts`: the dark set, `--ec-scheme`, `--ec-paper-2`, `--ec-ink-soft`, the new and changed
   type tokens (3), spacing tokens (4) and the extra text pairs (5). The measure changes in b2.
2. `ec/shell.tsx`: "Skip to content"; Theme control; wordmark size by page; footer stripe and
   footer `nav`; the home spine strip.
3. New `ec/story-list.tsx` (tiers by position, the adjacent-repeat rule, card variants and heading
   levels) and `ec/sizes.ts`; `ec/story-card.tsx` gains `variant`, `surface`, `headingLevel` and the
   long-title class, and the "Read →" arrow.
4. `ec/home.tsx` and `ec/section.tsx` use them; new `ec/page-header.tsx` (label, `h1`, chip, spine
   strip, description) for the section page; both empty states.
5. `ec/styles.ts`: root `color-scheme`, the 12/6/1 grid, tiers, paper surface, compact rows, spine
   strip, stripe, Theme pill, hover motion, reduced-motion, forced-colour and print additions.
6. Tests: `ec/colours.test.tsx` dark matrix; `ec/views.test.tsx` tiers (13 stories fill all four;
   1, 2, 3 and 10 cover the partial cases), compact rows without images, the adjacent-repeat
   outcome on the sample, unchanged colour identity and single preload; `ec/expressive-colour.e2e.ts`
   night ground in dark mode, 320px width, Theme control target and focus order, CLS 0 on home and
   section.
7. Evidence: Vitest for `rd/`, the direction e2e, `tests/e2e/reader-lab.spec.ts`, screenshots of home
   and Interiors at 390, 768 and 1440px in both themes.

### b2: article, author, topic and related (after K1, ideally K3)

1. `ec/article.tsx`: the cover band with dek and byline (`authorLinks`, else `authors`), title
   steps, hero placement by orientation with its `sizes`, motif for image-free stories, end mark,
   "Filed under", Read next, `aria-current="true"`.
2. `ec/tokens.ts` `--ec-measure: 45rem`, `--ec-feature: 56rem`, `--ec-wide: 72rem`; `ec/styles.ts`:
   the body grid and every block style in 7.5.
3. New `ec/author.tsx` and `ec/topic.tsx` on `ec/page-header.tsx` and `ec/story-list.tsx`;
   `ec/index.ts` registers them as `Author` and `Topic`.
4. Tests: views for author links, topics, related (0, 1 and 3 items), `null` bio and description
   left out, defensive empty lists, one `h1`, DOM order; every block still present
   (`ec/views.test.tsx:167-204`) and styled; the measure test moves from 65ch to 720px and checks
   about 65–70 characters per line (`ec/expressive-colour.e2e.ts:277-304`); the seeded-story cases
   (`ec/expressive-colour.e2e.ts:101-128`) plus a square and a portrait hero at every width; e2e
   for the author and topic routes once K3 seeds them.
5. Evidence: as b1 for article (long table, shelf, chair, door handle), author and topic pages.

### b3: media, accessibility and Core Web Vitals pass (after K4 for its items)

1. K4: `NotFound` and `Error` views (2.7) and the body and gallery `sizes` (6); otherwise the gap is
   recorded.
2. Media audit at 390, 768, 1024 and 1440px: chosen candidates against laid-out widths for every
   `sizes` row, focal-point crops for the 3:2, 16:9, 1:1 and 4:5 sample images, one preload per
   page, lazy everywhere else, and the image transfer budgets.
3. Lighthouse twice per page type with baseline in the same session, Event Timing for the Theme menu
   and a card, CLS cold and warm on every page type, the HTML and inline-CSS byte counts, and a
   warm-font check on the hosted Preview when it is available.
4. The full accessibility matrix in 9, forced colours and print, and the manual notes.
5. The screenshot test writes to the b3 bead's worklog folder instead of `docs/worklog/blog-0044.7`
   (`ec/expressive-colour.e2e.ts:345-385`) and adds author, topic and not-found pages.

## 12. Open questions for the client

1. **Night print:** should Expressive Colour follow the reader's dark setting with a night ground
   and the same story colours (this spec's default), or stay on paper even in dark mode, as today?
2. **Story colours:** colours are chosen automatically and permanently from each story's address.
   Is that right, or would the owner like to pick a story's colour when publishing? That needs a new
   field and is not part of this bake-off.
3. **Palette:** keep these six colours, or match them to colours the magazine already uses?
