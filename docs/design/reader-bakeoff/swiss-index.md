# Swiss Index: developed-magazine spec

Draft for review. Not approved by the owner or the client.

- **Direction:** C, `swiss-index` ("Swiss Index"). Spec bead: `blog-0044.25`.
- **Starting point:** `origin/main` at `cc68039`. "Today" means that commit.
- **Depends on:** the shared kit `blog-0044.22` (Author and Topic views, article author links, topics and related stories), which is not merged at `cc68039`. Names follow that bead's plan (`AuthorView`, `TopicView`, `authorLinks`, `topics`, `related`); builders use the names that land.
- **Paths:** `swiss-index/` is `packages/web/src/reader-directions/swiss-index/`, `reader-directions/` is `packages/web/src/reader-directions/`, `reader/` is `packages/web/src/reader/`, and `fonts/` is `packages/web/public/reader-directions/swiss-index/fonts/`. Other paths start at the repository root. A bare line number refers to the last file named, unless a list says otherwise.
- **Sample content:** the North House seed (`packages/web/src/server/lab/north-house.ts`): eight stories in three sections.

## 1. Thesis

Swiss Index sets the magazine like a printed index. Every page stands on one visible four-column grid, every list of stories is numbered, and the facts about a story (section, author, date, reading time, credits) sit in a mono "data" voice beside big, bold grotesk titles. Reading is the quiet part: a 65-character measure, black rules instead of boxes, no motion, and one signal colour that only marks state.

The reader should feel oriented and in control: the whole magazine is visible at a glance, the current place is always marked, and nothing competes with the text. The tone is confident and contemporary, closer to a design studio's catalogue than to a newspaper. The registered name and thesis stay (`swiss-index/index.ts:13-17`).

What separates it from the other four directions:

- **The grid is visible.** Ruled navigation cells, plates and index rows (`swiss-index/styles.ts:19-31,49`). Quiet Monograph works with white space and serif display type instead (`reader-directions/quiet-monograph/index.ts:17-18`, `reader-directions/quiet-monograph/fonts.ts:15-20`).
- **No serif and no ornament.** Literary Long-read reads in Newsreader with true italics and has a dark cover panel with gold (`reader-directions/literary-longread/fonts.ts:16-20`, `reader-directions/literary-longread/tokens.ts:10-12`). Swiss Index uses one grotesk and one mono.
- **Images never lead the layout.** Cinematic Feature opens on a full-width cover image (`sizes="100vw"`: `reader-directions/cinematic-feature/home.tsx:16,28`) on a dark ground (`reader-directions/cinematic-feature/tokens.ts:5`). Swiss Index keeps every image inside grid cells and never sets text on an image.
- **Monochrome.** Expressive Colour gives each story a saturated colour and round corners (`reader-directions/expressive-colour/story-card.tsx:28`, `reader-directions/expressive-colour/tokens.ts:35`). Swiss Index is black and white with square corners and one signal orange (`swiss-index/tokens.ts:8`).
- **Numbers are the navigation system.** Every story list on every page type, including author, topic and related lists, is a numbered index.
- **A true-black dark theme** (`swiss-index/tokens.ts:29`).

## 2. Pages and layout

Widths: mobile below 600px, tablet 600–1023px, desktop 1024px and up (section 4).

### 2.1 Every page

Today (`swiss-index/shell.tsx`): a skip link, "Skip to stories" (27-29); a masthead with the site name as a two-line wordmark, an `h1` on home and a `p` elsewhere (22-41); a `nav` "Sections" with "All stories" and the sections (42-60); `main#si-main` (62-64); a footer with the site name and an "All stories" link (65-70). There is no theme control, although the lab tour tells the owner to "switch to dark mode with Theme" (`packages/web/src/reader-lab/lab-tour.tsx:32`); only baseline's header renders the shared `ThemeMenu` (`reader/components/site-header.tsx:29`).

Developed:

- **Skip link:** "Skip to content" (on story pages `main` holds an article, not stories).
- **Masthead, desktop and tablet:** row 1 holds the wordmark at the left and the Theme control at the right (the shared `ThemeMenu`, `packages/web/src/components/theme-menu.tsx`). Row 2 is the section index: `nav` "Sections" as a four-column ruled grid, each cell with a 1px left rule, "Front page" first and then the sections in navigation order (alphabetical: `reader/read-model.ts:99-106`). A 4px ink rule closes the masthead, as today (`swiss-index/styles.ts:19`).
- **Masthead, mobile:** the same two rows; the section index uses two columns.
- **Current page:** `aria-current="page"` and the underline stay (`swiss-index/styles.ts:27`); the cell's 1px left rule becomes a 4px signal rule.
- **Footer:** a 4px top rule; the site name; a second `nav`, "Site index", with "Front page" and every section in the same ruled grid (three columns on desktop, two below); a "Back to top" link to an anchor on the page wrapper.
- **"Front page" replaces "All stories"** in both places: the front page shows the newest story and at most 12 more (`reader/read-model.ts:37-38`), not all stories.
- **Background:** the root keeps painting `--si-paper`, including the Reader Lab bar's reserved space (`swiss-index/styles.ts:3`, `packages/web/src/reader-lab/reader-page.tsx:26-31`).

### 2.2 Home

Today (`swiss-index/home.tsx`): stories 01–03 in a ruled grid (18-23); "Further reading" lists 04 onwards as an index (24-43); an empty state, "No stories yet" (45-50). Story 01 spans two columns with a 3:2 image and a "Lead" tag (`swiss-index/styles.ts:32,41`, `swiss-index/story-card.tsx:26`). Stories run newest first by publication time (`packages/web/src/server/content/reader.ts:47-51,62`).

Developed:

- **Cover, desktop:** an `ol` of plates (section 7). 01 spans columns 1–2 with a 3:2 image and the "Lead" tag; 02 and 03 take columns 3 and 4 with 4:3 images. A plate without an image shows a number plate, so the titles stay aligned along the row. If 01 has no image it becomes a typographic lead: its title at `--si-title` (or `--si-title-long`) and the dek, without a plate.
- **Cover, tablet:** 01 across both columns; 02 and 03 side by side.
- **Cover, mobile:** one column; plates without images show no number plate, since there is no row to align.
- **Earlier stories (04 onwards):** a label row with the `h2` "Earlier stories" and the count, then index rows (section 7) at every width.
- **Empty:** today's copy (`swiss-index/home.tsx:46-49`) under a 4px rule across columns 1–3, full width below 1024px; the section index shows only "Front page", because no section has a story.

With the seeded sample, the cover holds the winter-light story (a landscape image with an off-centre focal point), the boathouse story (a 157-character title) and the chair story, which has no image (`packages/web/src/server/lab/north-house.ts:288-384`, published on 2 October, 30 September and 27 September: 321, 353, 381). So the front page shows a number plate from the start.

### 2.3 Section

Today (`swiss-index/section.tsx`): a label row, "Section" with the story count (14-19); the `h1` (20); the description when present (21), which is always `null` today (`reader/views.ts:59-60`, `reader/read-model.ts:206`); every story as a plate (`swiss-index/section.tsx:24-33`), with the first plate's image preloaded (11, 30); an empty sentence (35). Plate images are 4:3 (`swiss-index/styles.ts:38`).

Developed:

- **Header:** the label row, "Section" at the left and "N stories" at the right; the `h1` at `--si-title`; the description at `--si-dek`, 50ch, only when it is not null.
- **Plates 01–04:** four across on desktop, two by two on tablet, one column on mobile.
- **Index from 05:** a label row with the `h2` "Earlier in {section}", then index rows without the section column.
- **Empty:** the label row reads "0 stories"; today's sentence under a 1px rule; a "Front page" link.

The sample sections hold four, two and two stories (`packages/web/src/server/lab/north-house.ts:51-55` and each story's `section`), so the index first shows with more content (blog-0044.29) or the owner's own stories.

### 2.4 Article

Today (`swiss-index/article.tsx`): a four-column `article` (`swiss-index/styles.ts:59`). Column 1 is a `dl` rail with Section, Published, Reading time, "Words" (the authors, always empty today: `reader/read-model.ts:179`) and "Lead photo" (the hero credit) (`swiss-index/article.tsx:21-60`). Columns 2–4 hold the header (`h1` and dek), the hero (`ReaderFigure`, preloaded, `heroSizes`) and the body (`ArticleBody`) (61-74). The rail comes before the `h1` in the DOM (21 and 63); below 1024px it becomes a wrapped row above the title (`swiss-index/styles.ts:116-120`).

Developed, in DOM order, which is also the reading and focus order at every width:

1. **Header**, columns 2–4: the `h1` at `--si-title`, or `--si-title-long` above 80 characters (the boathouse title has 157: `packages/web/src/server/lab/north-house.ts:355-356`); the dek at `--si-dek`, 50ch.
2. **Rail**, column 1 beside the header, hero and body, under a 4px rule: Section (link); Author or Authors (from `authorLinks`, one link per `dd`, left out when empty); Published (`time`); Reading time.
3. **Hero:** a landscape image (width at least 1.2 times the height, or no stored dimensions) spans columns 2–4 at its own ratio, with the caption below. An upright image (below 1.2) spans columns 2–3 with the caption in column 4. Four of the seven sample heroes are upright, two square and two 4:5 (images at `packages/web/src/server/lab/north-house.ts:103-210`, used as heroes at 388, 591, 617 and 653).
4. **Body**, columns 2–4: text at 65ch from the left edge of column 2.
5. **End matter**, columns 1–4 under a 4px rule: a `dl` with "Topics" (links from `topics`) and "Image credits" (each credit name once, in figure order, as plain text). Terms sit in column 1 and values in columns 2–4; a row shows only when it has content.
6. **Related stories**, columns 1–4: a label row with the `h2` "Related stories" and the count, then plates from `related`, numbered from 01, with `h3` titles, four per row. Left out when empty.

At other widths and in edge cases:

- **Tablet:** one column in the same order. Rail items wrap in a row, as today; an upright hero sits in a two-column sub-grid with its caption beside it; end-matter terms sit above their values; related plates run two per row.
- **Mobile:** one column; every hero full width; related plates one per row.
- **No hero:** the rail follows the header and the body follows the rail; nothing is preloaded.
- **Short story** (the shelf story has two paragraphs: `packages/web/src/server/lab/north-house.ts:386-399`): the same structure; the end matter and related stories keep the page from stopping short.

### 2.5 Author (kit view)

`AuthorView`: name, slug, href, bio or null, stories, navigation. The authors table has no portrait column (`packages/web/src/server/database/schema.ts:33-44`), so none is shown.

- **Header:** a label row, "Author" at the left and "N stories" at the right; the name as the `h1` at `--si-title`; the bio at `--si-dek`, 50ch, only when it is not null.
- **Stories:** a label row with the `h2` "Stories", then every story as an index row, without plates or images: a bibliography. All widths use the index-row layouts.
- **Empty:** "No published stories by {name} yet."
- **Lead element:** the `h1`; nothing is preloaded.

### 2.6 Topic (kit view)

`TopicView`: name, slug, href, description or null, stories, navigation. Taxonomy terms have no description column (`packages/web/src/server/database/schema.ts:215-226`), so the description is null for now.

- The section layout with the label "Topic": plates 01–04, then index rows from 05 with the section column kept (a topic crosses sections), and plate 01's image preloaded.
- **Empty:** "No published stories on this topic yet."

### 2.7 Not found, error and unavailable

- **Not found:** story and section pages call `notFound()` before the direction is resolved (`packages/web/src/app/stories/[slug]/page.tsx:57-61`, `packages/web/src/app/sections/[slug]/page.tsx:43-47`), so the global `packages/web/src/app/not-found.tsx` renders outside any direction root. No direction can style it under today's contract, and the kit plans its author and topic routes "following the existing stories/sections pages" (blog-0044.22).
- **Error:** the global client boundary `packages/web/src/app/error.tsx` replaces the page, root included. The same limit applies.
- **Unavailable store:** `reader/components/reader-unavailable.tsx` is the same in every direction by design (3-6). No change.
- **Design for when the kit adds a direction hook:** the usual masthead and footer; content across columns 1–3 on desktop and full width below; a label row, "Error 404" or "Error"; the `h1` "Page not found" or "Something went wrong"; one sentence; a "Front page" link and, for errors, a "Try again" button (1px ink border, 44px high). Until then, b3 records the gap.

## 3. Typography

Families, all local Latin WOFF2 subsets declared as data in `swiss-index/fonts.ts`:

- **Schibsted Grotesk**, SIL Open Font License 1.1: 400, 700 and 800 normal today (`swiss-index/fonts.ts:16-18`), from Fontsource 5.3.0, with provenance in `fonts/sources.json` and the licence in `fonts/Schibsted-Grotesk-OFL.txt`. **Add 400 italic and 700 italic** from the same package version as `style: 'italic'` sources (`reader-directions/contract.ts:45-46`, `reader-directions/README.md:63-65`). Today the browser synthesizes italics (`fonts/README.md:14-16`), and the sample uses them (`packages/web/src/server/lab/north-house.ts:366`). Record bytes and SHA-256 in `sources.json`. If the 5.3.0 package has no Latin italic files, b2 stops and reports rather than shipping a substitute.
- **IBM Plex Mono**, SIL OFL 1.1: 400 and 500 normal (`swiss-index/fonts.ts:32-33`). No change.
- No other family. The metric-adjusted Arial fallbacks stay (`swiss-index/fonts.ts:7-13,23-29`; reproduce them with `swiss-index/font-metrics.mjs`).
- **Weights:** 400 for text; 700 for titles, headings and `strong`; 800 only for the wordmark and page `h1`s; mono 400 for data and captions, and 500 for numbers, labels and the state tag.

Type scale (today's values: `swiss-index/tokens.ts:12-21`):

| Token               | Today                                    | Developed                                | Use                                        |
| ------------------- | ---------------------------------------- | ---------------------------------------- | ------------------------------------------ |
| `--si-label`        | `0.75rem`                                | unchanged                                | mono labels, numbers, rail terms           |
| `--si-small`        | `0.8125rem`                              | unchanged                                | captions, rail values, navigation          |
| `--si-copy`         | `1rem`                                   | unchanged                                | plate and index deks, footer               |
| `--si-body`         | `1.25rem`                                | `clamp(1.125rem, 1rem + 0.5vw, 1.25rem)` | body text: 18px on phones, 20px from 800px |
| `--si-card`         | `clamp(1.5rem, 1.15rem + 1vw, 2.125rem)` | unchanged                                | plate and index titles, body `h3`          |
| `--si-dek`          | `clamp(1.25rem, 1rem + 0.8vw, 1.75rem)`  | unchanged                                | deks, bios, body `h4` to `h6`              |
| `--si-heading`      | `clamp(2rem, 1.25rem + 2vw, 3.25rem)`    | unchanged                                | home lead title, body `h2`, pull quotes    |
| `--si-title`        | `clamp(3rem, 1.25rem + 5vw, 6rem)`       | `clamp(2.5rem, 1rem + 5.5vw, 6rem)`      | page `h1`, text-only home lead             |
| `--si-title-long`   | none                                     | `clamp(2rem, 1rem + 3vw, 3.75rem)`       | the same, for titles over 80 characters    |
| `--si-wordmark`     | `clamp(2rem, 3.1vw, 2.875rem)`           | unchanged                                | masthead wordmark                          |
| `--si-plate-number` | none                                     | `clamp(4rem, 2rem + 6vw, 7.5rem)`        | number plates (decorative)                 |

Measure and wrapping:

- **Body:** 65ch (`swiss-index/tokens.ts:22`, asserted at 1440px in `swiss-index/swiss-index.e2e.ts:172-199`), line height 1.65 (`swiss-index/tokens.ts:21`).
- **Other measures:** deks and bios 50ch (`swiss-index/styles.ts:66`), plate deks 60ch (46), index deks 65ch (55). Captions are capped at 65ch (new; today a hero caption runs across three columns).
- **Wrapping:** `text-wrap: balance` for page `h1`s and plate titles, `pretty` for other headings (today `pretty` everywhere: `swiss-index/styles.ts:8`). No hyphenation.
- **Tracking** stays: page `h1` `-0.06em`, `-0.04em` below 600px (`swiss-index/styles.ts:65,123`); headings `-0.035em` (8); wordmark `-0.065em` (20); uppercase labels `0.03em` (28).
- **Figures:** tabular for numbers (34) and, new, for dates.

What changes: genuine italics, an 18px body on phones, a 40px minimum page `h1` (today 48px), a smaller size for titles over 80 characters, the caption measure, balanced titles and two new size tokens.

## 4. Grid, spacing and breakpoints

Today the page is `min(100% - var(--si-gutter) * 2, var(--si-page))` (`swiss-index/styles.ts:18`), with `--si-page` 84rem, the gutter `clamp(1.25rem, 3vw, 3rem)`, a 1.5rem gap and `--si-space` `clamp(3rem, 6vw, 6rem)` (`swiss-index/tokens.ts:23-26`). Grids have four columns from 1024px (`swiss-index/styles.ts:19,29,59`), two from 600px (115) and one below (124).

All of it stays: the four-column grid is the direction. Its column formula is the single source of every `sizes` value (section 6):

| Viewport      | Columns | Content width    | One column          |
| ------------- | ------- | ---------------- | ------------------- |
| below 600px   | 1       | `100vw - 2.5rem` | full width          |
| 600–666px     | 2       | `100vw - 2.5rem` | `50vw - 2rem`       |
| 667–1023px    | 2       | `94vw`           | `47vw - 0.75rem`    |
| 1024–1429px   | 4       | `94vw`           | `23.5vw - 1.125rem` |
| 1430px and up | 4       | `84rem`          | `19.875rem`         |

The gutter reaches its 1.25rem floor below 667px, and the page reaches 84rem at about 1430px. Today's `sizes` switch at 1440px rather than 1430px; in that band they describe a column at most 2px wider than it is, which can stay.

- **Spacing:** a 0.25rem base; component gaps of 0.5, 0.75, 1, 1.5, 2 and 3rem; `--si-space` between page parts; 3rem between plate rows (`swiss-index/styles.ts:29`).
- **Rules:** 4px ink marks structure (masthead, rail, end matter, footer and `hr`: `swiss-index/styles.ts:19,60,104,109`); 1px ink separates items (navigation cells, plates, index rows and boxes: 25, 31, 49, 98).
- **Breakpoints** stay at 600 and 1024px (`swiss-index/styles.ts:111,122`). Checked widths: 320 (reflow), 360, 390, 768, 1024, 1280 and 1440px (today 360 to 1440: `swiss-index/swiss-index.e2e.ts:60,93`).

## 5. Colour

| Token              | Light     | Dark      | Role                                            |
| ------------------ | --------- | --------- | ----------------------------------------------- |
| `--si-paper`       | `#FFFFFF` | `#000000` | page ground                                     |
| `--si-ink`         | `#0E0E0E` | `#F5F5F0` | text, rules, focus ring                         |
| `--si-secondary`   | `#6A6A6A` | `#A6A6A6` | metadata, deks, captions                        |
| `--si-signal`      | `#FF4F1F` | `#FF4F1F` | state marks only                                |
| `--si-signal-ink`  | `#0E0E0E` | `#0E0E0E` | text on signal                                  |
| `--si-plate` (new) | `#F2F2F2` | `#1A1A1A` | image cells, number plates, tip, fact box, code |

The first five are today's (`swiss-index/tokens.ts:4-32`); signal and signal ink have no dark override, so they keep their light values (`reader-directions/contract.ts:65-66`).

Text pairs, all declared in `textPairs`, which the contract checks in both themes when the direction registers (`reader-directions/contract.ts:285-297`):

| Text on background       | Light   | Dark    |
| ------------------------ | ------- | ------- |
| ink on paper             | 19.30:1 | 19.20:1 |
| secondary on paper       | 5.41:1  | 8.63:1  |
| signal ink on signal     | 5.87:1  | 5.87:1  |
| ink on plate (new)       | 17.24:1 | 15.91:1 |
| secondary on plate (new) | 4.83:1  | 7.15:1  |

Every pair targets 4.5:1, large text included. The ratios use the WCAG formula of `reader-directions/contrast.ts:104-118`; the first three pairs are today's (`swiss-index/tokens.ts:33-37`).

- **Non-text (3:1):** the focus ring and all rules use ink (19:1). Signal on paper is 3.29:1 in light and 6.39:1 in dark, so signal never works alone: the "Lead" tag carries its word, the current page also has an underline, and the warning callout has its label. The plate (1.12:1 on light paper) is a surface, never the edge of a control.
- **Signal is used only** for the "Lead" tag (today: `swiss-index/styles.ts:37`), the current navigation cell and the warning callout.
- **No text is set on images.**

## 6. Imagery

Art direction:

- **Home:** a 3:2 lead plate across two columns; 4:3 plates for 02 and 03; no images in index rows.
- **Section and topic:** 4:3 plates for 01–04; no images in index rows.
- **Author:** no images.
- **Article:** the hero at its own ratio, never cropped, except an original without stored dimensions, which the shared component frames at 3:2 around its focal point (`reader/components/reader-image.tsx:14-16,66-74`). Body figures at text width. Galleries two-up for `grid` and `diptych` and one-up for `carousel`, all one-up below 600px (`swiss-index/styles.ts:91-93,132`); no scrolling carousel.
- **Related:** 4:3 plates.

**Focal points.** Plates crop with `object-fit: cover` (`swiss-index/styles.ts:38-41`). For an image with stored dimensions the shared component sets no `object-position` (`reader/components/reader-image.tsx:56-60`), and Swiss Index never passes one (nothing in `swiss-index/` reads `focalPoint`), so today such plates crop around the centre. Cinematic Feature and Expressive Colour pass the focal point on (`reader-directions/cinematic-feature/story-card.tsx:36`, `reader-directions/expressive-colour/story-card.tsx:50-56`). Developed: every cropping cell sets `--si-focus: {x}% {y}%` from `image.focalPoint` as an inline style, and its `img` uses `object-position: var(--si-focus, 50% 50%)`. The sample's front-page lead has its focal point at x 0.62 (`packages/web/src/server/lab/north-house.ts:215`).

**`sizes`,** one value per slot, from the formula in section 4. The first three are today's (`swiss-index/story-card.tsx:7-10`, `swiss-index/article.tsx:10-11`) and match it; the upright hero is new:

```text
lead plate      (min-width: 1440px) 41.25rem, (min-width: 1024px) calc(47vw - 0.75rem), (min-width: 667px) 94vw, calc(100vw - 2.5rem)
plate           (min-width: 1440px) 19.875rem, (min-width: 1024px) calc(23.5vw - 1.125rem), (min-width: 667px) calc(47vw - 0.75rem), (min-width: 600px) calc(50vw - 2rem), calc(100vw - 2.5rem)
landscape hero  (min-width: 1440px) 62.625rem, (min-width: 1024px) calc(70.5vw - 0.375rem), (min-width: 667px) 94vw, calc(100vw - 2.5rem)
upright hero    (min-width: 1440px) 41.25rem, (min-width: 667px) calc(47vw - 0.75rem), (min-width: 600px) calc(50vw - 2rem), calc(100vw - 2.5rem)
```

Body figures and gallery images take the shared renderer's value, `(min-width: 768px) 42rem, 100vw` (`reader/components/article-body.tsx:13`). Body figures stay at text width; b3 compares each figure's `currentSrc` with the candidate its laid-out width needs at 390, 1024 and 1440px. Two-up galleries are laid out at about half that width and will fetch a larger candidate than they need; that is a change for the shared renderer (the editorial-blocks area), not a reason for a Swiss fork.

**Lead image.** One per page, preloaded by `SwissImagePreload` with the same `srcset`, `sizes` and type as the picture's first source (`swiss-index/image-preload.tsx:10-26`, tested in `swiss-index/views.test.tsx:95-133`):

- **Home:** plate 01's image; none when 01 has no image (02 is never promoted).
- **Section and topic:** plate 01's image; none when 01 has no image (today's rule: `swiss-index/views.test.tsx:161-169`).
- **Article:** the hero, with the `sizes` of its orientation; none without a hero.
- **Author:** none.
- **Everything else** loads lazily (`reader/components/reader-image.tsx:50-52`).

**Captions and credits.**

- The shared `ReaderFigure` caption holds the caption and "Credit: name", linked when there is a URL (`reader/components/reader-image.tsx:77-111`). Swiss sets it in mono at `--si-small`, secondary, at most 65ch, with 44px credit-link targets (`swiss-index/styles.ts:14-15`).
- "Fig. n" above each figure stays a CSS counter (`swiss-index/styles.ts:68-69`) and becomes explicitly decorative, `content: 'Fig. ' counter(si-figure) / ''`, so no text may refer to a figure number.
- The rail's "Lead photo" goes (`swiss-index/article.tsx:46-59`): it repeats the hero caption's credit. The end matter's "Image credits" lists each credit name once, as plain text.

Image weight budgets are in section 10.

## 7. Components and editorial blocks

**Masthead, navigation and footer** (section 2.1): the wordmark in Schibsted 800 at `--si-wordmark` on two lines (`swiss-index/styles.ts:20-22`); navigation and footer links in mono at `--si-small`, at least 44 by 44px (26). The Theme trigger is restyled from the direction's styles: square, a 1px ink border, a mono label, 44px high, no transition. Its popup renders in a portal outside the direction root and keeps the shared look (`packages/web/src/components/theme-menu.tsx:46-66`).

**Plate** (today `SwissStoryCard`: `swiss-index/story-card.tsx:33-64`):

- **Meta row:** the number (mono 500, tabular, `aria-hidden="true"`), the "Lead" tag on home 01, the section link and the reading time. Today the number is a `span` with `aria-label="Story n"` (`swiss-index/story-card.tsx:23`), which screen readers do not reliably announce; the `ol` now carries the position.
- **Image cell:** 4:3, or 3:2 for the home lead; `--si-plate` behind the image while it loads; the focal point as in section 6. The title link's `::after` covers the image cell and the section link sits above it, so a plate has one story link and a large target.
- **Number plate** (new): when a plate without an image shares a row (600px and up), the cell keeps its ratio and shows the story number in Schibsted 800 at `--si-plate-number`, ink on `--si-plate`, `aria-hidden`. It replaces today's padding for text-only cards (`swiss-index/styles.ts:45`).
- **Title:** `h2` on home, section and topic pages and `h3` in related stories, at `--si-card` and balanced; the home lead at `--si-heading` (today: `swiss-index/styles.ts:43`).
- **Dek:** `--si-copy`, secondary, 60ch.
- **Hover:** the title underlines (`swiss-index/styles.ts:11`); images do not move.

**Index row** (new; generalizes `swiss-index/home.tsx:29-41`):

- **List:** an `ol` with `start` and `role="list"`, because list styles are removed (`swiss-index/styles.ts:9`), which drops list semantics in Safari; a 1px top rule per row.
- **Desktop:** column 1 holds the number and date; columns 2–3 the `h3` title link at `--si-card` and the dek (`--si-copy`, secondary, 65ch); column 4 the section link and reading time.
- **Tablet:** column 1 holds all the metadata, column 2 the title and dek. **Mobile:** a metadata line, then the title, then the dek.
- **Variants:** no section column on section pages. Dates use the shared `formatPublishedDate` (`reader/format.ts:1-5`).

**Label row:** a mono, uppercase heading at `--si-label`, weight 500, at the left and a count at the right (today's section label row: `swiss-index/section.tsx:14-19`, `swiss-index/styles.ts:106`).

**Rail and end matter** (`dl`): terms in mono at `--si-label`, secondary; values in mono at `--si-small`, ink; one `dd` per author; underlined links with 44px targets (`swiss-index/styles.ts:60-63`).

**Editorial blocks.** `ArticleBody` stays the only body renderer (`reader-directions/README.md:41-43`). Swiss styles its markup (`reader/components/article-body.tsx:57-175`) for every `ArticleBlock` kind (`reader/views.ts:107-153`); bare line numbers below refer to `swiss-index/styles.ts`:

- **`paragraph`:** body size, 1.65 leading, 1.5rem between blocks (70-71). No change.
- **`heading` 2–6:** `h2` at `--si-heading` with a new 1px top rule and 0.75rem of padding; `h3` at `--si-card`; `h4` to `h6` at `--si-dek`; 2.75rem above and 1rem below (72-75).
- **`quote`:** a 4px ink rule at the left and a 1.5rem indent (87-88). No change.
- **`pull-quote`:** 1px rules above and below, `--si-heading` bold (89-90); the attribution in the caption style (14).
- **`bulleted-list` and `numbered-list`:** discs and the five numbering types (78-84); markers in mono (new).
- **`checklist`:** the ☐ and ☑ glyphs (`aria-hidden`: `reader/components/article-body.tsx:110-121`) lie outside the Latin subset range, so a system font draws them. Draw a 1em square instead: a 2px ink outline, filled with ink when `data-checked="true"`. The visually hidden "Done:" and "Not done:" text stays the state for assistive technology. b2 confirms the missing glyphs with the font parser of `swiss-index/fonts.test.ts:64-101`.
- **`image`:** text width, a decorative "Fig. n" and the caption (section 6).
- **`gallery`:** `grid` and `diptych` in two columns, `carousel` in one, all in one below 600px (91-93, 132).
- **`callout`:** the label in mono capitals; `note` a 1px ink box (today every variant: 98); `tip` the same box on `--si-plate`; `warning` the box plus a 4px signal rule at the left.
- **`code`:** mono at `--si-copy`, wrapped (102-103), on `--si-plate` (new) between 1px rules; no language label.
- **`divider`:** a 4px ink rule with 3rem margins (104). No change.
- **`embed`:** a link card, never an iframe (the renderer emits a link: `reader/components/article-body.tsx:153-163`): a 1px box, the title link at `--si-card` bold with a decorative arrow (`content: '↗' / ''`), the fallback as a mono caption, and a 44px target (101).
- **`editorial`** (`fact-box`, `key-points`, `methodology`, `related-stories`): a visible mono label that repeats the section's `aria-label` (`reader/components/article-body.tsx:15-20`), drawn as generated content with an empty alternative so it is not announced twice. `fact-box` is a `--si-plate` panel; `key-points` and `related-stories` sit under a 4px ink rule; `methodology` sits under a 1px rule, at `--si-copy` in secondary.
- **Inline marks:** bold 700; italic in the real italic face; `code` in mono; links with a 1px underline (10, 77); `u` with a dotted underline, so it does not read as a link; `s` struck through.

## 8. Motion and interaction

- **Nothing moves:** no transitions, transforms, sticky elements, parallax or scroll effects. Pages change through plain links.
- **Hover:** underlines only.
- **Reduced motion:** today's guard stays (`swiss-index/styles.ts:134-136`); there is no motion to reduce. The Theme popup's own fade and scale (`packages/web/src/components/theme-menu.tsx:64`) belongs to the shared component.
- **Focus:** a 2px solid `currentColor` outline at a 4px offset (`swiss-index/styles.ts:12`), `Highlight` in forced colours (137-140). No focusable element sits inside an `overflow: hidden` box. On a plate the ring surrounds the title link.
- **Skip link:** hidden until focused (16-17); its target, `main`, takes focus (`swiss-index/shell.tsx:62`).
- **Targets:** standalone links and buttons are at least 44 by 44px (today's rule, for example `swiss-index/styles.ts:15,21,26,35,44,54,63,101,110`).
- **Print:** one column without the navigation, footer index, Theme control or related stories (extends 141-146).

## 9. Accessibility

Target: WCAG 2.2 AA.

- **Headings:** one `h1` per page (`reader-directions/README.md:36-38`): the wordmark on home, the title on an article, the name on section, topic and author pages. Plate titles and list labels are `h2`; index-row and related titles are `h3`; body headings come from the story.
- **Landmarks:** `header`; `nav` "Sections"; `main`; `footer` with `nav` "Site index" (the two navigations need different names); `article` around the story.
- **Lists:** story lists are `ol` elements with `start` and `role="list"`; the visible numbers are `aria-hidden`.
- **Order:** DOM, focus and visual order agree at every width. The article `h1` now comes before the rail (today it follows it: `swiss-index/article.tsx:21,63`).
- **Targets:** at least 44 by 44px for standalone controls, above the 24px minimum of success criterion 2.5.8; links inside body text are exempt.
- **Link text:** every link names where it goes: titles; section, topic and author names; credit names; "Front page"; "Back to top"; "Skip to content". No "Read more".
- **Images:** alt text is required content (`packages/web/src/server/content/document.ts:131-139`); number plates and "Fig. n" are decorative; no text sits on images.
- **Colour:** never the only cue (section 5).
- **Reflow, zoom and spacing:** no horizontal scrolling at 320px or at 200% zoom; text containers have minimum heights only, so text-spacing overrides fit.
- **Themes:** light, dark, forced colours and print.

How it is checked:

- **Unit** (`swiss-index/views.test.tsx`, extended): one `h1` on each of the five page types; no invented authors, bios, descriptions or images (today's pattern: 78-93, 234-247); list semantics and hidden numbers; the preload rules; the article's DOM order.
- **Browser** (`swiss-index/swiss-index.e2e.ts`, extended): axe with today's WCAG 2.0 to 2.2 A and AA tags (163-165) on home, article, section, author and topic at 390 and 1440px in light and dark; no overflow from 320 to 1440px; 44px targets in the navigation, rail, end matter and footer; the keyboard path from the skip link through an article to the footer.
- **Shared:** `tests/e2e/reader-lab.spec.ts` keeps checking every direction with axe at 390 and 1440px (18-21, 193).
- **Manual,** recorded in the b3 worklog with versions: VoiceOver with Safari (iOS and macOS) and NVDA with Firefox on home and the long-table article; 200% zoom; a text-spacing override; Windows forced colours; print preview. Automated checks alone do not establish conformance (`docs/product/nonfunctional-requirements.md:13`).

## 10. Performance

The requirement is field LCP at most 2.5 s, INP at most 200 ms and CLS at most 0.1 at the 75th percentile (`docs/product/nonfunctional-requirements.md:17-21`). Enforced today, for visitors: story HTML under 150,000 bytes and no editor code on reader routes (`tests/e2e/homepage.spec.ts:219,234-235`). The Lighthouse harness measures home, article and section for the signed-in owner in a chosen direction on simulated mobile, and its scores are measurements, not gates (`scripts/lab-lighthouse.md:3-5,76-79`). No Swiss Index measurement is checked in at `cc68039`.

Budgets, proposed here; b3 records the first measurements and turns the deterministic ones into tests:

| Budget                          | Home       | Article         | Evidence                                                                                                            |
| ------------------------------- | ---------- | --------------- | ------------------------------------------------------------------------------------------------------------------- |
| LCP, lab                        | ≤ 2.5 s    | ≤ 2.5 s         | `scripts/lab-lighthouse.mjs`, production build, median of three runs                                                |
| CLS, cold and warm loads        | under 0.01 | under 0.01      | layout-shift observer as in `reader-directions/cinematic-feature/cinematic-feature.e2e.ts:279-325`, and Lighthouse  |
| Shift of the wordmark or `h1`   | 0          | 0               | the same observer, by element                                                                                       |
| INP                             | ≤ 200 ms   | ≤ 200 ms        | DevTools trace at 4x CPU slowdown (open Theme, follow a link); TBT ≤ 200 ms as a proxy                              |
| Font bytes                      | ≤ 105,000  | ≤ 130,000       | five normal faces are 104,192 (`swiss-index/fonts.test.ts:197`); one italic on a typical story, ≤ 157,000 with both |
| Lead image                      | ≤ 150 kB   | ≤ 150 kB        | transfer size of the chosen candidate                                                                               |
| Images loaded without scrolling | ≤ 400 kB   | ≤ 300 kB        | 390 by 844px, lazy images included                                                                                  |
| Story HTML                      | none       | under 150,000 B | the existing check, repeated with the Swiss cookie                                                                  |
| Direction CSS                   | ≤ 20,000 B | ≤ 20,000 B      | the `styles` and `tokens` strings, uncompressed                                                                     |

- **Italic font budget:** raised from 155,000 to 157,000 B on 2026-10-20 by operator decision. The genuine 400 and 700 italics bring the seven faces to 156,080 B; an italic file loads only on a page that uses it.
- **Lead element:** home, plate 01's image (or its title); article, the hero (or the `h1`); section and topic, plate 01's image (or the `h1`); author, the `h1`. The preload follows (section 6).
- **Fonts, cold:** faces use `font-display: optional` without preloads (`reader-directions/contract.ts:451`, `reader-directions/README.md:85-88`). A face that is not ready within the short block period is skipped for that page view: the metric-adjusted fallback stays, nothing swaps or shifts, and the file is cached for the next view. A first cold page often shows the fallback; that is accepted.
- **Fonts, warm:** cached faces render at once. Italic files load only on pages with italic text. Nothing is preloaded, and this spec asks for no contract change.
- **Screenshots** for review use the screenshot-only font gate (`reader-directions/capture-fonts.ts`); they are never performance evidence.
- **INP:** the direction adds no event handlers; the only client component it adds is the shared Theme menu. Lighthouse's TBT is a lab proxy, not INP; field INP waits for the Web Vitals beacon (`PRD.md:269`).
- **Images:** budgets apply to the candidate the browser picks at 390 by 844px (Lighthouse mobile) and at 1440 by 900px at device pixel ratios 1 and 2. If the sample exceeds a budget, fix `sizes` or the candidate choice first; never raise a budget without a recorded reason.

## 11. Delta from today and build batches

**Keep:**

- **Identity:** the id, name and thesis (`swiss-index/index.ts:13-17`), the palette (`swiss-index/tokens.ts:4-37`), the five font files and fallbacks (`swiss-index/fonts.ts`), the grid and breakpoints (`swiss-index/tokens.ts:22-26`, `swiss-index/styles.ts:111-133`) and the rule system.
- **Mechanics:** today's three `sizes` values, `SwissImagePreload` and the one-lead-image rule, the skip link and focusable `main`, the 44px targets, figure counters, print and forced-colour rules, and the lane's Playwright config and capture script (`swiss-index/playwright.config.ts`, `swiss-index/capture.mjs`).

**Change:**

- The masthead and footer, with "Front page" instead of "All stories" (2.1).
- The home cover and index; section plates and index (2.2, 2.3).
- The article order, rail, upright heroes, end matter and related stories (2.4).
- `ol` lists with hidden numbers, number plates, focal points and plate-wide title links (section 7).
- Tokens: `--si-body` and `--si-title`, and the new `--si-title-long`, `--si-plate-number` and `--si-plate` with two text pairs (sections 3 and 5).
- Italic faces (section 3) and the block treatments (section 7).
- The capture test saves to `docs/worklog/blog-0044.5` (`swiss-index/swiss-index.e2e.ts:246`); each build bead points it at its own worklog.

**Remove:**

- The rail's "Lead photo" (`swiss-index/article.tsx:46-59`).
- `aria-label` on number spans (`swiss-index/story-card.tsx:23`).
- The "All stories" labels (`swiss-index/shell.tsx:45-47,67-69`).
- The text-card padding (`swiss-index/styles.ts:45`), replaced by number plates.

**b1, home and section** (no dependency):

1. Shell: skip link, masthead with the Theme control and section index, footer with the site index and "Back to top".
2. Plate and index-row components: `ol` semantics, number plates, focal points, plate-wide title links.
3. Home cover and "Earlier stories"; section plates, index and empty state.
4. Tokens: `--si-plate`, `--si-plate-number`, `--si-body`, `--si-title`, `--si-title-long`, and the plate text pairs.
5. Tests in `views.test.tsx` and `swiss-index.e2e.ts` for home and section: structure, one `h1`, lists, unchanged preload rules, empty states, no overflow from 320 to 1440px, targets, axe in both themes at 390 and 1440px, keyboard.
6. Evidence: test output; screenshots of home and Interiors at 390, 768 and 1440px in both themes; JavaScript transferred on home before and after the Theme control.

**b2, article, author, topic and related** (after blog-0044.22 merges):

1. Article order and grid; the new rail; no "Lead photo".
2. Upright heroes with their `sizes` and caption placement.
3. End matter (topics, image credits) and related plates.
4. The `Author` (bibliography) and `Topic` (plates and index) views, registered in `swiss-index/index.ts`.
5. Block treatments (section 7) and the italic faces (`fonts.ts`, `sources.json`, and the totals and italic checks in `fonts.test.ts`).
6. Tests: unit tests for the three page types (author links, topics, related, nulls left empty, one `h1`, DOM order); e2e for the new routes; today's long-title, image-free, short and long-read stories (`swiss-index/swiss-index.e2e.ts:81-108`) plus the four upright heroes.
7. Evidence: screenshots of a landscape-hero article, an upright-hero article, an author page and a topic page at 390, 768 and 1440px in both themes.

**b3, media, accessibility and Core Web Vitals, with evidence:**

1. Lighthouse for home, article and section, median of three, with versions and server state (`scripts/lab-lighthouse.md:76-79`); author and topic pages in Chrome DevTools, since the harness covers three routes.
2. A cold and warm layout-shift test for home and article (section 10).
3. An image audit: `currentSrc` against the needed candidate for plates, heroes, body figures and galleries; bytes against the budgets; focal crops at 390, 768 and 1440px.
4. A font audit: requests per page type, italics only where used.
5. The manual accessibility pass (section 9), with fixes.
6. Not-found and error pages as in 2.7 if the kit has added a direction hook; otherwise the gap is recorded.
7. The story HTML budget, repeated with the Swiss cookie.

**Dependencies and risks:**

- **blog-0044.22:** b2 waits for it; its names may differ from this spec's.
- **blog-0044.29** (sample content): longer lists to test index rows and the author and topic pages.
- **Theme control:** it brings the shared menu's client code to Swiss pages; b1 measures it. The registry test rejects only font and stylesheet imports (`reader-directions/registry.test.ts:34-50`).
- **Not-found and error pages** need a contract hook (2.7).
- **Gallery and body-figure `sizes`** belong to the shared renderer (section 6).
- **Lighthouse harness:** it covers home, article and section only.

## 12. Open questions for the client

1. **Masthead name.** The masthead sets the magazine's name large, on two lines. Is the final name short enough for that, or should it sit on one line?
2. **Signal colour.** One orange marks the lead story and the current page, and nothing else. Keep the orange, or use a colour from your brand? (Black text must stay readable on it.)
3. **Author bios.** Author pages show a short bio when there is one and work without it. Will authors have bios at launch?
