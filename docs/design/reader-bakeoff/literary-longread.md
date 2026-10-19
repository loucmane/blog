# Literary Long-read: developed magazine specification

Bead: `blog-0044.24`. Date: 2026-10-19. Baseline inspected: `094024ac5a99b63dd18c1669993abf3e69fb3134` (`origin/main` at lane creation). Status: build proposal for the five-direction client comparison; not a selection or publication decision.

Paths below are repository-relative. `LL/` means `packages/web/src/reader-directions/literary-longread/`; `reader/` means `packages/web/src/reader/`. Statements labelled **Today** describe that revision; other prescriptions describe the proposed build. This task changes documentation only.

## 1. Thesis and distinction

A literary magazine with the confidence of an illustrated cover and the intimacy of a well-set essay: a dark opening spread gives way to warm paper, expressive serif titles, and an uninterrupted reading column. Readers should feel invited to settle in, then find another writer or subject without losing the sense of a finished piece.

| Other direction at this revision                                                                                                                                  | Literary Long-read's distinguishing choice                                                                                               |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Quiet Monograph: gallery-catalogue thesis and a centered lead followed by a text trio (`packages/web/src/reader-directions/quiet-monograph/index.ts`, `home.tsx`) | A dark split cover and substantial secondary stories; a more bookish body with italic deks, an opening initial, and generous quotations. |
| Swiss Index: numbered lead grid and ruled further-reading index (`packages/web/src/reader-directions/swiss-index/index.ts`, `home.tsx`)                           | Serif reading rhythm and narrative hierarchy; dates support stories rather than numbering them.                                          |
| Cinematic Feature: expansive cover imagery and condensed titles (`packages/web/src/reader-directions/cinematic-feature/index.ts`, `home.tsx`)                     | Image and headline occupy separate surfaces; words retain priority and photography never becomes a text backdrop.                        |
| Expressive Colour: saturated story colours and soft serif letters (`packages/web/src/reader-directions/expressive-colour/index.ts`, `home.tsx`)                   | One restrained paper/ink/vermilion palette with gold confined to the cover.                                                              |

The owner comparison remains about reading comfort, pictures, phone use, and whether it feels like their magazine, as framed in `docs/reader-lab-owner-guide.md`. All directions use the same published content and supplied order.

## 2. Page inventory, data boundaries, and states

**Today:** `reader/views.ts` supplies Home, Section, Article, StoryCard, and ReaderImage. Home has one lead and ordered recent stories; section descriptions are nullable; article authors are strings with no links, and the current read model supplies an empty list (`reader/read-model.ts`). Author/Topic views, article topics, and related-story fields are absent from `reader/views.ts` and `packages/web/src/reader-directions/contract.ts`.

**Shared-kit dependency:** batch b2 consumes the optional Author/Topic contract and author links, topics, and related stories delivered by `blog-0044.22`. Verify its merged types and route integration before coding. The minimum presentation inputs are author name, optional author href and nullable biography; topic name, topic href and nullable description; ordered published StoryCards; and normal reader navigation. These are semantic requirements, not claims about future property names. Use supplied hrefs, never construct author/topic URLs from names. No direction fetches content, reads cookies, invents biographies, assigns relatedness, or supplies placeholder portraits. If the kit lacks an input, record the missing shared work; do not cast around it.

Mobile is below 768px, tablet 768–1023px, desktop 1024px and above. Exact grid rules are in section 4; image rules in section 6.

| Page                       | Desktop                                                                                                                                                                                           | Tablet                                                                                             | Mobile                                                                                                                          |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Home `/`                   | Masthead is the sole h1. Lead spread: equal dark text and image columns. Then `recent.slice(0, 4)` as a two-column, two-row “More stories” list; remaining stories in a dated “Latest” list.      | Same split cover with smaller panel padding; two secondary columns; Latest heading above its rows. | Cover copy first, image second; secondary stories and Latest in one column. No change in DOM order.                             |
| Section `/sections/[slug]` | Left-aligned section h1 and optional description above a ruled index. Each row is date, title/dek/reading time, thumbnail.                                                                        | Date above copy inside the text column; thumbnail to the right.                                    | Same two-column row with an 80px thumbnail; date above title, full title and dek wrap. Image-free rows use all available width. |
| Article `/stories/[slug]`  | Centered section label, h1, italic dek, linked byline, date/reading time; natural-ratio hero up to 960px; centered 672px body shell with prose capped at 65ch. End matter follows in normal flow. | Same sequence; header and hero use the available width; body retains its cap.                      | Same sequence; title and dek left aligned, metadata wraps; 18px body. No sticky controls or sidebars.                           |
| Author (kit route)         | Left-aligned “Author” label and name h1; biography, if present, at body measure. A “Stories by {name}” h2 precedes the section-style index.                                                       | Same single header and index arrangement, with tablet row dimensions.                              | Same; long names and biography wrap. Omit the biography block entirely when null.                                               |
| Topic (kit route)          | Left-aligned “Topic” label, topic h1, optional description; “Stories” h2 and section-style index.                                                                                                 | Same header and tablet index.                                                                      | Same header and mobile index; no invented description or topic illustration.                                                    |

**Home ordering:** use every supplied card once. Never duplicate the lead in secondary modules or reorder for images. With fewer than four recent stories, render only those supplied; omit empty module headings. The lead's section, title, dek, date, reading time, and “Read the story: {title}” link form one coherent introduction. A missing lead image produces a full-width text cover, with a 26ch title cap and no blank image frame. Do not add issue numbers, popularity labels, editor picks, categories, search, subscriptions, or “load more” without supporting data and behaviour.

**Article sequence:** section link → title → optional dek → “By” and individual author links in supplied order → publication date and reading time → optional hero/caption/credit → shared ArticleBody → short decorative closing rule → author end matter → topics → related stories → “All stories” link → footer. Skip absent pieces without empty labels. Unlinked author names remain text; zero authors removes “By”. Author end matter repeats names as links and includes biographies only if the shared view actually supplies them; otherwise the author page carries the biography. Do not fabricate article-wide credits: image credits stay with their figures.

Topics are an accessible list of underlined links under an h2, wrapping naturally. Related stories use at most the first three cards supplied by the shared kit, preserving its order; three columns on desktop, one column on tablet/mobile, h2 module heading and h3 story titles. The kit must exclude unpublished, duplicate, and current stories. Hide the entire module for an empty list. An authored `editorialBlock` with kind `related-stories` remains part of the body; do not delete or reinterpret it as algorithmic recommendations.

| State                                                                         | Behaviour at all widths                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No published home stories                                                     | Keep masthead h1 and navigation; h2 “No stories yet” with the existing explanatory sentence. No cover or image preload.                                                                                                                                                                                                    |
| Empty section / author / topic                                                | Keep the entity h1 and any supplied description. Plain paragraph: “No stories have been published in this section yet”, “No published stories by this author yet”, or “No published stories on this topic yet”; link to All stories.                                                                                       |
| Missing image, dek, biography, description, authors, topics, or related items | Omit only the absent content and its spacing. Preserve the story and navigation. No generated photograph, initials avatar, empty pills, or inferred copy.                                                                                                                                                                  |
| Not found                                                                     | One h1 “Page not found”, “This page is not available”, and “Return to all stories”. Center a maximum 40rem panel on desktop/tablet, left align within mobile gutters; no preload or recommendations.                                                                                                                       |
| Content unavailable / unexpected error                                        | One main region; clear “Stories are unavailable” or “Something went wrong” heading, brief recovery text, All stories link, and a real retry button only where a reset handler exists. Use a 40rem panel on desktop/tablet, full available width on mobile. Preserve focus when retry fails; announce the new failure once. |

**Failure-shell boundary:** today `packages/web/src/app/not-found.tsx` and `error.tsx` are generic h2-based screens, and `reader/components/reader-unavailable.tsx` deliberately uses the common SiteHeader without a direction view. LL cannot restyle these through scoped CSS. The target failure layouts require a shared route/shell integration in b3, separately scoped before implementation; retain the honest generic fallback until that exists. Do not claim LL failure-state completion from an ordinary empty-page screenshot.

## 3. Typography

Keep Newsreader for titles/body and Libre Franklin for navigation/metadata. **Today:** `LL/fonts.ts` and `packages/web/public/reader-directions/literary-longread/fonts/README.md` declare seven local Fontsource 5.3.0 Latin WOFF2 faces under SIL OFL 1.1: Newsreader 400/500/600 normal and 400/600 italic; Libre Franklin 400/600 normal. Newsreader is a static 16pt optical instance, not a variable font. Total WOFF2 bytes: 151,996; provenance and full licences accompany the assets in that directory. No new family, weight, subset, or licence is required by this proposal.

Declare faces only as direction data; keep the existing metric-adjusted Times New Roman and Arial fallbacks and the existing offline `LL/font-metrics.mjs` reproduction. All sizes below are rem equivalents of the listed CSS pixels at a 16px root; never fix the user's root size. Do not request unsupplied 700 weights or synthesize italic navigation. Strong text uses 600; strong italic uses the supplied 600 italic.

| Role                          | Mobile / tablet / desktop size | Weight; leading; measure                                 |
| ----------------------------- | ------------------------------ | -------------------------------------------------------- |
| Wordmark                      | 28 / 36 / 44px                 | Newsreader 500; 1.2; natural width, wraps                |
| Article and entity h1         | 42 / 56 / 72px                 | Newsreader 500; 1.08; at most 22ch, header at most 928px |
| Cover title                   | 38 / 40 / 56px                 | Newsreader 400; 1.1; at most 20ch                        |
| Dek                           | 22 / 26 / 28px                 | Newsreader 400 italic; 1.45; at most 48ch                |
| Body                          | 18 / 20 / 20px                 | Newsreader 400; 1.65; width `min(100%, 65ch, 42rem)`     |
| Body h2 / h3                  | 30/26, 36/30, 40/32px          | Newsreader 600; 1.2; body width                          |
| Body h4 / h5 / h6             | 24 / 22 / 20px at every width  | Newsreader 600; 1.3; maintain semantic level             |
| Card titles                   | 28 / 30 / 34px                 | Newsreader 500; 1.2; at most 32ch                        |
| Index titles                  | 28 / 30 / 36px                 | Newsreader 500; 1.2; at most 36ch                        |
| Card/index dek                | 18 / 18 / 20px                 | Newsreader 400; 1.5; at most 52ch                        |
| Pull quote                    | 28 / 32 / 40px                 | Newsreader 400 italic; 1.3; at most 34ch                 |
| Metadata, caption, navigation | 14 / 14 / 14px                 | Libre Franklin 400; 1.65; caption at most 65ch           |
| Labels                        | 13 / 13 / 13px                 | Libre Franklin 600; 1.5; uppercase with 0.08em spacing   |
| Code                          | 15 / 16 / 16px                 | System monospace; 1.6; no font asset                     |

**Delta:** today's 20px/33px body, 65ch measure, 12px labels, 13px metadata, uppercase cover title, four-column desktop cards, and two-line card-dek clipping are in `LL/tokens.ts` and `LL/styles.ts`. Retain the desktop reading rhythm; reduce body size only on mobile, enlarge small metadata, use sentence case for the cover, and remove dek clipping. Titles may balance; body text is left aligned, never justified or line-clamped. Let long words wrap without shrinking text. Keep the opening initial only on a direct first-child paragraph, so a heading/quote/list opener does not trigger a later drop cap; disable it below 768px. This tightens today's `p:first-of-type` rule (`LL/styles.ts`).

## 4. Grid, spacing, and breakpoints

Use only the 768px and 1024px layout transitions; 1344px is the point where the desktop page cap is reached, not another layout mode. At default root size, outer gutters are 20px mobile, 24px tablet, and 48px desktop; page content width is `C = min(viewport − 2 × gutter, 1248px)`. Express caps/gutters in rem in CSS and test text zoom. Root and page both paint paper.

| Element                    | Rule                                                                                                                                                                                                 |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Masthead / main / footer   | Same centered C; masthead top padding 24/32/48px; no fixed height.                                                                                                                                   |
| Cover                      | Margin-top 32px; two equal columns without gap at ≥768px; one column below. Panel padding 24px mobile/tablet, 48px desktop; no fixed content height.                                                 |
| Secondary cards            | Two columns at ≥768px, gap 24px; one column below, gap 40px. Images occupy the full card width.                                                                                                      |
| Latest                     | Desktop heading rail 192px + 32px gap + list; tablet/mobile heading above. Rows use 96px date + 24px gap + title at ≥768px; stack below.                                                             |
| Section/author/topic index | Desktop: 128px date + flexible copy + 160px image, with two 24px gaps. Tablet: flexible text + 96px image, 24px gap. Mobile: flexible text + 80px image, 16px gap. Missing image removes its column. |
| Article                    | Header ≤928px; hero ≤960px; body shell ≤672px, prose ≤65ch. No media breakout from the shell. Related module uses C.                                                                                 |
| Vertical rhythm            | Base steps 4, 8, 12, 16, 24, 32, 48, 64, 96px. Major modules separated by 48/64/96px; body paragraphs by 24px; body heading top/bottom 44/16px; figures by 48px.                                     |
| End matter                 | 48px after body; 32px between present author/topic/related modules. Related grid gap 24px. Footer margin-top 48/64/96px; padding-block 32/48px.                                                      |

For precise media slots, implement `.ll-body` as a centered `min(100%, 42rem)` shell. Its direct prose blocks (paragraphs, headings, lists, ordinary quotations, code and inset boxes) additionally cap at 65ch and center within it. Direct image figures and galleries use the full shell width; pull quotes retain their 34ch text cap. This preserves the reading measure while giving image `sizes` a stable width, without breakout transforms. Nested media remain within their containing block.

Keep source order identical across widths. Use `minmax(0, 1fr)`, wrapping metadata, and natural heights. Test 320, 390, 768, 1024, 1280, 1440px, plus 767/768 and 1023/1024 boundaries. No blank slots when content is short; no viewport-height cover that pushes a short piece below the fold.

## 5. Colour and complete pairing rules

**Today:** `LL/tokens.ts` uses white paper, near-black ink/panel, vermilion accent, cover gold, and a warm dark theme. Keep that identity; change light paper to warm ivory and add a quiet inset surface and a functional border token. No photographic text overlays, opacity-based secondary text, gradients, or story-specific palettes.

| Token            | Light     | Dark      | Use                                             |
| ---------------- | --------- | --------- | ----------------------------------------------- |
| `--ll-paper`     | `#FBF8F2` | `#1B1917` | Page/root; normal text background               |
| `--ll-surface`   | `#F2ECE2` | `#25211D` | Callouts, editorial boxes, code                 |
| `--ll-ink`       | `#141414` | `#F5F0E9` | Body, titles, ordinary links                    |
| `--ll-secondary` | `#4A4A4A` | `#C7BEB4` | Dates, captions, secondary copy                 |
| `--ll-accent`    | `#9B2C2C` | `#E59A91` | Labels, text-link hover, focus, opening initial |
| `--ll-rule`      | `#E2E0DC` | `#4B4540` | Decorative separators only                      |
| `--ll-border`    | `#8B7F72` | `#9A8B7C` | Required control boundaries/checklist outlines  |
| `--ll-panel`     | `#141414` | `#141414` | Cover text panel                                |
| `--ll-panel-ink` | `#FFFFFF` | `#FFFFFF` | Cover title/dek/meta/CTA                        |
| `--ll-gold`      | `#C9A86A` | `#C9A86A` | Cover label, hover and focus only               |

Ratios below were computed with the repository's `packages/web/src/reader-directions/contrast.ts` for these opaque values; values are rounded to two decimals. Register all eight text-pair rows in `textPairs`; the contract requires ≥4.5:1 even for display text (`packages/web/src/reader-directions/contract.ts`). The 3:1 UI floor does not weaken that contract.

| Foreground / background | Light | Dark  | Target and coverage                            |
| ----------------------- | ----- | ----- | ---------------------------------------------- |
| ink / paper             | 17.38 | 15.46 | ≥4.5:1; body, headings, ordinary links/buttons |
| secondary / paper       | 8.36  | 9.56  | ≥4.5:1; metadata, captions, biography          |
| accent / paper          | 7.10  | 7.81  | ≥4.5:1; labels, hover, focus                   |
| ink / surface           | 15.68 | 14.10 | ≥4.5:1; inset body, code, labels               |
| secondary / surface     | 7.54  | 8.72  | ≥4.5:1; inset captions/metadata                |
| accent / surface        | 6.40  | 7.13  | ≥4.5:1; inset links/hover/focus                |
| panel-ink / panel       | 18.42 | 18.42 | ≥4.5:1; all cover copy and CTA                 |
| gold / panel            | 8.15  | 8.15  | ≥4.5:1; cover labels, hover/focus              |
| border / paper          | 3.69  | 5.31  | ≥3:1; functional boundaries, not text          |
| border / surface        | 3.32  | 4.84  | ≥3:1; inset functional boundaries, not text    |

This is the allowed pairing inventory, including nested blocks and interactive states. Buttons retain their paper/surface background and ink text; hover changes text to accent and adds underline. Cover controls stay on panel and use gold for hover/focus. Visited links keep the ordinary link colour and underline. Selection uses paper text on accent, or panel text on gold inside the cover (the reciprocal pair has the same ratio). Do not apply gold on paper or global accent hover to panel text. Decorative rules never communicate a required state alone. Forced-colours mode uses system text/background and Highlight focus; review the browser result separately.

## 6. Imagery and responsive sources

Use the supplied images as editorial material: a composed photograph, drawing, or artwork can open the cover; avoid filters and decorative image substitutions. This is a curation preference, not a new content field. Article media show their full composition. Author and topic headers are typographic because portraits and topic art are not supplied at the baseline (`reader/views.ts`).

| Placement                      | Frame and art direction                                                                                                                                                                                                 | Lead/preload                                                                            |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Home cover                     | Desktop/tablet image pane at least 4:5, expands vertically if the adjacent copy needs more room; mobile 4:3. Crop around stored focal point. Caption/credit sit below the image, on paper, outside the dark copy panel. | Only `view.lead.image`, if present.                                                     |
| Home secondary / related card  | Reserved 4:3 crop, full card width; no text overlay. Show supplied credit below; show caption when supplied.                                                                                                            | Never.                                                                                  |
| Section/author/topic row       | Reserved 4:3 thumbnail; factual crop. Caption/credit wrap below the thumbnail without clipping or tiny type.                                                                                                            | Only the first story's image; if that story is text-only, do not promote a later image. |
| Article hero                   | Intrinsic ratio at ≤960px; unknown dimensions retain shared 3:2 fallback. Caption/credit below at body measure.                                                                                                         | Only `view.hero`; no hero means no preload.                                             |
| Article single image / gallery | Intrinsic ratio, ≤body width. Diptych/grid: two equal columns at ≥768px, one below; carousel projects as a vertical sequence, with no slider. Unknown dimensions use shared 3:2.                                        | Never; remain lazy.                                                                     |

Exact `sizes` strings for the section 4 geometry (caps in rem):

| Image                          | `sizes`                                                                                                                                 |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| Home cover                     | `(min-width: 1344px) 39rem, (min-width: 1024px) calc(50vw - 3rem), (min-width: 768px) calc(50vw - 1.5rem), calc(100vw - 2.5rem)`        |
| Home secondary                 | `(min-width: 1344px) 38.25rem, (min-width: 1024px) calc(50vw - 3.75rem), (min-width: 768px) calc(50vw - 2.25rem), calc(100vw - 2.5rem)` |
| Related card                   | `(min-width: 1344px) 25rem, (min-width: 1024px) calc(33.3333vw - 3rem), (min-width: 768px) calc(100vw - 3rem), calc(100vw - 2.5rem)`    |
| Index thumbnail                | `(min-width: 1024px) 10rem, (min-width: 768px) 6rem, 5rem`                                                                              |
| Article hero                   | `(min-width: 1056px) 60rem, (min-width: 1024px) calc(100vw - 6rem), (min-width: 768px) calc(100vw - 3rem), calc(100vw - 2.5rem)`        |
| Body single / vertical gallery | `(min-width: 768px) 42rem, (min-width: 712px) 42rem, calc(100vw - 2.5rem)`                                                              |
| Body diptych/grid item         | `(min-width: 768px) 20.25rem, (min-width: 712px) 42rem, calc(100vw - 2.5rem)`                                                           |

The body media strings describe direct image/gallery children in the 42rem shell from section 4. Verify decoded selection against measured slots at DPR 1 and 2. Nested media stay inside their list/quote/editorial container, never break out. Shared sizing support must account for those narrower slots and insets, or record remaining overfetch as an explicit b3 gap.

**Required shared sizing handoff:** today ArticleBody hardcodes `(min-width: 768px) 42rem, 100vw` for both singles and every gallery item and accepts only `blocks` (`reader/components/article-body.tsx`). A direction cannot fix HTML `sizes` with CSS. Before b3 completion, arrange a scoped shared-renderer change with optional sizing inputs for single images and each gallery layout, retaining defaults for other directions and propagating context through nested blocks. Do not fork ArticleBody or modify every direction incidentally.

Use `ReaderImageView`/`ReaderFigure` and descendant selectors (`figure img`, never `figure > img`) per `packages/web/src/reader-directions/README.md`. **Today:** the shared image component applies focal points to unknown-dimension fallback frames, but not to dimensioned images; LL's cropped home/section images have no additional focal-position styles (`reader/components/reader-image.tsx`, `LL/home.tsx`, `LL/section.tsx`, `LL/styles.ts`). Set a direction wrapper custom property from `ReaderImage.focalPoint`, and use it for the descendant cropped img's `object-position`; preserve the shared fallback's inline position. Test off-centre subjects in dimensioned and unknown-size fixtures.

Keep `LL/image-preload.tsx`: emit one real responsive link for the preferred format, with exactly the same `sizes` and source candidates as the lead picture; use original fallback for unsupported variants. The shared component's `preload` flag alone sets eager/high priority but does not emit that link (`reader/components/reader-image.tsx`). Keep all later images lazy. Preserve media revalidation and visibility checks; do not substitute the Next image optimizer. Credits are links only when a supplied URL exists; captions never replace alt text.

## 7. Components and every editorial block

Keep `LiteraryShell` responsible for the header, one main with a focusable skip target, and footer. **Today** it renders these from supplied navigation and `siteName` (`LL/shell.tsx`, `reader/components/site-header.tsx`). Keep “All stories” and available section links as a wrapping row, with the active section underlined and `aria-current` only for the actual page. On articles use “Skip to article”; on index pages “Skip to stories”. No hamburger, sticky masthead, floating reading progress, or added client-side controls. Footer: site name and All stories; add no fictitious social, legal, or newsletter destinations.

Use one local card presentation for secondary and related lists, with a heading level appropriate to the containing module. Title is the primary story link; section and credit links remain separate siblings. Do not stretch a link over other links. Cover CTA includes the story title in its accessible name; thumbnail images are not additional keyboard stops. Cards show full title, supplied dek, publication date and reading time; no invented card author data. Use existing formatters in `reader/format.ts`.

The table covers all node names in `packages/web/src/server/content/document.ts`. Render through `reader/components/article-body.tsx`, which receives the projection in `reader/views.ts`; style its semantic elements and data attributes. It is not permission to change stored schema or renderer semantics.

| Document node                           | Reader presentation and spacing                                                                                                                                                                                                                                                                    |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `doc`                                   | Shared body container at the reading measure; not an extra landmark or heading.                                                                                                                                                                                                                    |
| `paragraph`                             | Body size/leading, 24px between top-level blocks; optional initial only as specified in section 3.                                                                                                                                                                                                 |
| `text`, `hardBreak`                     | Preserve text and explicit breaks; no automatic content transformations.                                                                                                                                                                                                                           |
| `heading`                               | Preserve h2–h6; scale from section 3, 44px above/16px below; wrap long headings.                                                                                                                                                                                                                   |
| `blockquote`                            | Ordinary body size, 2px accent start rule, 24px inset; retain quoted structure without invented attribution.                                                                                                                                                                                       |
| `pullQuote`                             | Centered italic quotation, 32px block padding, decorative rules above/below, 44px margins; supplied attribution in secondary 14px sans. Mobile remains within body width.                                                                                                                          |
| `bulletList`, `orderedList`, `listItem` | Visible markers, 24px start indent, 8px item gaps, 12px between blocks inside an item. Preserve `start` and `1/a/A/i/I` numbering; nest with another 24px inset.                                                                                                                                   |
| `taskList`, `taskItem`                  | Static checklist, 28px marker column, 8px item gaps; preserve the renderer's “Done”/“Not done” screen-reader text. No interactive checkbox illusion; marker contrast ≥3:1.                                                                                                                         |
| `mediaImage`                            | Shared figure; full composition, responsive sources, caption and credit from section 6; 48px block margins.                                                                                                                                                                                        |
| `gallery`                               | Semantic list; 24px row/column gap. Grid/diptych two columns on tablet/desktop, one mobile; carousel vertical at all widths. Preserve order and individual captions/credits.                                                                                                                       |
| `callout`                               | Surface background, functional border, 24px padding (16px mobile), supplied bold label then text with 16px gap. Note/tip/warning keep their supplied labels; colour is not the distinction.                                                                                                        |
| `codeBlock`                             | System monospace, surface background, 24/16px padding; preserve whitespace with wrapping of long lines (`pre-wrap`, `overflow-wrap:anywhere`). No syntax-highlighter bundle.                                                                                                                       |
| `horizontalRule`                        | Centered 64px-wide accent rule with 48px block margins; no ornament announced as text.                                                                                                                                                                                                             |
| `embed`                                 | Shared linked title/fallback figure, surface background, 24/16px padding and border. No iframe, autoplay, remote poster, or new provider loading.                                                                                                                                                  |
| `editorialBlock`                        | Keep labelled section and nested blocks. `fact-box`: surface + border; `key-points`: paper + accent start rule; `methodology`: surface + decorative top/bottom rules; `related-stories`: paper + decorative top rule. Each has 24/16px padding; retain nested heading levels and authored content. |

All six inline marks retain their shared semantics: bold → 600 strong; italic → real italic; code → system monospace with surface background and inherited line height; link → underlined ink, accent hover/focus; strike → visible line-through; underline → underline without pretending it is clickable. Bold italic uses the real 600 italic face. Nested text/links use the surface pairs where applicable. No drop caps inside quotations, lists, boxes, captions, or code. Do not suppress unknown data to make a layout work; validation/quarantine remains outside the direction.

## 8. Motion and interaction

No entrance animation, parallax, card scaling, auto-advance, or smooth scrolling. Links respond immediately through underline/colour; native navigation remains the primary interaction. Reduced-motion mode disables any inherited transition/animation/scroll effect inside LL, retaining today's defensive rule (`LL/styles.ts`). Gallery layouts are static.

Keyboard focus uses a 2px solid accent outline with 4px offset on paper/surface, gold on the cover. Keep the outline outside clipping frames and never rely on colour alone. In forced-colours mode use Highlight. The skip link appears on focus, precedes navigation, and focuses main on activation. Reserve the Reader Lab bar's existing space; verify focused footer/related links remain visible above it. The bar and Theme controls belong to shared UI, not a new LL widget.

## 9. Accessibility acceptance

Target WCAG 2.2 AA using the repository quality contract (`docs/product/nonfunctional-requirements.md`). Automated results establish only their tested assertions, not complete conformance.

- Exactly one h1 per route: site name on home, entity/story name elsewhere, meaningful failure title where the shared failure shell exists. One main, header/banner, labelled navigation, footer/contentinfo; module headings follow their hierarchy. Preserve authored h2–h6 semantics and flag authored hierarchy problems rather than renumbering content in CSS.
- Focus order follows DOM reading order: skip, masthead/navigation, story content, authors/topics/related, footer, shared lab controls. Test Tab/Shift+Tab/Enter, skip landing, visible and unobscured focus, and a failed retry. No click-only cards or hidden offscreen controls.
- Navigation, CTA, standalone author/topic links and buttons have at least 44×44px targets. Inline prose/caption links retain natural inline layout and underlines; check the WCAG inline exception and spacing rather than stretching every word into a button. Other targets meet at least the 24px AA floor or its spacing exception.
- Text contrast ≥4.5:1 for every declared pairing, including large headings; functional borders/focus ≥3:1 against adjacent surfaces. Check computed hover/focus/visited/selection and nested-box colours, not only token tests.
- Reflow without page-level horizontal scrolling at 320 CSS pixels and at 400% zoom from 1280px. Also test 200% text zoom and text-spacing overrides (1.5 line height, 2× paragraph spacing, 0.12em letter spacing, 0.16em word spacing). Nothing truncates or overlaps, including long names, titles, URLs, nested lists and credits.
- Preserve supplied image alt text and visible captions/linked credits. Do not infer decorative alt rules: today's document media schema requires nonempty alt (`packages/web/src/server/content/document.ts`). Decorative closing rules have no extra spoken ornament.
- Check screen-reader headings, landmarks, byline link names, ordered-list starts, checklist status, captions and related-list position with NVDA/Firefox and VoiceOver/Safari on the host. Use axe at 390/768/1440 in both themes on all five page types plus empty and failure states; test reduced motion and forced colours manually.

**Existing evidence surface:** `LL/literary-longread.e2e.ts` specifies six widths from 360 to 1440, light/dark axe at 390/1440 for three page types, focus, reading measure, reduced motion, and baseline isolation. `LL/views.test.tsx` covers content edge cases and preload identity. These are existing assertions, not passes claimed by this spec. Extend them for the new scale, five page types, all block variants and marks, 320px/zoom, missing data, and shared failure states. Keep the cross-direction sweep in `tests/e2e/reader-lab.spec.ts`.

## 10. Performance budgets and measurement

Canonical field targets are p75 LCP ≤2.5s, CLS ≤0.1, INP ≤200ms (`docs/product/nonfunctional-requirements.md`). The following tighter delivery budgets are proposals for b3 acceptance, not currently enforced LL results. Bytes are decimal transferred resource bytes, except HTML/CSS measured uncompressed and font totals measured from the vendored WOFF2 files.

| Budget                        | Home                                                                            | Article                                                                                       | Evidence                                                                                                                                                                                     |
| ----------------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lab LCP                       | ≤2.5s                                                                           | ≤2.5s                                                                                         | Production build; median of three identical simulated-mobile runs; retain all runs and investigate any >4s.                                                                                  |
| Load/scroll CLS               | ≤0.05                                                                           | ≤0.05                                                                                         | Every cold and warm scenario; include lazy media and actual optional-font behaviour; aim for zero.                                                                                           |
| Interaction latency           | ≤200ms                                                                          | ≤200ms                                                                                        | Event Timing/DevTools trace during theme menu, lab controls and navigation; record actual interactions, not a Lighthouse score. Field INP remains unverified until real p75 evidence exists. |
| Lead image                    | ≤180KB mobile / ≤300KB desktop                                                  | ≤220KB mobile / ≤350KB desktop                                                                | Selected preferred image at 390px DPR2 / 1440px DPR1; inspect fallback transfer separately.                                                                                                  |
| Other images                  | ≤80KB per card; initial viewport images together ≤350KB mobile / ≤600KB desktop | ≤150KB per body/gallery item; initial viewport images together ≤300KB mobile / ≤450KB desktop | Network log, viewport and DPR recorded; below-fold media remain lazy.                                                                                                                        |
| Fonts                         | ≤155,000 bytes all declared faces                                               | Same                                                                                          | Preserve the current 151,996-byte asset ceiling; page requests only faces actually used.                                                                                                     |
| LL-specific client JavaScript | 0 added bytes                                                                   | 0 added bytes                                                                                 | Server components; shared lab/theme cost reported separately.                                                                                                                                |
| LL generated CSS              | ≤16KB uncompressed                                                              | Same                                                                                          | Token, font and style output combined; measure after build.                                                                                                                                  |
| Reader HTML                   | <150,000 bytes                                                                  | <150,000 bytes                                                                                | Home is a proposed budget; current anonymous article assertion is in `tests/e2e/homepage.spec.ts`. No editor bundles on either.                                                              |

If a retained original (animation, unknown dimensions, or ineligible variant) exceeds the image budget, report the actual transfer and the responsible media prerequisite; do not hide the image or call the budget passed. No unlimited eager gallery. Record request counts and server latency with these measurements so regressions can be attributed, without inventing a server budget in a direction spec.

**Cold fonts:** keep `font-display: optional`, no preloads, metric-adjusted local fallbacks, and visible initial text. A slow first visit may retain fallback for that navigation. **Warm fonts:** allow cached fonts on initial layout; verify no late swap or shift. Test slow-font and missing-local-fallback scenarios as well as the normal host fonts. Active-only emission and removal on switching to baseline remain mandatory (`packages/web/src/reader-directions/README.md`, `LL/fonts.test.ts`, `LL/literary-longread.e2e.ts`).

**Measurement limits and method:** `scripts/lab-lighthouse.md` and `scripts/lab-lighthouse.mjs` describe a signed-in, simulated-mobile audit of home/article/section that verifies the selected direction and lab bar. Browser caches begin cold; image variants on the server may be warm. Its scores are measurements, not gates; TBT is not INP. Run it with `--direction literary-longread` on the host's dedicated fixture server, using existing installed tooling and durable artifact storage. Do not copy the guide's temporary install-directory example into delivery work.

For every run record commit, route, fixture, direction identity, theme, viewport/DPR, browser/Lighthouse versions, throttling, browser cache and server variant state. Add direct browser measurements for author/topic because that harness covers only three routes. Preserve Lighthouse JSON/HTML, network bytes and selected URLs, layout-shift entries, interaction traces, and a compact pass/gap table. Compare both fresh-server and warm-variant runs. Anonymous visitors currently receive Baseline, including with a direction cookie (`LL/literary-longread.e2e.ts`, `docs/reader-lab-local.md`); signed-in LL data cannot establish anonymous LL field performance. Verify Baseline still receives no LL assets and collect LL field data only after a separately authorized public selection.

**Do not benchmark capture mode:** `LL/capture.mjs` runs the screenshot test, which invokes `packages/web/src/reader-directions/capture-fonts.ts`, waits for actual faces, and eagerly decodes images (`LL/literary-longread.e2e.ts`). Use that for art-direction evidence only. The existing font README's zero-CLS aspiration is not a measured result; the b3 browser report must state what happened.

## 11. Three build batches and exact delta

All batches keep fonts as data, root-scoped style strings, shared renderers, supplied content, active-only assets, and the public-media boundary. No new CSS imports, `next/font`, data fetching, cookie access, or runtime publication changes. Paths below are future build surfaces, not additions to this spec bead's write set.

### b1 — Home and section

**Keep:** split dark cover, gold cover labels, newest-first data, section index, wrapping masthead, simple footer, original-fallback preload helper (`LL/home.tsx`, `section.tsx`, `shell.tsx`, `image-preload.tsx`).

**Change:** `LL/tokens.ts` and `styles.ts` get the exact palette, type scale and grid; change the four-across desktop feature grid to two columns, sentence-case the cover, remove two-line dek clipping, show dates/reading times, and reserve caption/credit space. Add a local card component for b1/b2 reuse; adapt section thumbnail sizes and focal positioning. Preserve empty/text-only behaviour. Today's home and section use bare ReaderImageView without captions/credits (`LL/home.tsx`, `section.tsx`); use shared figures/credit rendering in the new frames.

**Verify:** targeted render/font/contrast/contract tests; production browser home/section captures at 390/768/1440, both themes; long-title, no-image, 0/1/many-story cases; count each supplied story once. Check focus and preload identity before handing the new card to b2. Tests that assume four desktop columns or the previous colours/type must be updated to the accepted specification, not merely relaxed.

### b2 — Article, author, topic, related

**Prerequisite:** inspect the merged `blog-0044.22` types/registration/routes. At this baseline the only registered LL views are Home/Article/Section (`LL/index.ts`); author/topic integration must use the new optional hooks, never imaginary fields added locally.

**Keep:** ArticleBody, ReaderFigure hero, centered desktop title/dek, reading column, existing block selectors, real italics (`LL/article.tsx`, `styles.ts`, `fonts.ts`).

**Change:** add linked author byline and conditional end matter, topics, up to three related cards, and explicit end-of-article navigation. Add `LL/author.tsx` and `topic.tsx` using the section index pattern, register only through the kit contract, and apply the complete block/mark matrix. Tighten opening-initial selection, remove mobile initials, give h4/h5/h6 distinct sizes, and remove current figure breakout transforms in favour of the stable body measure (`LL/styles.ts`). No fabricated biography, topic description, or author portrait.

**Verify:** all block kinds/variants and six marks, nested lists, supplied ordered starts, long linked names, null bios/descriptions, zero/one/three related cards, empty topic/author, no hero and short story. Test author/topic navigation back to stories and active-direction persistence through the shared routing. Capture all five page types in both themes. Shared contract/backend gaps go back to the kit owner with concrete missing inputs; this direction does not implement data policy.

### b3 — Media, accessibility, Core Web Vitals and evidence

**Change:** complete shared ArticleBody sizing support and shared failure-shell integration through separately admitted shared work; finish any LL focal/caption/preload corrections, nested media sizing, focus, contrast, zoom, and print adjustments. Keep print readable with light paper/ink, hidden navigation/lab UI, no clipped content, and natural-ratio media. Do not call these shared dependencies complete from LL-only CSS.

**Verify:** run the existing reader/direction unit tests, root/registry isolation and five-page browser checks, plus cross-direction regression checks for shared changes. Extend LL cold/warm CLS and real-interaction checks; run the Lighthouse protocol from section 10 and manual accessibility matrix from section 9. Screenshots and font-forced capture are a separate evidence set. No dependency installs, hosted runs, or publication are implied by this spec.

**Handoff:** provide exact commit/tree, commands and exit statuses, all five page/theme/viewport captures, palette and computed-style checks, image selection/bytes/focal-point evidence, cold/warm performance results, manual accessibility findings, and remaining shared gaps. Review at the exact candidate head. Existing tests are evidence tools, not a substitute for running them; mark unavailable checks explicitly. The client then compares the developed directions; neither a passing lab run nor this specification chooses a public default.

## 12. Client questions

These do not block implementation of the stated defaults. Compare against the same published story in all five directions.

1. Does the warm paper and sentence-case illustrated cover feel more like your magazine than the current white paper/uppercase cover? Default: warm paper and sentence case.
2. Is the opening initial a welcome literary cue? Default: keep it only for a paragraph-led article on tablet/desktop; omit it on mobile.

No extra author biographies, topic descriptions, or images are needed to review the build: their absent states are deliberate parts of the design.
