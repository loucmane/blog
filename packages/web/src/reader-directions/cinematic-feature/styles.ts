/** Only the active direction root emits these scoped styles. */
export const styles = `
  & { background: var(--cf-ground); color: var(--cf-ink); }
  & .cf-page { font-family: var(--cf-sans); font-size: var(--cf-body); font-weight: 400; font-stretch: 100%; font-synthesis: weight style; line-height: 1.5; overflow-wrap: anywhere; min-height: 100vh; }
  & .cf-page * { box-sizing: border-box; min-width: 0; }
  & .cf-page :where(h1, h2, h3, h4, h5, h6, p, ul, ol, figure, blockquote) { margin: 0; }
  & .cf-page :is(h1, h2, h3, h4, h5, h6) { font-family: var(--cf-sans); }
  & .cf-page :where(h1, h2, h3, h4, h5, h6) { font-weight: 800; font-stretch: 75%; letter-spacing: -0.015em; text-wrap: pretty; }
  & .cf-page :where(ul, ol:not([type])) { padding: 0; list-style: none; }
  & .cf-page :where(a) { color: inherit; text-decoration: none; text-underline-offset: 0.2em; text-decoration-thickness: 1px; }
  & .cf-page a:is(:hover, :focus-visible) { text-decoration-line: underline; }
  & .cf-page :focus-visible { outline: 3px solid var(--cf-amber); outline-offset: 3px; }
  & .cf-reading-surface :focus-visible, & .cf-author-bio :focus-visible { outline-color: var(--cf-body-accent); }
  & .cf-page img { border-radius: 0; }
  & .cf-page ::selection { color: var(--cf-ground); background: var(--cf-amber); }
  & .cf-skip { position: absolute; z-index: 10; top: 1rem; left: var(--cf-gutter); transform: translateY(-200%); padding: 1rem; background: var(--cf-ground); color: var(--cf-ink); font: 400 var(--cf-small)/1.5 var(--cf-mono); }
  & .cf-skip:focus { transform: none; }
  & .cf-masthead { position: relative; z-index: 2; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 0.5rem 3rem; padding: 1.25rem max(var(--cf-gutter), calc((100% - var(--cf-page)) / 2)); border-bottom: 1px solid var(--cf-slate); background: var(--cf-ground); }
  & .cf-page .cf-wordmark { font-family: var(--cf-sans); font-size: var(--cf-wordmark); font-weight: 800; font-stretch: 100%; letter-spacing: -0.04em; line-height: 1.1; }
  & .cf-wordmark a { display: inline-flex; align-items: center; min-height: 44px; min-width: 44px; }
  & .cf-masthead ul { display: flex; flex-wrap: wrap; gap: 0.5rem 1.5rem; }
  & .cf-masthead nav a { display: flex; align-items: center; min-height: 44px; min-width: 44px; padding-block: 0.5rem; font: 400 var(--cf-small)/1.6 var(--cf-mono); }
  & .cf-masthead a[aria-current] { text-decoration: underline; text-underline-offset: 0.5em; text-decoration-color: var(--cf-amber); }
  & .cf-page .cf-label, & .cf-story-meta { font-family: var(--cf-mono); font-size: var(--cf-label); font-style: normal; font-stretch: 100%; font-weight: 400; line-height: 1.6; color: var(--cf-amber); }
  & .cf-page .cf-label, & .cf-story-meta a { text-transform: uppercase; font-weight: 500; letter-spacing: 0.03em; }
  & .cf-story-meta { display: flex; align-items: center; flex-wrap: wrap; gap: 0.5rem 1.5rem; }
  & .cf-story-meta a { display: inline-flex; align-items: center; min-height: 44px; min-width: 44px; }
  & .cf-story-meta > span { color: var(--cf-secondary); font-weight: 400; }
  & .cf-page .cf-title { font-size: var(--cf-title); font-weight: 850; font-stretch: 68%; text-transform: uppercase; line-height: 1.02; letter-spacing: -0.015em; max-width: 20ch; }
  & .cf-dek { max-width: 48ch; font-size: var(--cf-dek); font-weight: 400; line-height: 1.5; color: var(--cf-secondary); margin-top: 0.75rem; }
  & .cf-cover { display: grid; grid-template-columns: minmax(0, 1fr); }
  /* The shared figure keeps its caption semantics. Only the media occupies the
     first grid row; the caption has its own opaque strip at every breakpoint. */
  & .cf-cover-image, & .cf-cover-image figure { display: contents; object-position: inherit; }
  & .cf-cover-image figure > :not(figcaption) { display: block; position: relative; grid-row: 1; grid-column: 1; aspect-ratio: 4 / 3; object-position: inherit; }
  & .cf-cover-image picture, & .cf-card-image picture, & .cf-thumbnail picture { object-position: inherit; }
  & .cf-cover-image img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: inherit; }
  & .cf-cover-image figcaption { grid-row: 2; grid-column: 1; padding: 1rem max(var(--cf-gutter), calc((100% - var(--cf-page)) / 2)); background: var(--cf-ground); border-bottom: 1px solid var(--cf-slate); }
  & .cf-cover-content { grid-row: 3; grid-column: 1; width: min(100% - var(--cf-gutter) * 2, var(--cf-page)); margin-inline: auto; }
  & .cf-lead { background: var(--cf-ground); padding: 1.5rem; }
  & .cf-lead .cf-title { margin-top: 0.5rem; }
  & .cf-page .cf-title a { display: block; min-width: 44px; min-height: 44px; text-decoration: none; }
  & .cf-page .cf-title a:is(:hover, :focus-visible) { text-decoration-line: underline; text-decoration-thickness: 1px; text-underline-offset: 0.08em; }
  & .cf-read { display: inline-flex; align-items: center; gap: 2rem; min-height: 44px; min-width: 44px; margin-top: 1.5rem; padding-block: 0.75rem; border-bottom: 1px solid var(--cf-ui-rule); font: 400 var(--cf-small)/1.6 var(--cf-mono); }
  & .cf-read span { color: var(--cf-amber); }
  & .cf-row { display: grid; grid-template-columns: minmax(0, 1fr) 80px; gap: var(--cf-gap); padding-block: 1.5rem; border-top: 1px solid var(--cf-slate); align-items: start; }
  & .cf-row-media { width: 80px; }
  & .cf-thumbnail { width: 100%; aspect-ratio: 1; position: relative; }
  & .cf-thumbnail img { position: absolute; inset: 0; height: 100%; width: 100%; object-fit: cover; object-position: inherit; }
  & .cf-thumbnail > div { height: 100%; aspect-ratio: auto; object-position: inherit; }
  & .cf-interior, & .cf-section-header, & .cf-section-empty, & .cf-empty, & .cf-footer { width: min(100% - var(--cf-gutter) * 2, var(--cf-page)); margin-inline: auto; }
  & .cf-grid { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--cf-space) var(--cf-gap); }
  & .cf-module { margin-top: var(--cf-space); }
  & .cf-page .cf-module-title { font-size: 1.5rem; font-stretch: 85%; line-height: 1.2; margin-bottom: 1.5rem; }
  & .cf-card-image { margin-bottom: 1rem; object-position: inherit; }
  & .cf-card-image figure { object-position: inherit; }
  & .cf-card-image figure > :not(figcaption) { display: block; position: relative; aspect-ratio: 3 / 2; object-position: inherit; }
  & .cf-card-image img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: inherit; }
  & .cf-card-image figcaption, & .cf-row-media figcaption { margin-top: 1rem; }
  & .cf-page .cf-card-title { font-size: var(--cf-card); font-stretch: 85%; line-height: 1.15; margin-top: 0.5rem; }
  & .cf-card-title a { display: block; min-height: 44px; min-width: 44px; }
  & .cf-card-dek { margin-top: 0.75rem; font-size: var(--cf-copy); line-height: 1.6; color: var(--cf-secondary); max-width: 55ch; }
  & .cf-card-text { border-top: 1px solid var(--cf-slate); padding-top: 1.5rem; }
  & .cf-feature { grid-column: 1 / -1; }
  & .cf-page .cf-feature .cf-card-title { font-size: var(--cf-feature); }
  & .cf-feature .cf-card-image figure > :not(figcaption) { aspect-ratio: 4 / 3; }
  & .cf-row.cf-card-text, & .cf-feature.cf-card-text { grid-template-columns: minmax(0, 1fr); }
  & .cf-hero-text { border-bottom: 1px solid var(--cf-slate); }
  & .cf-cover.cf-hero-text { grid-template-rows: auto; }
  & .cf-cover.cf-hero-text .cf-cover-content { grid-row: 1; padding-block: 1.5rem; }
  & .cf-article-hero { position: relative; isolation: isolate; display: grid; grid-template-columns: minmax(0, 1fr); }
  & .cf-hero, & .cf-hero figure { display: contents; object-position: inherit; }
  & .cf-hero figure > :not(figcaption) { display: block; position: relative; grid-row: 2; grid-column: 1; object-position: inherit; aspect-ratio: 4 / 3; }
  & .cf-hero picture { object-position: inherit; }
  & .cf-hero img { position: absolute; inset: 0; height: 100%; width: 100%; object-fit: cover; object-position: inherit; }
  & .cf-hero figcaption { grid-row: 3; grid-column: 1; padding: 1rem max(var(--cf-gutter), calc((100% - var(--cf-page)) / 2)); background: var(--cf-ground); border-bottom: 1px solid var(--cf-slate); }
  & .cf-article-heading { grid-row: 1; grid-column: 1; position: relative; z-index: 1; width: min(100% - var(--cf-gutter) * 2, var(--cf-page)); margin-inline: auto; }
  & .cf-article-panel { padding: 1.5rem; background: var(--cf-ground); }
  & .cf-article-panel .cf-title { margin-top: 0.5rem; }
  & .cf-article-hero.cf-hero-text { grid-template-rows: auto; }
  & .cf-credits { display: flex; align-items: center; flex-wrap: wrap; gap: 0.75rem 2rem; margin-top: 2rem; font: 400 var(--cf-small)/1.6 var(--cf-mono); color: var(--cf-secondary); }
  & .cf-byline { display: block; }
  & .cf-byline a { display: inline-flex; align-items: center; min-width: 44px; min-height: 44px; text-decoration: underline; }
  & .cf-page figcaption { font: 400 var(--cf-small)/1.6 var(--cf-mono); color: var(--cf-secondary); }
  & .cf-page figcaption a { text-decoration: underline; }
  & .cf-reading-surface { background: var(--cf-paper); color: var(--cf-body-ink); padding: var(--cf-space) var(--cf-gutter); container-type: inline-size; }
  & .cf-body { max-width: var(--cf-measure); margin-inline: auto; font-size: var(--cf-body); font-stretch: 100%; line-height: var(--cf-leading); display: flow-root; }
  & .cf-body > * + * { margin-top: 1.5rem; }
  & .cf-body :is(h2, h3, h4, h5, h6) { line-height: 1.2; margin-block: 3rem 1rem; font-stretch: 85%; }
  & .cf-body :is(h2, h3, [data-block='pull-quote']) em { font-stretch: 100%; }
  & .cf-body h2 { font-size: var(--cf-heading); }
  & .cf-body h3 { font-size: var(--cf-h3); }
  & .cf-body :is(h4, h5, h6) { font-weight: 700; font-stretch: 100%; line-height: 1.35; }
  & .cf-body h4 { font-size: var(--cf-h4); }
  & .cf-body h5 { font-size: var(--cf-h5); }
  & .cf-body h6 { font-size: var(--cf-h6); }
  & .cf-body strong { font-weight: 700; }
  & .cf-body a { color: var(--cf-body-accent); text-decoration: underline; }
  & .cf-body figcaption { margin-top: 1rem; color: var(--cf-body-secondary); }
  & .cf-body :where(ul, ol) { padding-left: 1.5rem; }
  & .cf-body ul { list-style-type: disc; }
  & .cf-body ol:not([type]) { list-style-type: decimal; }
  & .cf-body li + li { margin-top: 0.5rem; }
  & .cf-body :where(li, blockquote, [data-block='editorial'], [data-block='callout']) > :where(* + *) { margin-top: 1.5rem; }
  & .cf-body blockquote { border-left: 2px solid var(--cf-body-accent); padding-left: 1.5rem; }
  & .cf-body [data-block='pull-quote'] { margin-block: 3rem; border-block: 1px solid var(--cf-body-accent); padding-block: 2rem; }
  & .cf-body [data-block='pull-quote'] blockquote { padding: 0; border: 0; font-size: var(--cf-pull-quote); font-weight: 700; font-stretch: 85%; line-height: 1.25; }
  & .cf-body figure:has(picture), & .cf-body [data-block='gallery'] { margin-block: 3rem; }
  & .cf-body > figure:has(picture), & .cf-body > [data-block='gallery'] { width: calc(100cqw + var(--cf-gutter) * 2); margin-inline: calc((100% - 100cqw) / 2 - var(--cf-gutter)); }
  & .cf-body > figure:has(picture) figcaption { padding-inline: var(--cf-gutter); }
  & .cf-body [data-block='gallery'] { list-style: none; padding: 0; display: grid; grid-template-columns: minmax(0, 1fr); gap: 1.5rem; align-items: start; }
  & .cf-body [data-block='gallery'] li { margin: 0; }
  & .cf-body [data-block='gallery'] figure { margin: 0; }
  & .cf-body > [data-block='gallery'] figcaption { padding-inline: var(--cf-gutter); }
  & .cf-body [data-block='checklist'] { list-style: none; padding: 0; }
  & .cf-body [data-block='checklist'] li { position: relative; padding-left: 1.75rem; }
  & .cf-body [data-block='checklist'] li > span[aria-hidden] { position: absolute; left: 0; top: 0; color: var(--cf-body-accent); }
  & .cf-body [data-block='checklist'] li > p { margin-top: 0; }
  & .cf-body :is([data-block='callout'], [data-block='editorial'], [data-block='embed']) { padding: 1.5rem; border: 1px solid var(--cf-body-secondary); background: var(--cf-paper); }
  & .cf-body [data-block='callout'] { padding: 1rem; }
  & .cf-body [data-block='callout'][data-variant='warning'] { border-left: 3px solid var(--cf-body-accent); }
  & .cf-body [data-block='editorial'] { margin-block: 2rem; }
  & .cf-body [data-block='editorial'][data-variant='key-points'] { border: 0; border-left: 3px solid var(--cf-body-accent); }
  & .cf-body [data-block='editorial'][data-variant='methodology'] { border-inline: 0; }
  & .cf-body [data-block='editorial'] > :first-child { margin-top: 0; }
  & .cf-body [data-block='embed'] a { display: inline-block; min-height: 44px; padding-block: 0.5rem; }
  & .cf-body code { font-family: var(--cf-mono); font-size: 0.9em; font-style: normal; font-weight: 400; font-stretch: 100%; overflow-wrap: anywhere; }
  & .cf-body code :is(em, strong) { font-style: normal; font-weight: 400; font-stretch: 100%; }
  & .cf-body pre { padding: 1rem; border-block: 1px solid var(--cf-body-secondary); white-space: pre-wrap; overflow-wrap: anywhere; font: 400 1rem/1.6 var(--cf-mono); }
  & .cf-body pre code { font-size: inherit; font-weight: 400; }
  & .cf-body hr { border: 0; border-top: 1px solid var(--cf-body-accent); margin-block: 3rem; }
  & .cf-section-header { padding-block: var(--cf-space); }
  & .cf-section-header .cf-label { margin-bottom: 1rem; }
  & .cf-page .cf-collection-title { font-size: var(--cf-collection-title); font-stretch: 75%; line-height: 1.05; }
  & .cf-section-header .cf-dek { max-width: 55ch; }
  & .cf-author-bio { background: var(--cf-paper); color: var(--cf-body-secondary); max-width: calc(55ch + 3rem); padding: 1.5rem; margin-top: 1.5rem; line-height: 1.7; }
  & .cf-author-bio p { max-width: 55ch; white-space: pre-line; }
  & .cf-article-end { max-width: var(--cf-page); margin-inline: auto; margin-top: 3rem; border-top: 1px solid var(--cf-body-accent); padding-top: 2rem; }
  & .cf-topics { max-width: var(--cf-measure); margin-inline: auto; }
  & .cf-topics ul { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  & .cf-topics a { display: inline-flex; align-items: center; min-width: 44px; min-height: 44px; padding: 0.5rem; border: 1px solid var(--cf-ui-rule); font: 400 var(--cf-small)/1.6 var(--cf-mono); color: var(--cf-body-accent); text-decoration: underline; }
  & .cf-article-end > * + * { margin-top: 3rem; }
  & .cf-reading-surface .cf-story-meta, & .cf-reading-surface .cf-story-meta a { color: var(--cf-body-accent); }
  & .cf-reading-surface .cf-story-meta > span, & .cf-reading-surface .cf-card-dek, & .cf-reading-surface figcaption { color: var(--cf-body-secondary); }
  & .cf-reading-surface figcaption a, & .cf-article-return a { color: var(--cf-body-accent); }
  & .cf-reading-surface .cf-card-text { border-color: var(--cf-body-secondary); }
  & .cf-article-return { max-width: var(--cf-measure); margin-inline: auto; }
  & .cf-article-return .cf-read { margin-top: 0; }
  & .cf-empty, & .cf-section-empty { max-width: 42rem; margin-left: max(var(--cf-gutter), calc((100% - var(--cf-page)) / 2)); margin-right: 0; }
  & .cf-empty { padding-block: var(--cf-space); }
  & .cf-empty h2 { font-size: var(--cf-collection-title); line-height: 1.05; margin-block: 1.5rem; }
  & .cf-empty > p:last-child, & .cf-section-empty p { color: var(--cf-secondary); }
  & .cf-section-empty { padding-bottom: 2rem; }
  & .cf-failure { width: min(100% - var(--cf-gutter) * 2, 42rem); margin-left: max(var(--cf-gutter), calc((100% - var(--cf-page)) / 2)); padding-block: var(--cf-space); }
  & .cf-failure > p { margin-top: 1.5rem; color: var(--cf-secondary); }
  & .cf-failure-actions { display: flex; align-items: center; flex-wrap: wrap; gap: 1rem; margin-top: 2rem; }
  & .cf-failure-actions .cf-read { margin-top: 0; }
  & .cf-retry { display: inline-flex; align-items: center; justify-content: center; min-width: 44px; min-height: 44px; padding: 0.75rem 1rem; border: 1px solid var(--cf-ui-rule); background: var(--cf-amber); color: var(--cf-ground); font: 500 var(--cf-small)/1.6 var(--cf-mono); cursor: pointer; }
  & .cf-retry:is(:hover, :focus-visible) { text-decoration: underline; text-underline-offset: 0.2em; }
  & .cf-retry:focus-visible { outline-color: var(--cf-ground); box-shadow: 0 0 0 9px var(--cf-amber); }
  & .cf-footer { padding-block: 2rem 4rem; margin-top: var(--cf-space); border-top: 1px solid var(--cf-slate); display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem 2rem; }
  & .cf-footer p { font-weight: 800; }
  & .cf-footer a { display: inline-flex; align-items: center; gap: 2rem; min-height: 44px; font: 400 var(--cf-small)/1.8 var(--cf-mono); }
  @media (min-width: 768px) {
    & { --cf-gutter: 2rem; --cf-gap: 1.5rem; --cf-space: 4rem; --cf-body: 1.25rem; --cf-copy: 1.125rem; --cf-card: 2rem; --cf-feature: 2rem; --cf-dek: 1.375rem; --cf-title: 4rem; --cf-collection-title: 3.5rem; --cf-heading: 2.25rem; --cf-h3: 1.75rem; --cf-h4: 1.5rem; --cf-h5: 1.375rem; --cf-h6: 1.25rem; }
    & .cf-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    & .cf-cover-image figure > :not(figcaption) { aspect-ratio: 16 / 9; }
    & .cf-feature .cf-card-image figure > :not(figcaption) { aspect-ratio: 3 / 2; }
    & .cf-hero figure > :not(figcaption) { aspect-ratio: 16 / 9; }
    & .cf-body > figure:has(picture), & .cf-body > [data-block='gallery'] { width: min(42rem, 100cqw); margin-inline: calc((100% - min(42rem, 100cqw)) / 2); }
    & .cf-body > figure:has(picture) figcaption, & .cf-body > [data-block='gallery'] figcaption { padding-inline: 0; }
    & .cf-body [data-block='callout'] { padding: 1.5rem; }
  }
  @media (min-width: 1024px) {
    & { --cf-gutter: 3rem; --cf-gap: 2rem; --cf-space: 6rem; --cf-feature: 2.5rem; --cf-dek: 1.5rem; --cf-title: clamp(4rem, 6vw, 7rem); --cf-collection-title: 4.5rem; --cf-wordmark: 1.75rem; --cf-heading: 2.5rem; --cf-h3: 1.875rem; --cf-pull-quote: 2.5rem; }
    & .cf-cover { grid-template-rows: minmax(clamp(32rem, 56.25vw, 56rem), auto) auto; }
    & .cf-cover-image figure > :not(figcaption) { aspect-ratio: auto; height: 100%; }
    & .cf-cover-content { grid-row: 1; align-self: end; position: relative; display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: var(--cf-gap); margin-block: 1.5rem; }
    & .cf-lead { grid-column: span 8; }
    & .cf-feature { display: grid; grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: var(--cf-gap); align-items: center; }
    & .cf-feature .cf-card-image { margin-bottom: 0; }
    & .cf-article-hero { grid-template-rows: minmax(clamp(32rem, 56.25vw, 56rem), auto) auto; }
    & .cf-article-heading { align-self: end; display: grid; grid-template-columns: repeat(12, minmax(0, 1fr)); gap: var(--cf-gap); margin-block: 1.5rem; }
    & .cf-article-panel { grid-column: span 8; }
    & .cf-hero figure > :not(figcaption) { grid-row: 1; aspect-ratio: auto; height: 100%; }
    & .cf-hero figcaption { grid-row: 2; }
    & .cf-related-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  }
  @media (min-width: 96rem) {
    @container (min-width: 85.5rem) {
      & .cf-body > [data-block='gallery']:is([data-layout='grid'], [data-layout='diptych']) { width: 85.5rem; margin-inline: calc((100% - 85.5rem) / 2); grid-template-columns: repeat(2, minmax(0, 42rem)); }
    }
  }
  @media (max-width: 767px) {
    & .cf-masthead { padding-block: 0.75rem; gap: 0.5rem; }
    & .cf-masthead nav { flex-basis: 100%; }
    & .cf-masthead ul { column-gap: 1.25rem; }
  }
  @media (prefers-reduced-motion: reduce) {
    & .cf-page *, & .cf-page *::before, & .cf-page *::after { scroll-behavior: auto; animation: none; transition: none; }
  }
  @media (forced-colors: active) {
    & { --cf-ground: Canvas; --cf-ink: CanvasText; --cf-secondary: CanvasText; --cf-amber: LinkText; --cf-slate: CanvasText; --cf-ui-rule: ButtonBorder; --cf-paper: Canvas; --cf-body-ink: CanvasText; --cf-body-secondary: CanvasText; --cf-body-accent: LinkText; }
    & .cf-page a { color: LinkText; }
    & .cf-retry { background: ButtonFace; color: ButtonText; }
    & .cf-retry:focus-visible { box-shadow: none; }
    & .cf-page :focus-visible { outline-color: Highlight; }
  }
  @media print {
    & .cf-masthead nav, & .cf-skip, & .cf-footer, & .cf-retry { display: none; }
    & .cf-cover-page { display: block; }
    & .cf-article-hero { display: block; }
    & .cf-article-heading { display: block; }
    & .cf-hero img { position: static; height: auto; }
    & .cf-body :is(h2, h3, h4, h5, h6) { break-after: avoid; }
    & .cf-body > figure:has(picture), & .cf-body > [data-block='gallery'] { width: 100%; margin-inline: 0; }
  }
`
