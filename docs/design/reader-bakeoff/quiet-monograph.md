# Quiet Monograph: developed-magazine spec

Draft for review. Not approved by the owner or the client.

- **Direction:** A, `quiet-monograph` ("Quiet Monograph"). Spec bead: `blog-0044.23`.
- **Starting point:** `origin/main` at `094024a`. "Today" means that commit.
- **Depends on:** the shared kit `blog-0044.22` (K1: Author and Topic views, article author links, topics and related stories) and the planned `blog-0044.34` (K4: per-direction not-found and error views, and a sizes hook for body images and galleries). Neither is merged at `094024a`. Names follow those beads' plans (`AuthorView`, `TopicView`, `authorLinks`, `topics`, `related`, `NotFound`, `Error`); builders use the names that land.
- **Paths:** `quiet-monograph/` is `packages/web/src/reader-directions/quiet-monograph/`, `reader-directions/` is `packages/web/src/reader-directions/`, `reader/` is `packages/web/src/reader/`, `fonts/` is `packages/web/public/reader-directions/quiet-monograph/fonts/`, and `north-house.ts` is `packages/web/src/server/lab/north-house.ts`. Other paths start at the repository root. A bare line number refers to the last file named, unless a list says otherwise.
- **Sample content:** the North House seed (`north-house.ts`, "the sample" below): eight stories in three sections, with no authors or topics yet. K3 (`blog-0044.29`) adds them.
- **Measurements** quoted below (contrast ratios, glyph coverage, text widths) were computed at `094024a` with the repository's contrast formula (`reader-directions/contrast.ts:104-118`) and, on the vendored font files, the font parser that `quiet-monograph/fonts.test.ts:52-59` uses. b1 can repeat them.

## 1. Thesis

Quiet Monograph presents the magazine as an exhibition catalogue. Each story has the page to itself: its picture is shown whole, like a plate on paper, with the title in a light serif and a calm sans-serif text column below. Lists further down are quiet checklists of titles. The only colour on the page comes from the pictures.

Readers should feel unhurried and looked after, as in an empty gallery on a weekday morning: nothing competes, nothing moves, and every story seems worth the space it is given. The registered name and thesis stay (`quiet-monograph/index.ts:13-18`).

What separates it from the other four directions:

- **Pictures are never cropped.** Every image is shown whole, at its own proportions. The other four crop with `object-fit: cover` (`reader-directions/literary-longread/styles.ts:38,48`, `reader-directions/swiss-index/styles.ts:39`, `reader-directions/cinematic-feature/styles.ts:33,56,68`, `reader-directions/expressive-colour/styles.ts:48`). Today's Quiet Monograph styles contain no crop rule (`quiet-monograph/styles.ts`); the developed direction makes this a rule.
- **One axis, one story at a time.** Pages are composed on a centre line, and the home page gives each of its first four stories a band of its own. The others set stories in grids of three or four (`reader-directions/literary-longread/styles.ts:45`, `reader-directions/swiss-index/styles.ts:29`, `reader-directions/expressive-colour/styles.ts:30`) or put text over a full-bleed cover image (`reader-directions/cinematic-feature/styles.ts:31-38`).
- **Light serif titles over a sans-serif text.** The titles are Cormorant Garamond and the text is Jost (`quiet-monograph/fonts.ts:16-19,31-35`). Literary Long-read sets its body in a serif too (`reader-directions/literary-longread/styles.ts:4`). Swiss Index and Cinematic Feature pair a grotesk with a mono (`reader-directions/swiss-index/fonts.ts:16-18,32-33`, `reader-directions/cinematic-feature/fonts.ts:17,31-32`), and Expressive Colour pairs a soft serif with a mono (`reader-directions/expressive-colour/fonts.ts:17-18,31-32`).
- **No accent colour.** The others each have one or more: red and gold (`reader-directions/literary-longread/tokens.ts:9,12`), signal orange (`reader-directions/swiss-index/tokens.ts:8`), amber (`reader-directions/cinematic-feature/tokens.ts:8`), a colour per story (`reader-directions/expressive-colour/tokens.ts:4-9`).
- **A warm graphite night version** (section 5), lighter than the other dark grounds (`reader-directions/literary-longread/tokens.ts:32`, `reader-directions/swiss-index/tokens.ts:29`, `reader-directions/cinematic-feature/tokens.ts:5`). Expressive Colour stays on paper in both themes (`reader-directions/expressive-colour/tokens.ts:11`).

## 2. Pages and layout

Widths: mobile below 768px, tablet 768–1023px, desktop 1024px and up (section 4).

### 2.1 Every page

Today (`quiet-monograph/shell.tsx`):

- a skip link, "Skip to stories" (34-36);
- a masthead with the site name in letter-spaced capitals, an `h1` on home and a `p` elsewhere (30, 38-40);
- a `details` disclosure, "Menu", at every width, holding `nav` "Sections" with "All stories" and the sections (41-65);
- `main#qm-main` (67);
- a footer with the site name and "All stories ↗" (70-75).

There is no Theme control: only baseline's header renders the shared `ThemeMenu` (`reader/components/site-header.tsx:29`), although the lab tour asks the owner to "switch to dark mode with Theme" (`packages/web/src/reader-lab/lab-tour.tsx:32`).

Developed:

- **Skip link:** "Skip to content". The target stays `main`.
- **Masthead, desktop:** row 1 holds the wordmark, centred, with the Theme control at the right edge on the same line. Row 2 holds `nav` "Sections", centred: "Front page", then the sections in navigation order (alphabetical: `reader/read-model.ts:92-107`). Links use the label style (section 7), sit 2.5rem apart and are at least 44 by 44px. A 1px sand rule closes the masthead, as today (`quiet-monograph/styles.ts:19`).
- **Masthead, tablet and mobile:** one row: the wordmark at the left (on two lines if needed), then the Theme control and the "Menu" disclosure at the right, in that DOM order. The disclosure stays a native `details` element, with no script. When open, its `nav` "Sections" spans the masthead below the row and lists "Front page" and the sections one per line, centred, in Cormorant at `--qm-card`, each at least 44px high. Below 600px the Theme trigger shows only its icon and keeps its accessible name, "Choose color theme" (`packages/web/src/components/theme-menu.tsx:47`).
- **One `nav` "Sections" at a time:** the desktop row and the disclosure are separate elements. `display: none` hides whichever does not apply, so the accessibility tree has one.
- **Current page:** `aria-current="page"` and a 1px underline on "Front page" (home) or the current section, as today (`quiet-monograph/shell.tsx:49,56`, `quiet-monograph/styles.ts:29`).
- **Footer:** a 1px sand rule, then, centred: the site name in the wordmark style; `nav` "Contents" with "Front page" and every section, wrapping, in the label style; and a "Back to top" link to `#qm-top` on the page wrapper.
- **"Front page" replaces "All stories"** wherever it appears: home shows the newest story and at most 12 more (`reader/read-model.ts:38`), not all stories.
- **The "↗" arrows go** (`quiet-monograph/shell.tsx:73`, `quiet-monograph/home.tsx:43`). Neither family has U+2197 in its Latin subset, so a system font draws it today.
- **Background:** the root keeps painting `--qm-paper` (`quiet-monograph/styles.ts:3`), which covers the Reader Lab bar's reserved space (`packages/web/src/reader-lab/reader-page.tsx:26-31`). The paper now follows the theme (section 5).

### 2.2 Home

Today (`quiet-monograph/home.tsx`):

- a centred cover: section label, the lead title as an uppercase `h2`, the preloaded image inside a link that has `aria-label` "Read: {title}" and is left out of the tab order, the dek, and a "Read the story ↗" link (23-46);
- the next three stories as text-only titles with dates, in three columns (47-68; `quiet-monograph/styles.ts:42`);
- "More stories" as a text list (`quiet-monograph/home.tsx:69-90`);
- an empty state, "No stories yet" (92-97).

So the home page shows one image. Stories run newest first by publication time (`packages/web/src/server/content/reader.ts:47-50,62`).

Developed, in DOM order:

1. **Cover (the lead story).** Centred: section label; the title as `h2` at `--qm-title` (`--qm-title-long` above 80 characters), as written rather than in capitals, at most 14em per line; the plate in the cover box (section 6), preloaded; the dek in Cormorant italic at `--qm-dek`, at most 20em; and the meta line (date · reading time). The title link is the cover's only link to the story. Its `::after` covers the cover block, so the picture is clickable without a second link. A text-only lead has no plate and gets `--qm-space` above and below, as today (`quiet-monograph/styles.ts:40`).
2. **Rooms (stories 2–4, `recent[0..2]`).** Each story stands alone in its own band, `--qm-space` apart. The plate comes first, in the room box, then its wall label, centred: section label, `h3` title at `--qm-heading`, dek in Jost at `--qm-copy` in stone ink (at most 30em), and the meta line. A text-only story has no plate: a 1px sand rule, then its wall label. A visually hidden `h2`, "Recent stories", heads the rooms (today's pattern: `quiet-monograph/home.tsx:49-51`).
3. **Earlier stories (`recent[3..]`, at most nine).** The `h2` "Earlier stories" in the label style, then checklist rows (section 7) in a centred 46rem column. No images.
4. **Empty:** today's heading and sentence (`quiet-monograph/home.tsx:93-96`), centred. The masthead and footer show only "Front page", because navigation lists only sections with a visible story (`reader/read-model.ts:92-98`).

At each width: desktop centres the rooms with plates up to 46rem wide; tablet uses the same layout at 92vw; mobile has one column with plates at full content width, and checklist rows stack.

With the sample, the cover holds the winter-light story (a 1440 by 960 image); the rooms hold the boathouse (16:9, with a 157-character title), the chair (no image) and the shelf (square); the earlier list holds the other four (`packages/web/src/server/lab/north-house.ts:211-228,288-399,679-688`).

### 2.3 Section

Today (`quiet-monograph/section.tsx`):

- a centred header with the label "Section", the `h1` at `--qm-section-title`, and the description when there is one (20-24). It is always `null` today (`reader/views.ts:59-60`, `reader/read-model.ts:206`).
- every story as a card, two columns from 768px (`quiet-monograph/styles.ts:99,109-110`), with the image and title inside one link (`quiet-monograph/section.tsx:32-37`) and the first card's image preloaded (13, 34). Each image keeps its own ratio, so titles do not line up across a row.
- an empty-state sentence (46).

Developed:

- **Header, centred:** label "Section"; the `h1` at `--qm-section-title`; the description in Cormorant italic at `--qm-dek`, at most 20em, only when it is not null; and the count, "N stories" or "1 story", in the meta style.
- **The hang (stories 1–6):** two columns from 768px, with today's gaps (`quiet-monograph/styles.ts:99`). Each plate is a square bay. The picture is shown whole, standing on the bay's bottom edge, so titles align across a row. Below the bay is the wall label without the section: `h2` title at `--qm-card`, dek at `--qm-copy`, and the meta line. A story without an image shows a monogram bay (section 7) when it shares a row.
- **"Earlier in {section}" (from story 7):** an `h2` in the label style, then checklist rows without the section label.
- **Mobile:** one column. Plates are full width without bays, because there is no row to align, and there are no monograms.
- **Empty:** the count reads "No stories", followed by today's sentence (`quiet-monograph/section.tsx:46`) and a "Front page" link.
- **Lead image:** the first plate's picture. There is none when the first story has no image (today's rule: `quiet-monograph/views.test.tsx:157-169`).

The sample's sections hold four, two and two stories (each story's `section` field). In Craft, the chair (no image) is newest and shares a row with the door handle (4:5), so the first row shows a monogram.

### 2.4 Article

Today (`quiet-monograph/article.tsx`):

- the hero comes first: centred, at its own ratio, up to 60rem wide, and preloaded (17-21; `quiet-monograph/styles.ts:54`);
- then a centred header: section label, `h1` at `--qm-title`, dek, a byline with the authors as plain text (always empty today: `reader/read-model.ts:179`), and the date and reading time (`quiet-monograph/article.tsx:22-34`);
- then the body at 66ch (35-37; `quiet-monograph/styles.ts:61`).

A 4:5 hero (two of the seven sample heroes: `north-house.ts:139-156,175-192`) is therefore 60rem wide and 75rem tall on a desktop, and the title starts more than a screen down.

Developed, in DOM order, which is also the focus order:

1. **Plate:** the hero in the hero box (section 6): shown whole, centred, at most 58rem wide and two-thirds as tall. Its caption sits below it as a wall label (section 6). It is preloaded.
2. **Header, centred:**
   - section label;
   - `h1` at `--qm-title`, or `--qm-title-long` above 80 characters (the boathouse title has 157: `north-house.ts:355-356`);
   - dek in Cormorant italic at `--qm-dek`;
   - byline: "By" and the `authorLinks` as links, joined as an English list (`Intl.ListFormat('en', { type: 'conjunction' })`), left out when there are none;
   - the meta line.
3. **Body:** the shared `ArticleBody` in a centred 30em column (section 3). Figures and galleries step out to 42rem, as today (`quiet-monograph/styles.ts:80`).
4. **End matter**, centred, under a 4rem stone rule: an `h2` "Topics" in the label style, then the `topics` as links in a wrapping row. Left out when there are none.
5. **Read next:** an `h2` "Read next" in the label style. The first `related` story appears as a room (plate and wall label, with an `h3` title), and the rest as checklist rows with `h3` titles. Left out when `related` is empty. It is not called "Related stories" because that editorial block already uses the name for a region (`reader/components/article-body.tsx:19,166-170`).

On tablet and mobile the order is the same. Mobile has one column: the plate is full width in the mobile box, and the header and body take the full content width.

- **No hero:** the header comes first, with `--qm-space` above it (today 2rem: `quiet-monograph/styles.ts:57`). Nothing is preloaded.
- **Short story** (the shelf story has two paragraphs: `north-house.ts:386-399`): the same structure. The end matter and Read next keep the page from stopping short.
- **Long read** (the long-table story uses every block type: `north-house.ts:401-587`): section 7.

### 2.5 Author (kit view)

`AuthorView` has a name, slug, href, bio (or null), stories and navigation. The authors table has no portrait column (`packages/web/src/server/database/schema.ts:33-44`), so no portrait is shown. The bio column defaults to empty text (36); the view's bio is null when none is stored (K1).

- **Header, centred:** label "Author"; the name as the `h1` at `--qm-title`; the bio in Cormorant italic at `--qm-dek`, at most 24em, only when it is not null; and the count line.
- **Latest:** the newest story as a room, with an `h2` title. Its picture is the page's lead image.
- **"More by {name}":** an `h2` in the label style, then checklist rows with section labels.
- **Empty:** "No published stories by {name} yet." and a "Front page" link.
- **Widths:** as for home rooms and checklist rows.

### 2.6 Topic (kit view)

`TopicView` has a name, slug, href, description (or null), stories and navigation. Taxonomy terms have no description column (`packages/web/src/server/database/schema.ts:215-226`), so the description is null for now.

- **Layout:** the section layout (2.3) with the label "Topic". Plates and rows keep their section label, because a topic crosses sections.
- **Empty:** "No published stories on this topic yet." and a "Front page" link.
- **Lead image:** the first plate's picture, as on section pages.

### 2.7 Not found, error and unavailable

Today none of these can be styled by a direction:

- story and section pages call `notFound()` before the direction is resolved (`packages/web/src/app/stories/[slug]/page.tsx:59-61`, `packages/web/src/app/sections/[slug]/page.tsx:45-47`), so the global `packages/web/src/app/not-found.tsx` renders outside any direction root;
- the client error boundary `packages/web/src/app/error.tsx` replaces the page;
- when no store is configured, the home page renders the shared `ReaderUnavailable` inside the direction root (`packages/web/src/app/page.tsx:19`). It is the same in every direction by design (`reader/components/reader-unavailable.tsx:3-6`).

Developed, for K4's optional `NotFound` and `Error` views:

- **Frame:** the masthead and footer. They have no section links unless K4 passes navigation.
- **Content, centred, `--qm-space` below the masthead:**
  - a label, "Not found" or "Error";
  - the `h1` at `--qm-title`, "Page not found" or "Something went wrong";
  - one sentence in Jost at `--qm-body`: "The page may have moved, or the address may be mistyped." or "The page could not be shown. Please try again.";
  - a "Front page" link.
- **Try again:** the error view adds a "Try again" button that calls the boundary's reset. It uses the label style with a 1px ink underline and is 44px high.
- **Unavailable:** if K4 adds a hook, the same block with today's copy (`reader/components/reader-unavailable.tsx:12-19`); otherwise no change.

Until K4 lands, b3 records the gap.

## 3. Typography

Families: local Latin WOFF2 subsets, declared as data in `quiet-monograph/fonts.ts`:

- **Cormorant Garamond** (display), SIL Open Font License 1.1. Today it has 400 and 500 normal (16-19), from Fontsource's font-files repository, with provenance in `fonts/sources.json` and the licence in `fonts/Cormorant-Garamond-OFL.txt`. **Add 400 italic** (`cormorant-garamond-latin-400-italic.woff2`) as a `style: 'italic'` source (`reader-directions/contract.ts:45-46`). Deks, bios, descriptions, pull quotes and italics inside headings use it.
- **Jost** (text), SIL Open Font License 1.1, has 300, 400 and 500 normal today (`quiet-monograph/fonts.ts:31-35`). **Add 400 italic** (`jost-latin-400-italic.woff2`) for italic body text, which the browser synthesizes today; the sample uses it (`north-house.ts:366,408`). **Remove 300**: only the deks use it (`quiet-monograph/styles.ts:38,59`), they move to Cormorant italic, and its thin strokes are the weakest text on the page.
- **Vendoring:** add the italics the same way as today's files (`fonts/README.md:3-7`). Record URL, Git blob SHA, bytes and SHA-256 in `sources.json`; the licences are already present for both families. If either Latin italic file is missing, b1 stops and reports rather than shipping a substitute.
- **Fallbacks stay:** Times New Roman for Cormorant and Arial for Jost, with today's metrics (`quiet-monograph/fonts.ts:8-14,23-29`; reproduce them with `quiet-monograph/font-metrics.mjs`). Each italic shares its family's fallback.
- **No synthesis:** set `font-synthesis: none` on `.qm-page`, and `strong` is 500 in both families.
- **Weights:** Cormorant 400 for titles and headings, and 500 for the wordmark and `h4`–`h6`. Jost 400 for text, and 500 for labels and `strong`.

Type scale. Today's values are in `quiet-monograph/tokens.ts:13-20`; the wordmark size is in `quiet-monograph/styles.ts:20`.

| Token                   | Today                                               | Developed                                     | Use                                                    |
| ----------------------- | --------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------ |
| `--qm-label`            | `0.75rem`                                           | unchanged                                     | labels and navigation, in capitals                     |
| `--qm-small`            | `0.8125rem`                                         | unchanged                                     | captions, meta lines, byline                           |
| `--qm-copy` (new)       | none                                                | `1rem`                                        | plate deks, methodology blocks                         |
| `--qm-body`             | `clamp(1.125rem, 1rem + 0.25vw, 1.25rem)`           | unchanged                                     | body text: 18px to 800px wide, 20px from 1600px        |
| `--qm-dek`              | `clamp(1.25rem, 1rem + 0.6vw, 1.625rem)`            | `clamp(1.375rem, 1.1rem + 0.8vw, 1.875rem)`   | deks, bios, descriptions (Cormorant italic), `h4`–`h6` |
| `--qm-card`             | `clamp(1.75rem, 1.4rem + 0.8vw, 2.25rem)`           | unchanged                                     | plate and row titles, body `h3`                        |
| `--qm-heading`          | `clamp(2rem, 1.5rem + 1vw, 2.75rem)`                | unchanged                                     | room titles, body `h2`, pull quotes                    |
| `--qm-title`            | `clamp(2.625rem, 1.5rem + 4vw, 5rem)`               | unchanged                                     | cover title; article, author and error `h1`            |
| `--qm-title-long` (new) | none                                                | `clamp(2rem, 1.4rem + 2vw, 3.25rem)`          | the same, for titles over 80 characters                |
| `--qm-section-title`    | `clamp(3.75rem, 2rem + 6vw, 7.5rem)`                | `clamp(2.75rem, 1.5rem + 6vw, 7.5rem)`        | section and topic `h1`                                 |
| `--qm-wordmark` (new)   | in styles: `clamp(1rem, 0.8rem + 0.5vw, 1.3125rem)` | `clamp(0.9375rem, 0.8rem + 0.5vw, 1.3125rem)` | wordmark                                               |
| `--qm-monogram` (new)   | none                                                | `clamp(6rem, 3rem + 8vw, 10rem)`              | monogram bays (decorative)                             |

The section title shrinks on phones because "Architecture" at today's 60px minimum is 299px wide (measured), wider than the 280px line at 320px, so `overflow-wrap: anywhere` (`quiet-monograph/styles.ts:4`) splits it. At 44px it is 219px. The wordmark's lower minimum and 0.2em tracking below 600px fit "FOUNDATION" (about 128px) beside the masthead controls at 320px.

Measure and wrapping:

- **Body measure: 30em**, about 71 characters of Jost per line. Today's 66ch (`quiet-monograph/tokens.ts:22`) is 792px at 20px. Because Jost's zero is 0.6em wide while its average character is 0.42em (measured over sample text), 66ch holds about 94 characters per line, beyond the comfortable 60–75. All Quiet Monograph measures use em, not ch.
- **Other measures:** deks and descriptions 20em, bios 24em, plate deks 30em, captions 34em, titles 14em (today the cover title is capped at 21ch: `quiet-monograph/styles.ts:34`).
- **Line height:** 1.8 for body text (`quiet-monograph/tokens.ts:21`), 1.05 for titles, 1.2 for headings (`quiet-monograph/styles.ts:58,63`), 1.45 for deks.
- **Wrapping:** `text-wrap: balance` on titles and headings (today: `quiet-monograph/styles.ts:8`), `pretty` on deks and captions. No hyphenation.
- **Tracking:** the wordmark 0.32em (0.2em below 600px) and labels 0.18em, as today (`quiet-monograph/styles.ts:20,31`). Titles have none.
- **Case:** capitals only for the wordmark and labels. Titles keep the case they were written in (today the cover title is in capitals with 0.035em tracking: `quiet-monograph/styles.ts:34`).

What changes: genuine italics in both families; Jost 300 removed; deks in Cormorant italic; a 30em measure instead of 94-character lines; cover titles no longer in capitals; a long-title size; smaller section titles on phones; and the wordmark size as a token.

## 4. Grid, spacing and breakpoints

Quiet Monograph has no column grid. It has one centre axis, and every part of the page takes a fixed width on it. Today the page is `min(100% - var(--qm-gutter) * 2, var(--qm-page))` (`quiet-monograph/styles.ts:19,30,106`), with `--qm-page` 75rem, the gutter `clamp(1.25rem, 4vw, 4rem)` and `--qm-space` `clamp(4rem, 9vw, 8rem)` (`quiet-monograph/tokens.ts:23-25`). All of these stay.

| Part           | Width                                         | Holds                                       |
| -------------- | --------------------------------------------- | ------------------------------------------- |
| Page (W)       | `min(100% - 2 × gutter, 75rem)`               | masthead, footer, the hang                  |
| Cover and hero | `min(W, 58rem)`                               | cover and hero plates                       |
| Room           | `min(W, 46rem)`                               | rooms, Read next, the author's latest, rows |
| Figure         | `min(W, 42rem)`                               | body figures and galleries                  |
| Text           | `min(W, 30em)` at body size                   | body, header deks                           |
| Hang cell      | `(W - clamp(2rem, 7vw, 7rem)) / 2` from 768px | section and topic plates                    |

W is `100vw - 2.5rem` below 500px (the gutter's floor), `92vw` from 500px, and 75rem from about 1305px. These formulas are the only source of the `sizes` values in section 6.

- **Breakpoints:** 600px (wordmark tracking, Theme label), 768px (two-column hang, two-up galleries), 1024px (navigation row instead of the menu). Today there is one, at 767px (`quiet-monograph/styles.ts:109-115`).
- **Checked widths:** 320 (reflow), 360, 390, 768, 1024, 1280 and 1440px. Today's tests check 360 to 1440 (`quiet-monograph/quiet-monograph.e2e.ts:55,90`).
- **Spacing:** a 0.25rem base; component gaps of 0.5, 0.75, 1, 1.25, 1.75, 2.5 and 3rem; `--qm-space` between the parts of a page; paragraphs 1.75rem apart (`quiet-monograph/styles.ts:62`); headings 3rem above and 1.25rem below (63).
- **Rules:** 1px sand hairlines separate (the masthead, rows and footer: `quiet-monograph/styles.ts:19,48,106`). A centred 4rem stone rule marks an end (divider and end matter: 96). The only boxes are callouts, editorial blocks, embeds and monogram bays.

## 5. Colour

| Token                    | Light                         | Dark      | Role                                                            |
| ------------------------ | ----------------------------- | --------- | --------------------------------------------------------------- |
| `--qm-paper`             | `#F6F5F1`                     | `#2E2B27` | page ground                                                     |
| `--qm-ink`               | `#1C1B19`                     | `#EEEBE4` | text, titles, focus ring, checklist boxes                       |
| `--qm-stone-ink`         | `#6B665E` (today `#746F67`)   | `#B5AEA2` | labels, meta lines, captions, plate deks                        |
| `--qm-stone`             | `#7A766E`                     | `#8C867C` | decorative: quote rule, divider, monograms                      |
| `--qm-sand`              | `#D9D3C7`                     | `#4A463F` | hairlines, selection ground, image placeholder                  |
| `--qm-print` (new)       | `0 0.5rem 1.75rem #1C1B1914`  | `none`    | plate shadow (today's value: `quiet-monograph/styles.ts:37,55`) |
| `--qm-print-hover` (new) | `0 0.75rem 2.25rem #1C1B1926` | `none`    | plate shadow on hover and focus                                 |
| `--qm-scheme` (new)      | `light`                       | `dark`    | the root's `color-scheme`                                       |

Today the direction declares only a light set (`quiet-monograph/tokens.ts:3-26`) and fixes `color-scheme: light` (`quiet-monograph/styles.ts:3`). Its browser test asserts that the paper stays light in dark mode (`quiet-monograph/quiet-monograph.e2e.ts:129-132`). The contract emits a dark set under `.dark` (`reader-directions/contract.ts:420-428`), which next-themes sets on `html` (`packages/web/src/components/theme-provider.tsx:9-12`). Tokens a dark set does not name keep their light value (`reader-directions/contract.ts:65-66`).

Text pairs, all declared in `textPairs`, which the contract checks in both themes when the direction registers (`reader-directions/contract.ts:285-297`):

| Text on background      | Light   | Dark    |
| ----------------------- | ------- | ------- |
| ink on paper            | 15.78:1 | 11.83:1 |
| stone ink on paper      | 5.22:1  | 6.40:1  |
| ink on sand (selection) | 11.55:1 | 7.88:1  |

Every pair targets 4.5:1, large text included. The ratios use the WCAG formula in `reader-directions/contrast.ts:104-118`. The pairs are today's (`quiet-monograph/tokens.ts:27-31`). Today's stone ink reaches 4.57:1; the darker value gives small capitals at 12px a safer margin.

- **Stone ink never sits on sand** (3.82:1 in light). Selected text uses ink.
- **Non-text (3:1):** the focus ring and checklist boxes use ink (at least 11.83:1). Hairlines (1.37:1 light, 1.50:1 dark) and stone marks (4.15:1 and 3.90:1) are decorative; no control is drawn with them alone.
- **No accent colour.** State is shown by underline, weight or words.
- **No text on images.**
- **Dark:** pictures keep their colours and lose the print shadow; the image placeholder is dark sand.

## 6. Imagery

**Art direction.** Every picture is shown whole: no `object-fit: cover`, no focal-point crop, no text on pictures, and square corners (`quiet-monograph/styles.ts:13`). One picture leads each page; lists further down are text.

- **Home:** the cover plate (3:2 box), then three room plates (5:4 box). No images in the earlier list.
- **Section and topic:** square bays in the hang. No images in rows.
- **Article:** the hero in the 3:2 box. Body figures are 42rem wide and at most 85svh high (`object-fit: contain`). Galleries use square bays, two-up for `grid` and `diptych`, and stacked one per row for `carousel`. Read next has one room plate.
- **Author:** one room plate for the latest story.
- **Not found and error:** none.

**Boxes and fit.** Each plate slot has a box: a maximum width and an aspect ratio for each width range.

| Slot                                        | 768px and up         | Below 768px |
| ------------------------------------------- | -------------------- | ----------- |
| Cover, hero                                 | `min(W, 58rem)`, 3:2 | W, 4:5      |
| Room (home 2–4, Read next, author's latest) | `min(W, 46rem)`, 5:4 | W, 4:5      |
| Hang bay (section, topic)                   | hang cell, 1:1       | W, 4:5      |

For an image with stored dimensions, with ratio r = width / height, the view computes fit = min(1, r / box ratio) for each column. It sets these as `--qm-fit` and `--qm-fit-sm` inline on the plate. The CSS sets a directly nested `img` to `width: calc(var(--qm-fit) * 100%)` (below 768px, `--qm-fit-sm`) with `height: auto`, centred. The image's `width` and `height` attributes reserve its space before it loads (`reader/components/reader-image.tsx:44-47,51,61`), so nothing shifts.

- **Hang bays** keep their square (`aspect-ratio: 1`), and the picture stands on the bay's bottom edge (`display: flex; align-items: end; justify-content: center`).
- **Originals without stored dimensions** keep the shared 3:2 frame (`reader/components/reader-image.tsx:66-74`) with fit 1. QM still shows them whole inside it: the frame's background is transparent, the image uses `object-fit: contain`, and `object-position: 50% 50% !important` overrides the inline focal-point position the component sets (56-60).
- **Focal points:** Quiet Monograph does not use them, because it never crops.
- **Sample:** the winter-light cover (3:2) fills its box. A 4:5 hero (north room, door handle) is drawn at 0.533 of the box width on a desktop, about 31 by 39rem, and at full width on phones. A square bay holds the square shelf image at full size, and the 16:9 boathouse at full width and 56% of the bay's height.

**`sizes`**, one value per slot, from the widths in section 4, with each width scaled by the image's fit: `f` is `--qm-fit` and `s` is `--qm-fit-sm`. Where a factor is 1, write the plain width; otherwise write `calc(width * factor)`, with the factor to three decimals.

```text
cover, hero  (min-width: 1009px) calc(58rem * f), (min-width: 768px) calc(92vw * f), (min-width: 500px) calc(92vw * s), calc((100vw - 2.5rem) * s)
room         (min-width: 800px) calc(46rem * f), (min-width: 768px) calc(92vw * f), (min-width: 500px) calc(92vw * s), calc((100vw - 2.5rem) * s)
hang bay     (min-width: 1600px) calc(34rem * f), (min-width: 1305px) calc((37.5rem - 3.5vw) * f), (min-width: 768px) calc(42.5vw * f), (min-width: 500px) calc(92vw * s), calc((100vw - 2.5rem) * s)
```

With both factors at 1, the cover value describes the same widths as today's `coverSizes` (`quiet-monograph/home.tsx:9`), and the hang value is today's `cardSizes` (`quiet-monograph/section.tsx:9-10`). The hero narrows from 60rem (`quiet-monograph/article.tsx:8`) to 58rem. For example, a 4:5 hero gives `(min-width: 1009px) calc(58rem * 0.533), (min-width: 768px) calc(92vw * 0.533), (min-width: 500px) 92vw, calc(100vw - 2.5rem)`. Variants are AVIF and WebP over a PNG or JPEG fallback, at 320 to 1920px, and never upscaled (`packages/web/src/server/content/media-variant-rules.ts:8,51-62`, `reader/media-variants.ts:58-77`). Fit-scaled sizes keep a portrait from fetching a landscape-width file.

Body figures and galleries take the shared renderer's value, `(min-width: 768px) 42rem, 100vw` (`reader/components/article-body.tsx:13`). When K4's sizes hook lands, Quiet Monograph passes:

```text
figure, carousel  (min-width: 731px) 42rem, (min-width: 500px) 92vw, calc(100vw - 2.5rem)
grid, diptych     (min-width: 768px) 20.25rem, (min-width: 731px) 42rem, (min-width: 500px) 92vw, calc(100vw - 2.5rem)
```

If the hook takes one gallery value, use the figure value: a larger file rather than a blurred one. A portrait body figure capped at 85svh fetches more pixels than it shows; b3 measures it.

**Lead image.** One per page. `MonographImagePreload` preloads it with the same `srcset`, `sizes` and type as the picture's first source (`quiet-monograph/image-preload.tsx:10-27`, tested in `quiet-monograph/views.test.tsx:91-129`), and the same `sizes` string goes to `ReaderImageView`.

- **Home:** the cover's picture. None for a text-only lead; rooms are never promoted.
- **Section and topic:** the first plate's picture. None when the first story has no image.
- **Article:** the hero. None without one.
- **Author:** the latest story's picture. None without one.
- **Everything else** loads lazily (`reader/components/reader-image.tsx:50-52`).

**Captions and credits.** The shared `ReaderFigure` caption holds the caption and "Credit: name", linked when there is a URL (`reader/components/reader-image.tsx:77-111`). Quiet Monograph sets it as a wall label: centred under the picture, 1rem below it, in Jost at `--qm-small` and stone ink, at most 34em wide, with credit links 44px high (today: `quiet-monograph/styles.ts:14-15`). Plates in lists have no caption, because they use `ReaderImageView`. There is no separate credits list: every picture carries its own credit, as a wall label does.

**Placeholders.** Plates keep the sand ground while their picture loads (`quiet-monograph/styles.ts:13`). Body figures, whose box can be wider than a portrait picture, have a transparent ground.

Image weight budgets are in section 10.

## 7. Components and editorial blocks

**Masthead, navigation and footer** (2.1):

- **Wordmark:** Cormorant 500 at `--qm-wordmark`, in capitals, with 0.32em tracking (0.2em below 600px), as today (`quiet-monograph/styles.ts:20-21`).
- **Links:** the label style, at least 44 by 44px (today: 28, 32).
- **Theme control:** the shared `ThemeMenu`, given `className="qm-theme"` (`packages/web/src/components/theme-menu.tsx:31-33,52`). It has no border, radius, background or shadow, uses Jost at `--qm-small` in ink, and is 44px high. Its popup renders in a portal outside the direction root and keeps the shared look (60-66).

**Label style:** Jost 500 at `--qm-label`, 0.18em tracking, in capitals and stone ink (today's `.qm-label`: `quiet-monograph/styles.ts:31-32`). Links in it are ink and underline on hover.

**Meta line:** a `time` element with `formatPublishedDate`, then `formatReadingTime` (`reader/format.ts:3-9`), separated by an `aria-hidden` middle dot (present in both subsets). Set in Jost at `--qm-small` in stone ink.

**Plate** (cover, room and hang):

- **DOM order:** picture box, section label (left out on section pages), title, dek, meta line. The cover keeps today's order of title, picture, dek (2.2).
- **One link:** the title link is the plate's only link to the story, and its `::after` covers the plate. The section label link sits above it (`position: relative; z-index: 1`). Today the cover has an image link with an `aria-label` and `tabIndex={-1}` plus a "Read the story" link (`quiet-monograph/home.tsx:31-45`), and section cards put the image and title inside one link (`quiet-monograph/section.tsx:32-37`).
- **Title:** `h2` or `h3` by context, in Cormorant 400, balanced.
- **Hover and keyboard focus within:** the title underlines and the shadow deepens from `--qm-print` to `--qm-print-hover`.
- **Lists:** lists of plates and rows are `ul` elements with `role="list"`. Today's styles remove list styles (`quiet-monograph/styles.ts:9`), which drops list semantics in Safari.

**Monogram bay** (new): used for a story without an image when it shares a row in the hang (768px and up). It is a square with a 1px sand keyline and the title's first letter or digit centred in it, in Cormorant 400 at `--qm-monogram` and stone, marked `aria-hidden="true"`. It replaces today's text-only card treatment (`quiet-monograph/styles.ts:103-104`).

**Checklist row** (new; generalizes today's "More stories" rows: `quiet-monograph/styles.ts:46-49`):

- **768px and up:** two columns, 9rem and the rest. The first holds the section label, or the date on section pages, where the section is fixed. The second holds the `h3` title at `--qm-card` and the meta line. A 1px sand rule runs above each row.
- **Below 768px:** label, title and meta line, stacked.

**Byline and end matter:** the byline is in Jost at `--qm-small` and stone ink, with author names in ink and a 1px underline, because they are links inside a sentence. Topics form a wrapping, centred row of links, each 44px high.

**Editorial blocks.** `ArticleBody` stays the only body renderer (`reader-directions/README.md:39-43`). Quiet Monograph styles its markup (`reader/components/article-body.tsx:57-175`) for every `ArticleBlock` kind (`reader/views.ts:107-153`). Bare line numbers below refer to `quiet-monograph/styles.ts`.

- **`paragraph`:** Jost 400 at `--qm-body`, 1.8 leading, 1.75rem apart (61-62). No drop cap.
- **`heading` 2–6:** Cormorant. `h2` is 400 at `--qm-heading`, `h3` is 400 at `--qm-card`, and `h4`–`h6` are 500 at `--qm-dek`, with 3rem above and 1.25rem below (63-66). No change.
- **`quote`:** a 1px stone rule at the left and a 1.5rem indent (78-79). No change.
- **`pull-quote`:** centred between sand hairlines (81-82), now in Cormorant italic at `--qm-heading`. The attribution uses the label style.
- **`bulleted-list` and `numbered-list`:** discs and the five numbering types (69-77). Markers are stone ink (new).
- **`checklist`:** neither family's subset has the ☐ and ☑ glyphs (`aria-hidden`: `reader/components/article-body.tsx:115`), so a system font draws them today. Make the glyph transparent and draw a 0.85em square with a 1px ink border in its place; a done item adds a tick drawn with two borders on the box's `::after`. The visually hidden "Done:" or "Not done:" (`reader/components/article-body.tsx:116`) stays the state for assistive technology.
- **`image`:** a 42rem plate, whole and at most 85svh high (`object-fit: contain`), with its caption as a wall label (section 6). No shadow, as today.
- **`gallery`:** `grid` and `diptych` are two-up in square bays, pictures on the bottom edge, captions aligned below; `carousel` is stacked one per row. Every layout is one per row below 768px (83-85, 114). No scrolling carousel.
- **`callout`:** a 1px sand box (90-91), with the label (`strong`) in the label style. `tip` looks the same; `warning` is a 2px ink box. Variants differ by line weight and by the label's word, not by colour.
- **`code`:** the system monospace, with no web font (94), wrapped (95), between sand hairlines. No change.
- **`divider`:** a centred 4rem stone rule (96). No change.
- **`embed`:** a link card, never an iframe; the renderer emits a link (`reader/components/article-body.tsx:153-163`). It has the 1px sand box (90), the title link in Cormorant at `--qm-card` with an underline, the fallback as a caption, and a 44px target (93).
- **`editorial`** (`fact-box`, `key-points`, `methodology`, `related-stories`): a visible label repeats the section's `aria-label` (`reader/components/article-body.tsx:15-20,166-170`). It is drawn as generated content with an empty alternative, `content: attr(aria-label) / ''`, so it is not announced twice. `fact-box` and `related-stories` use the 1px sand box, `key-points` sits between hairlines, and `methodology` is set at `--qm-copy` in stone ink.
- **Inline marks** (`reader/views.ts:86-92`): `strong` is Jost 500 (67); `em` uses the genuine italic; `code` is monospace at 0.85em (94); links have a 1px underline (68); `u` has a dotted stone underline so it does not read as a link; `s` is struck through.

## 8. Motion and interaction

- **What moves:** only the plate shadow, over 200ms with ease-out, on hover or keyboard focus within a plate, in the light theme. There are no transforms, parallax, fades, sticky elements or smooth scrolling. The menu opens without animation, because it is a native `details` element.
- **Reduced motion:** today's guard stays (`quiet-monograph/styles.ts:116-118`) and removes the shadow transition. The Theme popup's fade and scale belong to the shared component (`packages/web/src/components/theme-menu.tsx:64`).
- **Focus:** a 2px solid ink outline at a 5px offset, as today (`quiet-monograph/styles.ts:12`), extended from `a` and `summary` to `button`, so it replaces the Theme trigger's own ring. Forced colours use `Highlight` (119-121). On a plate the ring surrounds the title link, not the whole plate.
- **Skip link:** hidden until focused (17-18). Its target, `main`, takes focus (`quiet-monograph/shell.tsx:67`).
- **Targets:** standalone links and buttons are at least 44 by 44px, as today (for example `quiet-monograph/styles.ts:15,21,22,28,32,44,108`).
- **Print:** one column, without the masthead controls, navigation, footer navigation or Read next, and without shadows (extends `quiet-monograph/styles.ts:122-127`).

## 9. Accessibility

The target is WCAG 2.2 AA (`docs/product/nonfunctional-requirements.md:9-13`).

- **Headings:** one `h1` per page (`reader-directions/README.md:36-38`): the wordmark on home, the title on articles, the name on section, topic and author pages, and "Page not found" or "Something went wrong" on error pages. Under it:
  - **home:** the cover title `h2`, the hidden "Recent stories" `h2` with room `h3`s, and the "Earlier stories" `h2` with row `h3`s;
  - **section and topic:** plate `h2`s, then the "Earlier in…" `h2` with row `h3`s;
  - **article:** body headings from the story (levels 2–6: `packages/web/src/server/content/document.ts:173`), then the "Topics" and "Read next" `h2`s;
  - **author:** the latest story's `h2`, then the "More by…" `h2` with row `h3`s.
- **Landmarks:** `header`; `nav` "Sections" (one in the accessibility tree at a time); `main`; `article`; and `footer` with `nav` "Contents".
- **Lists:** story lists are `ul` elements with `role="list"`.
- **Order:** DOM, focus and visual order agree at every width. In the masthead the order is wordmark, Theme, Menu. On articles the plate comes before the header, as today; its only focusable content is a credit link.
- **Targets:** at least 44 by 44px for standalone controls, above the 24px minimum of success criterion 2.5.8. Links inside running text are exempt.
- **Link text:** titles; section, topic and author names; credit names; "Front page", "Back to top", "Skip to content" and "Try again". There is no "Read the story" link and no `aria-label` that differs from the visible title (today: `quiet-monograph/home.tsx:31-45`).
- **Images:** alt text is required content (`packages/web/src/server/content/document.ts:131-139`). Monograms and checklist boxes are decorative.
- **Colour:** never the only cue (section 5).
- **Reflow and zoom:** no horizontal scrolling at 320px or at 200% zoom; section names fit at 320px (section 3).
- **Text spacing:** text containers have no fixed heights, so text-spacing overrides fit.
- **Themes:** light, dark, forced colours and print.

How it is checked:

- **Unit** (`quiet-monograph/views.test.tsx`, extended):
  - one `h1` on each page type;
  - no invented authors, bios, descriptions or images (today's pattern: 74-89);
  - `role="list"` on story lists;
  - the preload rules, with the preload's `sizes` equal to the picture's;
  - fit values and `sizes` strings for 3:2, 16:9, 1:1 and 4:5 images and for missing dimensions;
  - DOM order;
  - text pairs in both themes (extends 43-53).
- **Browser** (`quiet-monograph/quiet-monograph.e2e.ts`, extended):
  - axe with today's tags (146) on home, article, section, author and topic pages, at 390 and 1440px, in light and dark;
  - no overflow from 320 to 1440px;
  - 44px targets in the masthead, menu, Theme control, labels, topics, footer and credit links;
  - the keyboard path from the skip link through the menu and an article to the footer;
  - dark mode paints `#2E2B27` (replaces 129-132).
- **Shared:** `tests/e2e/reader-lab.spec.ts` keeps checking every direction with axe at 390 and 1440px (18-21, 193).
- **Manual,** recorded in the b3 worklog with versions:
  - VoiceOver with Safari (iOS and macOS) and NVDA with Firefox, on home and the long-table article;
  - 200% zoom;
  - a text-spacing override;
  - Windows forced colours;
  - print preview.

  Automated checks alone do not establish conformance (`docs/product/nonfunctional-requirements.md:13`).

## 10. Performance

The requirement is field LCP at most 2.5s, INP at most 200ms and CLS at most 0.1, at the 75th percentile (`docs/product/nonfunctional-requirements.md:17-21`). What is enforced today, for visitors: no editor code on reader routes, and story HTML under 150,000 bytes (`tests/e2e/homepage.spec.ts:219,223-236`). The Lighthouse harness measures home, the long-table article and the Interiors section for the signed-in owner, in a chosen direction, on simulated mobile. Its scores are measurements, not gates (`scripts/lab-lighthouse.md:3-5,76-79`). No Quiet Monograph result is checked in at `094024a`.

Budgets, proposed here. b3 records the first measurements and turns the deterministic ones into tests.

| Budget                                     | Home       | Article         | Evidence                                                                                                            |
| ------------------------------------------ | ---------- | --------------- | ------------------------------------------------------------------------------------------------------------------- |
| LCP, lab                                   | ≤ 2.5 s    | ≤ 2.5 s         | `scripts/lab-lighthouse.mjs` on a production build, median of three runs                                            |
| CLS, cold and warm loads                   | under 0.01 | under 0.01      | the layout-shift observer of `reader-directions/cinematic-feature/cinematic-feature.e2e.ts:279-325`, and Lighthouse |
| Shift of the wordmark, cover title or `h1` | 0          | 0               | the same observer, by element                                                                                       |
| INP                                        | ≤ 200 ms   | ≤ 200 ms        | DevTools trace at 4x CPU slowdown (open Menu, open Theme, follow a link); TBT ≤ 200 ms as a lab proxy               |
| Font bytes                                 | ≤ 95,000   | ≤ 105,000       | five faces on home and six on an article with italics; today's five files total 75,944 (`fonts/README.md:14`)       |
| Lead image                                 | ≤ 150 kB   | ≤ 150 kB        | transfer size of the chosen candidate                                                                               |
| Images loaded in the first view            | ≤ 200 kB   | ≤ 250 kB        | at 390 by 844px and 1440 by 900px, at device pixel ratios 1 and 2                                                   |
| Story HTML                                 | none       | under 150,000 B | the existing check, repeated with the direction cookie                                                              |
| Direction CSS                              | ≤ 20,000 B | ≤ 20,000 B      | the `styles` and `tokens` strings, uncompressed                                                                     |

- **Lead element:** on home, the cover picture (or the cover title for a text-only lead); on articles, the hero (or the `h1` without one); on section and topic pages, the `h1` or the first plate's picture; on author pages, the `h1` or the latest story's picture. The preload follows section 6.
- **Fonts, cold:** faces use `font-display: optional` without preloads (`reader-directions/contract.ts:451`, `reader-directions/README.md:85-88`). A face that is not ready within the short block period is skipped for that page view: the metric-adjusted fallback stays and nothing swaps. A first cold view often shows Times New Roman and Arial; that is accepted.
- **Fonts, warm:** a cached face renders at once, but public files are served with `max-age=0` today, so each view first revalidates every face (`reader-directions/capture-fonts.ts:9-10`). On a slow connection that round trip can outlast the block period and keep the fallback again. Font files change name when their bytes change (`fonts/README.md:17`), so a long `immutable` cache for `/reader-directions/*/fonts/*` would be safe. That is a shared header change (`packages/web/next.config.ts`), recommended to the kit, not made in this direction. Italic files download only on pages that use italics.
- **Screenshots** for review use the screenshot-only font gate (`reader-directions/capture-fonts.ts:3`). They are never performance evidence.
- **INP:** the direction adds no event handlers. Its only client component is the shared Theme menu, new on Quiet Monograph pages; baseline already renders it (`reader/components/site-header.tsx:29`). The menu is a native `details` element.
- **Images:** budgets apply to the candidate the browser picks. If the sample exceeds a budget, fix `sizes` or the candidate choice first. Never raise a budget without a recorded reason.

## 11. Delta from today and build batches

**Keep:**

- **Identity:** the id, name and thesis (`quiet-monograph/index.ts:13-18`); the light paper palette apart from stone ink (`quiet-monograph/tokens.ts:6-10`); Cormorant 400 and 500 and Jost 400 and 500, with their fallbacks (`quiet-monograph/fonts.ts`); centred compositions; the article that opens with its plate (`quiet-monograph/article.tsx:17-34`); hairline rules; the 42rem figure step-out (`quiet-monograph/styles.ts:80`); and body size and leading (`quiet-monograph/tokens.ts:15,21`).
- **Mechanics:** `MonographImagePreload` and the one-lead-image rule (`quiet-monograph/image-preload.tsx`, `quiet-monograph/views.test.tsx:91-169`); the skip link and focusable `main`; the native `details` menu below 1024px; 44px targets; the reduced-motion, forced-colour and print rules (`quiet-monograph/styles.ts:116-127`); and the lane's Playwright config and capture script (`quiet-monograph/playwright.config.ts`, `quiet-monograph/capture.mjs`).

**Change:**

- **Masthead and footer:** the Theme control, the navigation row from 1024px, "Front page", "Skip to content" and the "Contents" footer (2.1).
- **Home:** a cover without the extra links, the rooms, and the earlier list (2.2).
- **Section:** the hang with bays and monograms, the earlier list from story 7, and the count (2.3).
- **Article:** the hero box; a header with the long-title size and the Cormorant italic dek; byline links; end matter; Read next (2.4).
- **Plates:** fit-scaled boxes and `sizes`, one link per plate, and `role="list"` (sections 6 and 7).
- **Tokens:** the dark set; stone ink `#6B665E`; new values for `--qm-dek`, `--qm-section-title` and `--qm-measure` (30em); and the new `--qm-title-long`, `--qm-wordmark`, `--qm-monogram`, `--qm-copy`, `--qm-print`, `--qm-print-hover` and `--qm-scheme` (sections 3 and 5).
- **Fonts:** add Cormorant 400 italic and Jost 400 italic, remove Jost 300, and set `font-synthesis: none` (section 3). Update `quiet-monograph/fonts.test.ts` (weights and styles: 23, 26; total: 79), `fonts/README.md` and `fonts/sources.json`.
- **Blocks:** the italic pull quote, list markers, checklist boxes, callout variants, editorial labels and `u` (section 7).
- **Tests:** the dark-mode assertion (`quiet-monograph/quiet-monograph.e2e.ts:129-132`) now expects graphite. The capture test saves to `docs/worklog/blog-0044.3` (`quiet-monograph/quiet-monograph.e2e.ts:185`); each build bead points it at its own worklog and adds dark captures.

**Remove:**

- The cover's image link and "Read the story" (`quiet-monograph/home.tsx:31-40,42-45`).
- The "↗" arrows (`quiet-monograph/home.tsx:43`, `quiet-monograph/shell.tsx:73`).
- Capitals in cover titles (`quiet-monograph/styles.ts:34`).
- Jost 300 (`quiet-monograph/fonts.ts:32`; the file `fonts/jost-latin-300-normal.woff2` and its `sources.json` entry).
- The fixed `color-scheme: light` (`quiet-monograph/styles.ts:3`), replaced by `--qm-scheme`.
- The text-only row of three (`quiet-monograph/home.tsx:47-68`), replaced by the rooms.

**b1, home and section** (no dependency):

1. Tokens: the dark set, stone ink, the new tokens, and text pairs checked in both themes.
2. Fonts: the italics in, Jost 300 out; `sources.json`, the fonts README and `fonts.test.ts`.
3. Shell: the skip link; the masthead with the Theme control, navigation row and menu; the footer with "Contents" and "Back to top".
4. Plate, bay, monogram and checklist-row components, and the fit and `sizes` helper.
5. Home: cover, rooms and earlier list. Section: header, hang, earlier list and empty state.
6. Tests: unit tests for home and section (one `h1`, lists, preload and `sizes`, fit values, empty states); browser tests for overflow from 320 to 1440px, targets, axe in both themes at 390 and 1440px, the keyboard path, and the dark ground.
7. Evidence: test output; screenshots of home, Interiors and Craft at 390, 768 and 1440px in both themes; JavaScript transferred on home before and after the Theme control; font requests on home.

**b2, article, author, topic and Read next** (after blog-0044.22 merges):

1. Article: the hero box with fit-scaled `sizes`, the header with the long-title size, and byline links.
2. End matter (topics) and Read next.
3. The `Author` and `Topic` views, registered in `quiet-monograph/index.ts`.
4. Block treatments (section 7).
5. Tests: unit tests for the three page types (author links, topics, related stories, nulls left empty, one `h1`, DOM order); browser tests for the new routes; and today's long-title, image-free, short and long-read stories (`quiet-monograph/quiet-monograph.e2e.ts:78-105`) plus the two 4:5 heroes.
6. Evidence: screenshots of a landscape-hero article, a 4:5-hero article, an author page and a topic page at 390, 768 and 1440px in both themes.

**b3, media, accessibility and Core Web Vitals, with evidence:**

1. Lighthouse for home, article and section, median of three runs, with versions and server state (`scripts/lab-lighthouse.md:76-79`). Author and topic pages in Chrome DevTools, since the harness covers three routes.
2. A cold and warm layout-shift test for home and article (section 10).
3. An image audit: each plate's `currentSrc` against the candidate it needs at 390, 768 and 1440px, and bytes against the budgets.
4. A font audit: requests per page type, with italics only where they are used.
5. The manual accessibility pass (section 9), with fixes.
6. K4: the not-found and error views (2.7) and the body and gallery `sizes` values (section 6), if the hooks have landed. Otherwise the gaps are recorded.
7. The story HTML budget, repeated with the direction cookie.

**Dependencies and risks:**

- **blog-0044.22 (K1):** b2 waits for it, and its names may differ from this spec's. Its write set does not include `packages/web/next.config.ts`, whose Reader Lab private-header rule lists only `/`, `/stories/:slug` and `/sections/:slug` (94, 102-108). The author and topic routes need the same rule. That is a flag for the kit, not this direction's change to make.
- **blog-0044.29 (K3):** authors, topics and longer sections, to exercise rows, author and topic pages, and Read next.
- **blog-0044.34 (K4):** the not-found and error views and the `sizes` hook.
- **Theme control:** it brings the shared menu's client code to Quiet Monograph pages; b1 measures it. The registry test rejects only font and stylesheet imports (`reader-directions/registry.test.ts:88-114`).
- **Fonts:** the two italic files must be vendored with provenance. If they cannot be fetched, b1 stops and reports.
- **Font caching** (section 10) is a shared header change.
- **Lighthouse harness:** it covers home, article and section only.

## 12. Open questions for the client

1. **Dark version.** Today the catalogue stays on paper even when a reader's device is in dark mode. The developed version adds a warm graphite night version. Keep it, or stay on paper always?
2. **Masthead name.** The magazine's name is set in widely spaced capitals and wraps to two lines on phones. Is the final name short?
3. **Author bios.** Author pages show a short bio when there is one and work without it. Will authors have bios at launch?
