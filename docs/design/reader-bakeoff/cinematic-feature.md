# Cinematic Feature: developed magazine specification

Bead: `blog-0044.26`. Date: 2026-10-19. Status: proposed build specification for client comparison; not a selected winner or implementation evidence.

Source baseline: `094024ac5a99b63dd18c1669993abf3e69fb3134`. Paths below describe that revision. All prescriptions are target behavior for the subsequent build batches. No product code, fonts, routes, or shared contracts change in this specification.

## 1. Thesis and distinction

Cinematic Feature makes published stories about places, objects, and people feel like the opening of a documentary: a generous photograph, a concentrated title, then enough quiet to read. The reader should feel present in the scene and confident about where to go next. Its signature is the transition from a dark photographic opening to a measured reading column, with amber used for navigation and editorial metadata.

The North House sample content is the comparison material, not a new publication identity. Use the shared `siteName` and real published copy throughout; the local trial and owner comparison journey are documented in [the local guide](../../reader-lab-local.md) and [the owner guide](../../reader-lab-owner-guide.md).

| Existing direction                                                                                                                       | Distinction to preserve in D                                                                                     |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| [Quiet Monograph](../../../packages/web/src/reader-directions/quiet-monograph/home.tsx): a centred cover and quieter story lists         | D puts the photograph across the viewport and gives display type greater weight.                                 |
| [Literary Long-read](../../../packages/web/src/reader-directions/literary-longread/home.tsx): a text/image cover panel and featured grid | D keeps sans-serif prose and a photographic opening; it does not adopt Literary's illustrated-cover composition. |
| [Swiss Index](../../../packages/web/src/reader-directions/swiss-index/home.tsx): numbered lead cards and an index                        | D removes its current visible story numbers and uses image scale to establish hierarchy.                         |
| [Expressive Colour](../../../packages/web/src/reader-directions/expressive-colour/index.ts): soft serif letters and story colours        | D uses one stable palette across stories and preserves photographic colour.                                      |

Existing D already declares “expansive images, condensed titles and room to read” in [index.ts](../../../packages/web/src/reader-directions/cinematic-feature/index.ts). Develop that identity; avoid film perforations, fake issue numbers, autoplay video, and decorative production credits.

## 2. Pages, responsive layouts, and states

### Data and route boundary

At the baseline, [views.ts](../../../packages/web/src/reader/views.ts) and [contract.ts](../../../packages/web/src/reader-directions/contract.ts) expose Home, Section, and Article only. Home is the newest visible lead plus ordered recent stories; the [read model](../../../packages/web/src/reader/read-model.ts) returns empty article authors and null section descriptions. There are no author links, topic links, or automatic related-story collections in these views.

Batch b2 depends on the merged shared kit `blog-0044.22` for optional Author/Topic views and article author links, topics, and related cards. Before implementing b2, verify the actual exported types and routes at its base SHA. The design needs display names, provided hrefs, nullable bio/description, ordered story collections, and optional article link collections; these are semantic requirements, not invented field names. Never construct an author/topic URL from a name, fetch inside a direction, query for related content, or infer authors from image credits. Do not assume portraits, social profiles, total result counts, pagination, search, or newsletter services exist.

Mobile means below 768px, tablet 768–1023px, desktop 1024px and above. Source order remains the reading and keyboard order. Cards wrap without truncating titles or deks. Render each supplied story once per collection, retain supplied order, and omit empty optional modules.

| Page                       | Desktop                                                                                                                                                                                                                                                                                           | Tablet                                                                                                               | Mobile                                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Home `/`                   | Normal-flow masthead, then full-width lead photograph with a lower-left title panel occupying up to eight of twelve columns. Lead section, title, dek, reading time and contextual story link. Below the cover: `recent[0:2]` as two large secondary cards; `recent[2:]` as compact story rows.   | Photograph above its solid title panel; two secondary cards; remaining rows below. Navigation wraps above the cover. | 4:3 photograph, solid title panel, stacked secondary cards, then compact rows. Metadata remains legible; no viewport-height minimum. |
| Section `/sections/[slug]` | Section label, h1, optional real description; first supplied story is a 7/5-column image/text feature. Remaining stories form a two-column grid.                                                                                                                                                  | Header then first image and text stacked; remaining stories two columns.                                             | One column throughout; first image 4:3, remaining cards 3:2.                                                                         |
| Article `/stories/[slug]`  | Header with section link and reading time, h1, dek, linked byline when supplied, publication date. Heading panel overlays the lower part of a full-width hero. Figure caption/credit occupies its own solid strip. Body follows on the reading surface; topics, related module, end link, footer. | Heading on a solid panel, then a 16:9 hero and caption; centred body; end modules below.                             | Heading on a solid panel, then a 4:3 hero and caption; body at 18px. Topics wrap, related cards stack, end link precedes footer.     |
| Author, shared-kit route   | Text-only identity header: “Author”, name h1, nullable bio at 55ch. Below, first supplied story as the section feature, then two-column cards. Do not reserve a portrait slot.                                                                                                                    | Identity header and stacked first feature; two-column cards below.                                                   | Header, bio only when supplied, then single-column story cards.                                                                      |
| Topic, shared-kit route    | “Topic”, name h1, nullable description at 55ch; same feature and card pattern as section.                                                                                                                                                                                                         | Stacked first feature, two-column remainder.                                                                         | One column; same hierarchy as section.                                                                                               |

Home's only h1 is the magazine name; its lead title is h2. On all other pages the magazine name is a paragraph/link and the page title is the sole h1. Collection cards are h2 unless inside a module with an h2 heading, when they are h3. Home uses “More stories” and “Latest stories” as module h2s. Use “Stories by [name]” on author collections and “Stories about [topic]” on topic collections. If the list is capped, show no total count; a supplied collection length is not a publication-wide count.

The article's semantic order is heading/byline/date, hero figure and its caption, body, topics, related stories, return link. Desktop CSS may overlap the heading panel and hero without moving focusable elements out of that order. A missing hero collapses the media area and its preload entirely; the title panel becomes a compact text opening. No empty caption, invented byline, repeated hero inside `ArticleBody`, or large blank stage remains.

At the article end, leave 48px before a rule and the optional “Topics” link list. Then show “Related stories” with up to three supplied cards, excluding the current story and duplicate hrefs while preserving order. Use three columns on desktop, two on tablet, one on mobile; fewer cards keep the same slot widths. This module is separate from an authored `editorialBlock` with variant `related-stories`, which stays where the author placed it. Finish with a section return link when supplied, otherwise “All stories”, then the footer. Do not add a synthetic “Next story”.

### Missing and failed content

| State                                                     | Content and behavior                                                                                                                                                                                                                   | Layout at desktop / tablet / mobile                                        |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Empty home                                                | Keep the brand h1; h2 “No stories yet”; “New stories will appear here when they are published.” No media or skeleton cards.                                                                                                            | 42rem maximum panel inside normal gutters / same / full available width.   |
| Empty section, author, topic                              | Keep the real identity h1 and any supplied description; “No stories have been published in this section yet”, “No published stories by this author yet”, or “No stories have been published about this topic yet”. Link “All stories”. | Same panel; natural height at every width.                                 |
| Missing biography, description, image, or link collection | Omit that element and its spacing. Image-free cards start with a rule and real text, not stock art. Name-only authors stay plain text until real links are provided.                                                                   | Same grid slots, content-driven height; no empty media slot.               |
| Not found                                                 | Target h1 “Page not found”, short explanation, “All stories” link; no private title or guessed destination.                                                                                                                            | One 42rem panel; normal gutters and 44px controls at all widths.           |
| Unavailable/error                                         | “Stories are unavailable” or “Something went wrong”; plain explanation, existing retry action where available, and “All stories”. No exception details.                                                                                | Same panel; actions wrap on mobile. Preserve keyboard focus when retrying. |

The last two rows require a shared route-boundary companion, not just D's views: [home](../../../packages/web/src/app/page.tsx) renders [ReaderUnavailable](../../../packages/web/src/reader/components/reader-unavailable.tsx) outside Home, and story/section routes call `notFound()` before direction rendering. [not-found.tsx](../../../packages/web/src/app/not-found.tsx) and [error.tsx](../../../packages/web/src/app/error.tsx) are currently global h2-based panels. Keep their existing behavior until a separately scoped shared change supplies the target semantics; do not pretend direction CSS can reach them or add error components to the direction contract ad hoc. The b3 evidence must explicitly identify this dependency's disposition.

## 3. Typography

Retain Archivo for display and prose, Martian Mono for utility text. The current [font declarations](../../../packages/web/src/reader-directions/cinematic-feature/fonts.ts) ship Archivo normal with weight 100–900 and width 62–125, plus Martian Mono normal 400/500. [Font provenance](../../../packages/web/public/reader-directions/cinematic-feature/fonts/README.md), `sources.json`, and the accompanying complete SIL OFL 1.1 licences document 111,100 WOFF2 bytes. The provenance explicitly records synthesized inline italics today.

Add a genuine Archivo Latin italic subset for body emphasis, with 400 and 700 available. Proposed local filename: `archivo-latin-reader-italic.woff2`; the asset is not present or verified at this baseline. Coordinator-staged acquisition must retain the upstream OFL, source/archive URL, version, hash, byte count, subset command, and verified axes. Declare `style: 'italic'` and only ranges actually present in the file. This is a b2 prerequisite for italic acceptance, not permission to download or add a dependency in a worker. Keep the same family roles; no third family is needed.

All faces remain local licensed WOFF2 subsets declared as data. Keep `font-display: optional`, the generated metric-adjusted fallbacks, active-root-only font CSS, and no font preloads, `next/font`, or stylesheet imports, as required by the [direction README](../../../packages/web/src/reader-directions/README.md). Reproduce existing normal metrics with `cinematic-feature/font-metrics.mjs`; measure the new italic face rather than copying normal metrics without checking. Preserve Å/Ä/Ö; use system fallback for uncovered scripts without silently expanding subsets.

| Role                        | Mobile         | Tablet         | Desktop                   | Treatment                                                                                     |
| --------------------------- | -------------- | -------------- | ------------------------- | --------------------------------------------------------------------------------------------- |
| Home lead and article title | 44px           | 64px           | `clamp(64px, 6vw, 112px)` | Archivo 850, width 68%, uppercase via CSS, line-height 1.02, tracking −0.015em; maximum 20ch. |
| Section/author/topic title  | 40px           | 56px           | 72px                      | Archivo 800, width 75%, line-height 1.05; authored casing.                                    |
| Feature/card title          | 28px           | 32px           | 40px feature, 32px card   | Archivo 800, width 85%, line-height 1.15, authored casing.                                    |
| Article h2 / h3             | 30 / 24px      | 36 / 28px      | 40 / 30px                 | Archivo 800, width 85%, line-height 1.2.                                                      |
| Article h4 / h5 / h6        | 22 / 20 / 18px | 24 / 22 / 20px | 24 / 22 / 20px            | Archivo 700, normal width, line-height 1.35; semantic levels retained.                        |
| Prose                       | 18px           | 20px           | 20px                      | Archivo 400, normal width, line-height 1.7; strong 700.                                       |
| Dek                         | 20px           | 22px           | 24px                      | Archivo 400, normal width, line-height 1.5; 48ch maximum.                                     |
| Card/row summary            | 16px           | 18px           | 18px                      | Archivo 400, normal width, line-height 1.6; 55ch maximum.                                     |
| Metadata, captions, credits | 14px           | 14px           | 14px                      | Martian Mono 400; labels 500; line-height 1.6; uppercase only short labels.                   |
| Wordmark                    | 24px           | 24px           | 28px                      | Archivo 800, normal width, line-height 1.1.                                                   |

Implement sizes in rem at the 16px reference root; never fix the root size against user settings. Prose measure is `min(65ch, 42rem)` and the available width. No title line clamp, fixed line count, forced editorial line break, text shrinking script, justified prose, or condensed paragraphs. Long titles and fallback-font titles grow the panel. Use genuine italic for `em`, including bold-italic combinations; verify painted faces before disabling font synthesis.

Delta: [tokens.ts](../../../packages/web/src/reader-directions/cinematic-feature/tokens.ts) currently has 11px labels, 12px small text, a 52–120px main title, and 20px body; [styles.ts](../../../packages/web/src/reader-directions/cinematic-feature/styles.ts) reduces next-story metadata to 10px. Raise utility text, reduce mobile body/title scale, and reserve uppercase condensation for the signature opening.

## 4. Grid, spacing, and breakpoints

Use a 4px spacing unit with steps 4, 8, 12, 16, 24, 32, 48, 64, 96px. At the default root size:

| Rule                                         | Mobile <768px            | Tablet 768–1023px | Desktop ≥1024px         |
| -------------------------------------------- | ------------------------ | ----------------- | ----------------------- |
| Outer gutter                                 | 20px                     | 32px              | 48px                    |
| Page interior                                | Available width          | Available width   | Maximum 1440px, centred |
| Grid / gaps                                  | 4 logical columns / 16px | 8 / 24px          | 12 / 32px               |
| Section spacing                              | 48px                     | 64px              | 96px                    |
| Card image to metadata                       | 16px                     | 16px              | 16px                    |
| Metadata to title / title to summary         | 8 / 12px                 | 8 / 12px          | 8 / 12px                |
| Body paragraph spacing / heading space above | 24 / 48px                | 24 / 48px         | 24 / 48px               |

The full-width home/article hero sits outside the capped page interior. Desktop cover media has a nominal 16:9 frame with a 32rem minimum and 56rem maximum **preferred** height; heading content can grow its grid row beyond that maximum. Tablet uses 16:9, mobile 4:3, with normal-flow panels. Remove the existing 85/100svh home and 65/75svh article minimum stages in [styles.ts](../../../packages/web/src/reader-directions/cinematic-feature/styles.ts). No sticky masthead or competing sticky article rail; Reader Lab retains its own bottom space.

At 1536px and above, top-level gallery diptychs/grids may use two fixed 42rem image slots separated by 24px (85.5rem total), centred outside the prose measure but within the 90rem interior. Below that width they stack. This extra breakpoint serves actual media widths; it does not change the reading column. Nested galleries never escape their containing block.

Those pixel thresholds describe the default 16px root. Implement the gallery threshold in rem and require both slots to fit the available container; otherwise stack. Every media slot is capped to available width, so enlarged user text cannot force a 42rem image beyond the viewport. At enlarged settings the existing image `sizes` can overestimate a capped slot; it must never cause layout overflow.

## 5. Colour and contrast

Keep the existing dark cinematic shell in both themes; light mode uses a pale reading surface, dark mode uses the same dark ground for prose. These values retain [tokens.ts](../../../packages/web/src/reader-directions/cinematic-feature/tokens.ts); only the UI-rule token is new.

| Token                 | Light     | Dark      | Use                                                 |
| --------------------- | --------- | --------- | --------------------------------------------------- |
| `--cf-ground`         | `#0B0C0C` | same      | Shell, solid heading panels, footer                 |
| `--cf-ink`            | `#F2F1EC` | same      | Shell titles and primary links                      |
| `--cf-secondary`      | `#CFCDC5` | same      | Shell deks, dates, captions                         |
| `--cf-amber`          | `#E6B65C` | same      | Section/topic links and active indicators on ground |
| `--cf-slate`          | `#4F5B66` | same      | Decorative dividers only                            |
| `--cf-paper`          | `#F2F1EC` | `#0B0C0C` | Prose, author bio, related/end panels               |
| `--cf-body-ink`       | `#151515` | `#F2F1EC` | Prose, headings, code                               |
| `--cf-body-secondary` | `#4F5B66` | `#CFCDC5` | Prose captions, byline, secondary text              |
| `--cf-body-accent`    | `#755017` | `#E6B65C` | Prose links, quote rules, topic links               |
| `--cf-ui-rule`        | `#747B82` | same      | Essential control boundaries; never text            |

The following exhaustive text-pair allowlist includes link hover, focus and visited states: retain their assigned foreground, adding underline/outline rather than lowering opacity. Do not introduce text on slate, UI-rule, or photographs. Inline code, callouts, editorial panels, and related cards inherit paper; navigation inherits ground.

| Foreground / background                          | Light ratio | Dark ratio | Minimum |
| ------------------------------------------------ | ----------- | ---------- | ------- |
| ink / ground                                     | 17.32       | 17.32      | 4.5:1   |
| secondary / ground                               | 12.30       | 12.30      | 4.5:1   |
| amber / ground                                   | 10.46       | 10.46      | 4.5:1   |
| body-ink / paper                                 | 16.15       | 17.32      | 4.5:1   |
| body-secondary / paper                           | 6.15        | 12.30      | 4.5:1   |
| body-accent / paper                              | 6.37        | 10.46      | 4.5:1   |
| ground / amber, for selection or a filled action | 10.46       | 10.46      | 4.5:1   |

Ratios were computed from the opaque colours with the repository [contrast helper](../../../packages/web/src/reader-directions/contrast.ts), rounded to two decimals. Declare all seven pairs in `textPairs`; the contract enforces 4.5:1 even for large text. New essential borders have 4.57:1 against ground and 3.79:1 against paper; require at least 3:1 for UI boundaries/focus indicators. Existing slate/ground is only 2.82:1 and cannot identify controls by itself.

Desktop headline panels are opaque ground, with 24px internal padding; every letter, metadata item, link, and focus outline stays inside this solid area. Photography outside the panel remains ungraded. This replaces the current gradient/scrim dependence rather than claiming automatic contrast over arbitrary images. Keep image-extreme browser fixtures: white, black, high-frequency detail, long title, and zoom. In forced colours, use Canvas/CanvasText/LinkText and Highlight; borders and links remain identifiable with background images suppressed.

## 6. Imagery, sizing, priority, and credits

Use only supplied `ReaderImage` values and shared `ReaderImageView`/`ReaderFigure`. Preserve natural colour and focal points; no grayscale, blur filter, parallax, or image enlargement on hover. All cropped frames propagate `object-position: x*100% y*100%` through the picture/wrapper to the image, including missing-dimension wrappers. Use descendant selectors: the [shared renderer](../../../packages/web/src/reader/components/reader-image.tsx) inserts `<picture>` between frame and image.

| Placement                               | Art direction / ratio                                                                                                   | `sizes` target                                                                                                                                 | Lead priority                     |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| Home cover                              | Establishing scene, 16:9 desktop/tablet, 4:3 mobile; crop around stored focal point                                     | `100vw`                                                                                                                                        | Home lead image only              |
| Article hero                            | Same ratios; title panel never covers the focal subject intentionally; caption separate                                 | `100vw`                                                                                                                                        | `view.hero` only                  |
| Section/author/topic first feature      | Desktop 7/12 of interior excluding the 32px gap; stacked on smaller screens; 3:2 desktop/tablet, 4:3 mobile             | `(min-width: 1536px) 821.33px, (min-width: 1024px) calc(58.333333vw - 74.666667px), (min-width: 768px) calc(100vw - 64px), calc(100vw - 40px)` | First supplied story's image only |
| Two-column cards                        | 3:2; subject visible at small size                                                                                      | `(min-width: 1536px) 704px, (min-width: 1024px) calc(50vw - 64px), (min-width: 768px) calc(50vw - 44px), calc(100vw - 40px)`                   | Lazy                              |
| Compact home rows                       | 80px square at right, full title and summary at left; omit image if absent                                              | `80px`                                                                                                                                         | Lazy                              |
| Related cards                           | 3:2; three desktop columns, two tablet, one mobile                                                                      | `(min-width: 1536px) 458.67px, (min-width: 1024px) calc(33.333333vw - 53.333333px), (min-width: 768px) calc(50vw - 44px), calc(100vw - 40px)`  | Lazy                              |
| Top-level body image and gallery member | Intrinsic ratio; 42rem-wide slot desktop/tablet, full viewport on mobile; unknown dimensions retain shared 3:2 fallback | Existing shared value: `(min-width: 768px) 42rem, 100vw`                                                                                       | Lazy, even if no hero             |

These card calculations use a 1440px maximum interior, the gutters/gaps in section 4, and equal columns; the feature uses a 7fr/5fr division of the remaining width. Keep preload `imageSizes` identical to the lead's picture/img sizes. Reserve frame geometry before image load. Do not promote a later image if the lead story lacks one; the title becomes the LCP candidate.

The current [ArticleBody](../../../packages/web/src/reader/components/article-body.tsx) hard-codes the last table value for every body image and gallery member, while D's current CSS expands them to the viewport. Fix this in direction CSS: top-level media uses 42rem slots at ≥768px and full viewport below; galleries use the section 4 breakpoint. Nested media remains within its list, quote, or editorial container; the shared value is then a conservative upper bound, not an exact width hint. Record any oversizing in b3. Do not fork `ArticleBody` or make a direction-local renderer to gain arbitrary full-width desktop body images; a future sizing API would require a separate shared contract change.

Home cover, collection feature/card images, and article images retain supplied captions and credits. Use `ReaderFigure` where both are displayed; compact 80px rows show credit directly below the thumbnail and leave the full caption to the linked article. Never put credit links inside a story link, suppress credit links with an overlay, or use caption text as alt text. Empty caption and absent credit yield no caption gap. Caption strips use 14px Mono on a solid surface; photo credits are not author bylines.

Retain the real responsive preload link in [image-preload.tsx](../../../packages/web/src/reader-directions/cinematic-feature/image-preload.tsx), matching `readerImageSources`, plus `preload` on the same image. There must be zero or one lead preload per page. Keep AVIF/WebP/fallback selection and original-image cases (animated/GIF, oversized, unknown width) in the shared renderer. Do not introduce Next's image optimizer, alternate URLs, or media caches that bypass publication checks.

## 7. Components and every editorial block

Keep the [shell](../../../packages/web/src/reader-directions/cinematic-feature/shell.tsx) structure: skip link, brand, section navigation, main, footer. Change the skip label to “Skip to content” and keep `#cf-main` focusable. The masthead is solid ground in normal flow at every width, wrapping navigation rather than adding a menu drawer. Preserve `aria-current` for the active section. Footer contains the real site name and “All stories”; add no invented copyright owner, social links, or subscription action.

Cards use separate title, section, and credit links without nested anchors or full-card click handlers. A title link provides the main target; a repeated “Read the story” link on the lead includes the story title in its accessible name. Keep deks whole. Home compact rows have no visible ordinal numbers; ordering already comes from the supplied newest-first collection. Related cards use h3 under the module h2.

The following covers every node and mark in [document.ts](../../../packages/web/src/server/content/document.ts), through [views.ts](../../../packages/web/src/reader/views.ts) and the shared [ArticleBody](../../../packages/web/src/reader/components/article-body.tsx). Style its semantic elements and `data-block`/`data-variant`/`data-layout`; do not replace markup or change document validation.

| Stored node / reader projection     | Treatment                                                                                                                                                                                                                                                                                |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `doc`                               | Content container only; `.cf-body` establishes measure, flow, and colour. No extra h1.                                                                                                                                                                                                   |
| `paragraph`, `text`, `hardBreak`    | 18/20px normal-width prose; preserve authored line breaks and all text. No drop cap or automatic lead-paragraph enlargement.                                                                                                                                                             |
| `heading` → h2–h6                   | Scale in section 3; 48px above, 16px below; keep-with-next in print. Preserve actual levels, never restyle a paragraph as a heading.                                                                                                                                                     |
| `blockquote` → quote                | 2px body-accent left rule, 24px inset, normal prose size; retain nested flow produced by the shared renderer.                                                                                                                                                                            |
| `pullQuote` → pull-quote figure     | 32px mobile / 40px desktop Archivo 700 at 85% width, line-height 1.25, 48px block margins; thin accent rules above/below. Attribution remains 14px figcaption. Do not insert a second quotation elsewhere.                                                                               |
| `bulletList`, `listItem`            | Visible disc markers, 24px indentation, 8px between items; nested blocks retain paragraph spacing.                                                                                                                                                                                       |
| `orderedList`, `listItem`           | Preserve `start` and `type` numbering (1/a/A/i/I); do not substitute decorative counters.                                                                                                                                                                                                |
| `taskList`, `taskItem`              | Static checklist; aligned accent glyph, retain shared “Done”/“Not done” screen-reader text. No disabled or interactive checkbox.                                                                                                                                                         |
| `mediaImage` → image figure         | Section 6 slots, caption/credit below, 48px block margin; intrinsic aspect ratio inside body.                                                                                                                                                                                            |
| `gallery` → gallery list            | Preserve item order/captions/credits. Grid and diptych use two 42rem slots only at ≥1536px, one below. Carousel is a vertical sequence at all widths, labelled by existing content; no autoplay, scrolling trap, or invented slide controls. Nested galleries stay one column.           |
| `callout` → note/tip/warning        | Paper surface, 1px body-secondary border, 24px padding (16px mobile), real label in 700 weight. Add a 3px accent leading rule for warning; meaning comes from the label, not colour.                                                                                                     |
| `codeBlock` → pre/code              | 16px Martian Mono 400, line-height 1.6; preserve whitespace with `pre-wrap`, allow long tokens to wrap, 16px padding and visible rules. Language remains metadata; no syntax highlighter dependency.                                                                                     |
| `horizontalRule` → divider          | 1px body-accent line, 48px block margins.                                                                                                                                                                                                                                                |
| `embed` → linked figure             | Paper panel, body-secondary border, 24px padding, descriptive supplied title as underlined link, supplied fallback as caption. Preserve the existing link-only YouTube/Vimeo behavior; no iframe or player.                                                                              |
| `editorialBlock` → labelled section | 24px padding, 32px block margins, content remains within prose measure. `fact-box`: 1px frame; `key-points`: 3px leading accent; `methodology`: top/bottom rules; `related-stories`: 1px frame with underlined supplied links. Retain nested blocks and the renderer's accessible label. |

All six marks: `bold` uses Archivo 700; `italic` uses the genuine italic face; `code` uses Mono 400 at 0.9em with wrapping; `link` uses body-accent plus a persistent underline; `strike` retains `<s>`; `underline` retains `<u>` without turning it into a link. Nested marks must preserve emphasis and link purpose. An absent or unservable image stays absent as projected; the direction must not invent a replacement or render stored raw HTML.

## 8. Motion and interaction

Use static page openings. Remove the current 6px/450ms title entrance in [styles.ts](../../../packages/web/src/reader-directions/cinematic-feature/styles.ts). Optional 120ms underline-colour feedback on hover/focus is the only transition; no translation, fading of essential text, scroll reveal, smooth-scroll requirement, or carousel behavior. In reduced motion, remove all direction transitions and animations and use automatic scrolling.

Focus is a 3px outline with 3px offset: amber on ground, body-accent on paper, ground on amber-filled controls. Avoid clipping outlines in card/media containers; the headline panel includes sufficient inset. Underline active, hover, and focus links without moving layout. Forced-colour focus uses Highlight. Keep native link navigation and browser history; no direction-specific client state or event handlers are required.

## 9. Accessibility and verification

Target WCAG 2.2 AA under the [canonical requirements](../../product/nonfunctional-requirements.md). The following is an implementation acceptance checklist, not a conformance claim:

- One banner, one main, a labelled section navigation, one footer; exactly one h1. Keep the skip link first in the shell and focus the main target. Preserve article heading levels and the shared semantic lists, figures, notes, and editorial sections.
- Keyboard order follows DOM order: skip, brand/navigation, page content links, article end links, footer, with the shared Lab controls remaining operable. No hover-only content or keyboard traps; focus must remain visible above the Lab bar and after retry/navigation.
- Use at least 44×44 CSS-pixel targets for navigation, standalone actions, topic links and card-title links, with 8px separation when adjacent. Inline prose/credit links retain readable line height and distinguishable underlines; do not claim they all have 44px boxes.
- Preserve image alt text separately from captions and credits. Never overwrite it with the title. Verify linked author names and topic labels make sense in a screen-reader link list. Omit unsupported data rather than announce placeholders.
- Verify 200% text zoom, 400% browser zoom/reflow at a 320 CSS-pixel equivalent, long unbroken titles, and user text spacing (1.5 line height, 2em paragraph spacing, 0.12em letter and 0.16em word spacing). Text/controls must neither clip nor overlap. Only authored code formatting may change through wrapping.
- Run axe with the Lab bar on all five page types at 390 and 1440px in both themes; run manual keyboard and screen-reader spot checks, forced colours, reduced motion, and colour-pair checks. Automated checks do not replace manual reading/focus inspection.
- Add 320, 360, 768, 1024, and 1536px layout checks to the existing width coverage. Fixtures include no posts, one post, long title/dek/byline, image-free article, no biography/description/topics/related, portrait hero, missing image dimensions, all blocks/marks, image extremes, and the agreed shared error/not-found surfaces.

Existing [direction browser tests](../../../packages/web/src/reader-directions/cinematic-feature/cinematic-feature.e2e.ts) cover three page types, 360–1440px overflow, light/dark axe at 390/1440, keyboard access, reduced motion, white-hero contrast, visitor isolation, and cold/warm article shift. Existing [view tests](../../../packages/web/src/reader-directions/cinematic-feature/views.test.tsx) check supplied copy, empty states, lead preload and blocks. Extend these assertions to the new design; their presence is not a new passing test result.

## 10. Performance budgets and measurement

The canonical field targets are p75 LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 for home and article ([requirements](../../product/nonfunctional-requirements.md)). The proposed build budgets below add stricter lab checks; they are not measured results or currently enforced gates.

| Budget                                          | Home                                  | Article              | Measurement                                                                                                                                                     |
| ----------------------------------------------- | ------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lab LCP                                         | ≤2.5s                                 | ≤2.5s                | Median of three comparable cold browser runs and three warm runs, production build; report each run and server-variant cache state.                             |
| Lab layout shift                                | <0.05                                 | <0.05                | Cold and warm loads without font capture gate; title-attributed shift must be 0. Also inspect scrolling and end-module loading.                                 |
| Interaction latency                             | ≤200ms per scripted local interaction | same                 | Browser interaction trace for navigation and shared theme/Lab controls; report as lab latency, not field INP. Field p75 remains a later deployment measurement. |
| Lead candidate bytes, mobile / desktop          | ≤200 / 350 KiB                        | ≤200 / 350 KiB       | Actual selected response body, at 390×844 and 1440×900, DPR 1 and 2; AVIF, WebP and fallback each assessed.                                                     |
| Initial-viewport image bodies, mobile / desktop | ≤350 / 600 KiB total                  | ≤250 / 500 KiB total | Include eager and opportunistically loaded lazy images; exclude content reached only by deliberate scrolling.                                                   |
| Later image / thumbnail                         | ≤150 / 30 KiB                         | ≤150 / 30 KiB        | Selected candidate, including fallback; record any original-only asset exceeding budget.                                                                        |
| Declared WOFF2 payload                          | ≤180,000 bytes                        | same                 | All local faces including the added italic; request only used faces. Current declared total is 111,100 bytes.                                                   |
| Added direction client JS                       | 0 bytes                               | 0 bytes              | Server views/CSS; shared Lab code measured separately. No editor bundles.                                                                                       |
| Direction styles + tokens                       | ≤24 KiB uncompressed                  | same                 | Emitted active-direction style text, excluding font binaries and shared shell assets.                                                                           |
| Article HTML                                    | Not a current home gate               | <150,000 bytes       | Preserve the existing anonymous article HTML check; also record signed-in Lab HTML separately.                                                                  |

The anonymous HTML/no-editor checks live in [homepage.spec.ts](../../../tests/e2e/homepage.spec.ts). The current D browser test asserts total article shift <0.05 and title shift 0 at 390px for cold/warm visits; it is a scoped layout-shift sum, not field p75 proof. [The Lighthouse harness](../../../scripts/lab-lighthouse.md) measures signed-in home/article/section, verifies the chosen direction, and reports LCP, CLS and TBT. TBT is not INP, and a score is not a budget gate. Do not reuse old AI-era FID/2G/95+ score claims as this spec's acceptance criteria.

Keep font loading unchanged in principle: on a slow cold visit the adjusted fallback can remain for the navigation; on warm visits Archivo can paint immediately. Verify the fallback's longer title wraps and all italic/strong combinations; do not delay visibility waiting for fonts. [capture.mjs](../../../packages/web/src/reader-directions/cinematic-feature/capture.mjs) invokes a screenshot test whose font-readiness gate and eager image loading change normal timing. Use it only for visual evidence, and update its old `docs/worklog/blog-0044.6` destination for each build's captures.

Record build SHA, route, fixture, signed-in/anonymous context, direction root, browser/tool versions, viewport/DPR, theme, throttling, browser/font cache state, server image-cache state, raw reports and failures. Audit author/topic separately because the current harness covers only three routes. While visitors still receive Baseline, no signed-in D result proves anonymous D performance; repeat on a genuinely authorized public configuration if D is selected later. Do not change caching, authentication, publication visibility, or the public default to obtain a score. Original-only media over budget is an evidence gap requiring editorial/media follow-up, not permission to lose animation or bypass shared media rules.

## 11. Delta and three build batches

### b1 — home and section

Keep the shared shell, real lead/recent order, server views, scoped assets, responsive preload helper, and existing image-free states. Change `cinematic-feature/home.tsx`, `section.tsx`, `story-card.tsx`, `shell.tsx`, `styles.ts`, and `tokens.ts` within that direction folder:

- Replace the current cover-side `recent.slice(0, 3)` numbered list and further grid ([home.tsx](../../../packages/web/src/reader-directions/cinematic-feature/home.tsx)) with the two-secondary-card and remaining-row composition. Remove decorative ordinals; show every story exactly once.
- Replace the uniform section grid ([section.tsx](../../../packages/web/src/reader-directions/cinematic-feature/section.tsx)) with the first-story feature plus remaining grid. Avoid duplicating its first story.
- Put the masthead in normal flow; replace gradient-protected headline text with solid panels; apply the grid, type, contrast, credits, card sizes and priority rules. Remove entrance motion and tiny metadata. Keep the article readable while shared direction styles change.
- Update view assertions and capture home/section at 390, 768, 1440px in both themes, plus article regression screenshots. Verify empty, image-free, longest-title, one-story and many-section navigation cases.

Acceptance: scoped contract/registry/view/font tests, layout/axe/focus checks, exactly one heading/preload as applicable, matching lead sizes, and no duplicate/missing supplied stories. Recheck all three existing pages because shell/tokens/styles are shared.

### b2 — article, author, topic, related

Prerequisites: confirm shared kit exports and routes are merged at the implementation base; stage and verify genuine Archivo italic assets/provenance. These are explicit dependencies, not evidence supplied by this spec.

- Change [article.tsx](../../../packages/web/src/reader-directions/cinematic-feature/article.tsx) from its current title/hero/body-only composition to the specified header, linked byline, figure strip, body and end modules. Add direction `author.tsx` and `topic.tsx`, registering optional views only through the actual shared-kit API in `index.ts`.
- Style every block/mark in section 7; bound body images/galleries to the shared sizes slots. Preserve `ArticleBody`, document semantics, supplied metadata, and original-image fallbacks.
- Add nullable bio/description, empty author/topic collections, author links, multi-author wrapping, missing topics and duplicate/current related-story cases to view/browser checks. Preserve name-only fallback where supported by the merged contract.
- Update `fonts.ts`, font provenance and authenticity tests for the italic addition, including combined bold/italic and the total byte budget. Do not borrow another direction's font URL or preload it globally.

Acceptance: all five page types implemented on real supplied views; no invented profiles/queries, correct headings/links/credits, complete block/mark coverage, and readable cold fallback. Capture all five types in both themes at 390, 768 and 1440px; add a 1536px gallery capture. If kit or italic prerequisites are missing, report the specific incomplete slice instead of claiming b2 complete.

### b3 — media, accessibility, and Core Web Vitals evidence

Keep semantic/shared rendering and the no-late-font-swap policy. Complete the comparison evidence and correct presentation defects without weakening thresholds:

- Verify chosen image candidates, widths, bytes, focal crops and preload parity; test known/unknown dimensions, portrait/landscape, image-free, animated/GIF fallback and unavailable media. Record the conservative nested-image sizes limitation.
- Run the section 9 accessibility matrix and manual review, including longest-title and image extremes; resolve the separate shared error/not-found companion with its owner. Do not edit global boundaries or shared renderers unless that build bead explicitly includes them.
- Run reproducible signed-in Lighthouse checks on home/article/section; cold/warm shift and interaction traces; author/topic route checks; visitor Baseline/font-isolation regressions. Keep screenshot and performance evidence separate.
- Reconcile the exact reviewed SHA with reports; attach failed checks and missing prerequisites. If the route-boundary companion remains unavailable, identify that gap in the client comparison and do not describe the developed-magazine acceptance as fully met.

Existing checks to extend/run on the implementation host include direction `views.test.tsx`, `fonts.test.ts` (which pins the generated font CSS), the shared contract/registry tests, direction `cinematic-feature.e2e.ts`, `tests/e2e/reader-lab.spec.ts`, and `tests/e2e/homepage.spec.ts`. Use the pinned repository toolchain and existing dependencies; this documentation bead runs only formatting, reference/coverage checks and whitespace validation. Roll back a direction batch by reverting its implementation commit; coordinate shared-kit changes separately. Every build keeps the other four directions and visitor Baseline behavior intact; merge and publishing remain operator decisions.

## 12. Client questions

1. Does the dark photographic opening with a light reading surface feel right for the magazine, or should light mode use a light shell too? Build the dark-shell version specified here for the comparison; a changed preference is a subsequent design revision.
2. On a phone, does the solid title panel and 4:3 crop preserve the meaning of the client's actual photographs? Review representative portrait and landscape stories, not just North House. Keep the specified panel and focal-point behavior until that review supplies a concrete change.

Neither question blocks writing or building the comparison version. Author/topic data availability, font provenance, and shared error rendering are engineering dependencies above, not questions for the client to solve.
