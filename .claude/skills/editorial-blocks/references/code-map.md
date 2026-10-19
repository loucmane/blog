# Editorial document and reader contract map

This describes the Task 53 starting code. Re-read affected sources at the reviewed revision.
Separate enforced validation from converter fallbacks and visual design intentions.

## Stored document boundary

`packages/web/src/server/content/document.ts` defines document schema version 4 and a
2,000,000-byte JSON limit. A document carries articleId, title, schemaVersion,
migrationProvenance, and `document`, whose root node has type `doc`. Attribute objects are strict; arbitrary HTML nodes
and arbitrary marks are not supported.

- Inspection returns `valid` or `quarantined`. Quarantine preserves the original and issues;
  unknown nodes also record their original node, path, and type. Unknown marks produce
  issues. `parseContentDocument` throws on quarantine. Do not silently strip unsupported
  content to make it acceptable.
- `migrateContentDocument` clones input and records provenance. Registered migrations
  advance v1 to v2 (callout/media attributes), v2 to v3 (credit objects), and v3 to v4
  (version increment). Current-version parsing does not automatically migrate old input;
  `parseMigratedContentDocument` uses the migration path. Future versions quarantine.
- `doc` and `editorialBlock` contain block nodes. Bullet/ordered lists contain listItem;
  taskList contains taskItem; both item types contain blocks. CodeBlock contains text.
  Paragraph, heading, callout, pullQuote, and blockquote accept inline children (text and
  hardBreak). Leaf nodes cannot contain nonempty children. Converter tolerance does not
  widen the document schema: blockquote accepts inline children in validation even though
  the reader converter can also handle nested block children defensively.
- Text supports bold, code, italic, link, strike, underline. Only text accepts marks.
  Link validation accepts specific attributes, but the reader projection keeps only href.
  URL validation details and provider trust belong to `security-identity-privacy`.

## Projection and shared renderer

Follow `packages/web/src/reader/blocks.ts` into `packages/web/src/reader/views.ts`, then
`packages/web/src/reader/components/article-body.tsx`. `convertBlocks` drops empty blocks,
unknown/unhandled types and unservable images; it is not a document repair or validation API.
The valid document remains canonical, including metadata that is not projected to a view.

| Document node | Reader kind / rendered behavior | Contract detail to preserve |
| --- | --- | --- |
| paragraph | paragraph / p | Inline text and marks; empty text is omitted. |
| heading | heading / h2–h6 | Validator restricts levels 2–6; converter defaults unrecognized level to 2; page h1 stays with the direction. |
| blockquote | quote / blockquote | Inline text becomes a paragraph; defensive converter also accepts blocks, but validation does not. |
| pullQuote | pull-quote / figure, blockquote, figcaption | Required attribution in the document; emitted when present. |
| bulletList, listItem | bulleted-list / ul, li | Nested block content in each item. |
| orderedList, listItem | numbered-list / ol, li | Positive start, maximum 10,000 in validation; numbering 1/a/A/i/I. Optional/null type defaults to 1 in projection. |
| taskList, taskItem | checklist / ul | checked is boolean; glyph is aria-hidden, with Done/Not done screen-reader text. No interactive checkbox. |
| mediaImage | image / ReaderFigure | Resolve mediaId to a servable asset, preserving alt/caption/credit/focalPoint. |
| gallery | gallery / ul and ReaderFigure children | 1–50 media items; carousel/diptych/grid becomes data-layout. A carousel is a layout value, not an implemented interactive carousel control. |
| callout | callout / div role=note | note/tip/warning variants and label; inline body. |
| codeBlock | code / pre, code | Text and nullable language; data-language is metadata, not a syntax-highlighting engine. |
| horizontalRule | divider / hr | No child nodes. |
| embed | embed / figure with link and optional figcaption | YouTube/Vimeo provider, title, URL, fallback; no iframe or third-party player is rendered. |
| editorialBlock | editorial / labelled section | fact-box/key-points/methodology/related-stories; nested blocks. Required blockId is stored, but not projected into ArticleBlock or rendered as a DOM id. Related stories are nested content, not an automatic query. |
| doc, text, hardBreak | container / inline text / br | Doc supplies blocks; text and hardBreak are consumed inside inline content. |

The six marks render strong, code, em, a, s, u respectively; links use href and a fixed
`rel="noreferrer"`. Document link class/target/title/rel values are not passed through by
the reader. Preserve this distinction in a change review; security policy is a separate
handoff, not permission to copy all stored attributes into HTML.

Media items require nonempty alt, caption (which may be empty), credit name and nullable
URL, normalized focalPoint coordinates, and mediaId. `resolveImage` uses document metadata
with asset fallbacks; absent storage/asset produces no reader image. The shared
`packages/web/src/reader/components/reader-image.tsx` owns responsive images, captions and
credits. Styling should preserve its picture wrapper and semantic figures.

`splitLeadImage` moves only a first image block into the hero. `firstImage` can find a card
image in nested blocks or a gallery. `readingMinutes` uses 225 words/minute, rounded with
a minimum of one; image captions and embed fallback text are not counted by blockText.
`packages/web/src/reader/read-model.ts` projects published revisions. Authors are currently
empty and section descriptions are currently null; directions must not manufacture them.

## Reader Lab integration

`packages/web/src/reader-directions/README.md` documents the direction contract.
`packages/web/src/reader-directions/contract.ts` defines Home/Article/Section components
receiving `{ view }` with HomeView/ArticleView/SectionView. Directions render the whole page
below the layout, use one h1, and never fetch data, read cookies, or select the lab direction.
These are architectural conventions plus scoped tests, not all runtime-enforced guarantees.

`defineReaderDirection` validates/freeze-copies metadata, font declarations, tokens and
styles. Id and name limits are 48 characters; thesis limit is 180. Declared text pairs must
reach 4.5:1 in light and merged dark palettes. Registry creation rejects duplicate ids,
case-insensitive duplicate names, empty registries, and unregistered defaults. This does
not by itself prove valid rendered landmarks, all color states, or font file existence.

`packages/web/src/reader-directions/registry.ts` registers six directions: baseline,
quiet-monograph, literary-longread, swiss-index, cinematic-feature, expressive-colour.
Baseline is the public default. Each designed direction's article component uses ArticleBody:

- `packages/web/src/reader-directions/quiet-monograph/article.tsx`
- `packages/web/src/reader-directions/literary-longread/article.tsx`
- `packages/web/src/reader-directions/swiss-index/article.tsx`
- `packages/web/src/reader-directions/cinematic-feature/article.tsx`
- `packages/web/src/reader-directions/expressive-colour/article.tsx`

Add a direction by defining its components/metadata and registering it; do not duplicate
reader routes or the block renderer. Shared data-block/data-variant/data-layout hooks are
the styling seam. `packages/web/src/reader-directions/direction-root.tsx` emits selected
font rules and scoped styles/tokens. Fonts are WOFF2 data with adjusted fallbacks; registry
tests forbid importing next/font or CSS in direction modules. Hand aesthetic and font
performance judgment to `reader-frontend` while retaining the shared contract here.

## Verification

Check the affected validation, projection, rendered semantics and direction integration:

- `packages/web/src/server/content/document.test.ts` — parser/migrations/quarantine;
- `packages/web/src/reader/blocks.test.ts` — block and mark conversion, image extraction;
- `packages/web/src/reader/read-model.test.ts` — published view projection;
- `packages/web/src/reader-directions/contract.test.ts` and
  `packages/web/src/reader-directions/registry.test.ts` — definition/registration and isolation;
- each affected direction's `views.test.tsx`, plus `tests/e2e/reader.spec.ts` for browser
  behavior and `tests/e2e/reader-lab.spec.ts` for the axe sweep across every registered direction. Match assertions to changed semantics; a screenshot does not prove schema safety.

```sh
corepack pnpm exec vitest run packages/web/src/server/content/document.test.ts packages/web/src/reader/blocks.test.ts packages/web/src/reader/read-model.test.ts packages/web/src/reader-directions
```

Run only within the active task's scope and available prerequisites; record gaps. These
fixtures and deterministic path routes do not implement Task 55's general prompt router
or establish model routing accuracy.
